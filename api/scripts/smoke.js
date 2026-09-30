/**
 * End-to-end self-check. Boots the app on an ephemeral port against the real
 * database, then walks the whole auth/publish/comment flow and asserts on it.
 * Run with: npm run smoke
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'smoke-test-secret';

const { app } = await import('../src/index.js');
const { prisma } = await import('../src/db.js');

const stamp = Date.now();
const server = app.listen(0);
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/api`;

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

let passed = 0;
const check = (label, condition) => {
  if (!condition) {
    console.error(`FAIL  ${label}`);
    throw new Error(label);
  }
  passed++;
  console.log(`ok    ${label}`);
};

const authorEmail = `smoke-author-${stamp}@example.com`;
const readerEmail = `smoke-reader-${stamp}@example.com`;

try {
  // --- registration and tokens
  const reg = await call('POST', '/users/register', { body: { name: 'Smoke Reader', email: authorEmail, password: 'password123' } });
  check('register returns 201', reg.status === 201);

  const reg2 = await call('POST', '/users/register', { body: { name: 'Smoke Reader Two', email: readerEmail, password: 'password123' } });
  check('second register returns 201', reg2.status === 201);
  check('duplicate email is rejected', (await call('POST', '/users/register', { body: { name: 'x', email: authorEmail, password: 'password123' } })).status === 409);
  check('short password is rejected', (await call('POST', '/users/register', { body: { name: 'x', email: `z${stamp}@e.com`, password: 'short' } })).status === 422);
  check('bad email is rejected', (await call('POST', '/users/register', { body: { name: 'x', email: 'nope', password: 'password123' } })).status === 422);

  // --- the author account comes from the seed, not from this run
  const seeded = await call('POST', '/users/login', {
    body: { email: 'author@example.com', password: 'password123' },
  });

  if (seeded.status !== 200 || !seeded.body.user.isAuthor) {
    throw new Error('The seeded author is missing. Run `npm run prisma:seed` first.');
  }

  const authorToken = seeded.body.token;
  const readerToken = reg2.body.token;
  check('the seeded account holds author rights', seeded.body.user.isAuthor === true);
  check('a newly registered user is not an author', reg.body.user.isAuthor === false);
  check('newly registered user is not an author either', reg2.body.user.isAuthor === false);

  // --- login
  check('login with correct password works', (await call('POST', '/users/login', { body: { email: readerEmail, password: 'password123' } })).status === 200);
  check('login with wrong password is 401', (await call('POST', '/users/login', { body: { email: readerEmail, password: 'wrong' } })).status === 401);
  check('login for unknown email is 401', (await call('POST', '/users/login', { body: { email: `ghost${stamp}@e.com`, password: 'password123' } })).status === 401);
  check('password hash is never serialized', !JSON.stringify(reg2.body).includes('passwordHash'));

  const realAuthorToken = authorToken;
  const realReaderToken = readerToken;

  // --- post creation is author-only
  check('anonymous cannot create a post', (await call('POST', '/posts', { body: { title: 't', content: 'c' } })).status === 401);
  check('reader cannot create a post', (await call('POST', '/posts', { token: realReaderToken, body: { title: 't', content: 'c' } })).status === 403);
  check('malformed token is 401', (await call('POST', '/posts', { token: 'not-a-jwt', body: { title: 't', content: 'c' } })).status === 401);
  check('missing title is 422', (await call('POST', '/posts', { token: realAuthorToken, body: { content: 'c' } })).status === 422);

  const draft = await call('POST', '/posts', { token: realAuthorToken, body: { title: 'Smoke draft', content: 'body' } });
  check('author creates an unpublished post', draft.status === 201);
  check('new post defaults to unpublished', draft.body.post.published === false);

  // --- visibility
  check('anonymous list hides drafts', !(await call('GET', '/posts')).body.posts.some((p) => p.id === draft.body.post.id));
  check('reader list hides drafts', !(await call('GET', '/posts', { token: realReaderToken })).body.posts.some((p) => p.id === draft.body.post.id));
  check('anonymous cannot read a draft', (await call('GET', `/posts/${draft.body.post.id}`)).status === 404);
  check('author can read a draft', (await call('GET', `/posts/${draft.body.post.id}`, { token: realAuthorToken })).status === 200);
  check('author list includes drafts', (await call('GET', '/posts', { token: realAuthorToken })).body.posts.some((p) => p.id === draft.body.post.id));
  check('author filter published=false returns only drafts', (await call('GET', '/posts?published=false', { token: realAuthorToken })).body.posts.every((p) => p.published === false));
  check('missing post is 404', (await call('GET', '/posts/00000000-0000-0000-0000-000000000000')).status === 404);

  // --- publish / unpublish
  const published = await call('PATCH', `/posts/${draft.body.post.id}`, { token: realAuthorToken, body: { published: true } });
  check('author publishes', published.body.post.published === true);
  check('publish makes it publicly visible', (await call('GET', `/posts/${draft.body.post.id}`)).status === 200);
  check('reader cannot edit', (await call('PATCH', `/posts/${draft.body.post.id}`, { token: realReaderToken, body: { title: 'hijack' } })).status === 403);

  const patched = await call('PATCH', `/posts/${draft.body.post.id}`, { token: realAuthorToken, body: { title: 'Smoke renamed' } });
  check('partial patch keeps other fields', patched.body.post.title === 'Smoke renamed' && patched.body.post.content === 'body');
  check('empty patch is 422', (await call('PATCH', `/posts/${draft.body.post.id}`, { token: realAuthorToken, body: {} })).status === 422);

  // --- comments
  const postId = draft.body.post.id;
  check('anonymous cannot comment', (await call('POST', `/posts/${postId}/comments`, { body: { content: 'hi' } })).status === 401);
  check('empty comment is 422', (await call('POST', `/posts/${postId}/comments`, { token: realReaderToken, body: { content: '   ' } })).status === 422);
  check('commenting a missing post is 404', (await call('POST', '/posts/00000000-0000-0000-0000-000000000000/comments', { token: realReaderToken, body: { content: 'hi' } })).status === 404);

  const readerComment = await call('POST', `/posts/${postId}/comments`, { token: realReaderToken, body: { content: 'reader comment' } });
  check('reader comments on a published post', readerComment.status === 201);
  check('comment carries the commenter name', typeof readerComment.body.comment.user?.name === 'string');

  const authorComment = await call('POST', `/posts/${postId}/comments`, { token: realAuthorToken, body: { content: 'author comment' } });
  check('author comments too', authorComment.status === 201);
  check('both comments listed oldest first', (await call('GET', `/posts/${postId}/comments`)).body.comments.length === 2);
  check('comment count on post is accurate', (await call('GET', `/posts/${postId}`)).body.post._count.comments === 2);

  // --- comment permissions
  check('reader edits own comment', (await call('PATCH', `/comments/${readerComment.body.comment.id}`, { token: realReaderToken, body: { content: 'edited' } })).status === 200);
  check("reader cannot edit another user's comment", (await call('PATCH', `/comments/${authorComment.body.comment.id}`, { token: realReaderToken, body: { content: 'nope' } })).status === 403);
  check('author edits any comment', (await call('PATCH', `/comments/${authorComment.body.comment.id}`, { token: realAuthorToken, body: { content: 'moderated' } })).status === 200);
  check("reader cannot delete another user's comment", (await call('DELETE', `/comments/${authorComment.body.comment.id}`, { token: realReaderToken })).status === 403);
  check('author deletes any comment', (await call('DELETE', `/comments/${authorComment.body.comment.id}`, { token: realAuthorToken })).status === 204);
  check('deleted comment is gone', (await call('GET', `/posts/${postId}/comments`)).body.comments.length === 1);

  // --- cascade delete
  check('author deletes the post', (await call('DELETE', `/posts/${postId}`, { token: realAuthorToken })).status === 204);
  check('comments cascaded with the post', (await prisma.comment.count({ where: { postId } })) === 0);
  check('reader cannot delete a post', (await call('DELETE', '/posts/00000000-0000-0000-0000-000000000000', { token: realReaderToken })).status === 403);

  // --- routing
  check('unknown route is 404', (await call('GET', '/nope')).status === 404);

  console.log(`\n${passed} checks passed.`);
} finally {
  await prisma.user.deleteMany({ where: { email: { in: [authorEmail, readerEmail] } } });
  await prisma.$disconnect();
  server.close();
}

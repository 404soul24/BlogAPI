import { useCallback, useEffect, useState } from 'react';
import { api } from 'ui-kit/api';
import { navigate } from '../router.jsx';
import { formatDate } from '../format.js';

export default function PostTable() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const load = useCallback(() => {
    setError(null);
    api
      .listPosts()
      .then((data) => setPosts(data.posts))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  const toggle = async (post) => {
    setPendingId(post.id);
    setError(null);
    try {
      await api.updatePost(post.id, { published: !post.published });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (post) => {
    if (!window.confirm(`Delete "${post.title}" and all of its comments? This cannot be undone.`)) return;

    setPendingId(post.id);
    setError(null);
    try {
      await api.deletePost(post.id);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setPendingId(null);
    }
  };

  const publishedCount = posts?.filter((p) => p.published).length ?? 0;

  return (
    <section className="stack">
      <div className="row-between">
        <div>
          <h1 className="text-2xl">Posts</h1>
          {posts && (
            <p className="muted">
              {publishedCount} published · {posts.length - publishedCount} draft
              {posts.length - publishedCount === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/posts/new')}>
          New post
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {!posts ? (
        <p className="muted">Loading posts…</p>
      ) : posts.length === 0 ? (
        <div className="empty card">
          <p>No posts yet. Create the first one.</p>
        </div>
      ) : (
        <table className="post-table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
              <th scope="col">Comments</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <th scope="row" className="post-table-title">
                  {post.title}
                </th>
                <td>
                  <span className={`badge ${post.published ? 'badge-published' : 'badge-draft'}`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="muted">{formatDate(post.createdAt)}</td>
                <td className="muted">{post._count?.comments ?? 0}</td>
                <td className="post-table-actions">
                  <button
                    className="btn btn-sm"
                    onClick={() => toggle(post)}
                    disabled={pendingId === post.id}
                  >
                    {post.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => navigate(`/posts/${post.id}/edit`)}
                    disabled={pendingId === post.id}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => remove(post)}
                    disabled={pendingId === post.id}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

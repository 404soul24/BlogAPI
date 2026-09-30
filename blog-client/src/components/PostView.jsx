import { useCallback, useEffect, useState } from 'react';
import { api } from 'ui-kit/api';
import { navigate } from '../router.jsx';
import { formatDateTime } from '../format.js';
import CommentList from './CommentList.jsx';
import CommentForm from './CommentForm.jsx';

export default function PostView({ id, user }) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([api.getPost(id), api.listComments(id)])
      .then(([postData, commentData]) => {
        setPost(postData.post);
        setComments(commentData.comments);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(load, [load]);

  if (error) {
    return (
      <div className="stack">
        <div className="alert alert-error" role="alert">
          {error}
        </div>
        <button className="btn" onClick={() => navigate('/')}>
          ← Back to all posts
        </button>
      </div>
    );
  }

  if (!post) return <p className="muted">Loading post…</p>;

  return (
    <article className="stack post-view">
      <header className="stack">
        <h1 className="post-title">{post.title}</h1>
        <p className="muted post-meta">
          {formatDateTime(post.createdAt)} · {post.author?.name}
        </p>
      </header>

      <div className="prose">{post.content}</div>

      <section className="comments">
        <h2 className="comments-heading">{comments?.length ?? 0} comments</h2>

        {user ? (
          <CommentForm postId={id} onCreated={load} />
        ) : (
          <div className="alert alert-info">
            <a
              href="#/login"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              Log in
            </a>{' '}
            to join the discussion.
          </div>
        )}

        {comments && <CommentList comments={comments} user={user} onChanged={load} />}
      </section>

      <button className="btn post-back" onClick={() => navigate('/')}>
        ← Back to all posts
      </button>
    </article>
  );
}

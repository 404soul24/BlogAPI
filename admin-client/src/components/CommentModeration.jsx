import { useCallback, useEffect, useState } from 'react';
import { api } from 'ui-kit/api';
import CommentRow from './CommentRow.jsx';

export default function CommentModeration() {
  const [comments, setComments] = useState(null);
  const [error, setError] = useState(null);
  const [postFilter, setPostFilter] = useState('all');

  const load = useCallback(() => {
    setError(null);
    api
      .listAllComments()
      .then((data) => setComments(data.comments))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  const postIds = [...new Set((comments ?? []).map((c) => c.postId))];
  const visible = (comments ?? []).filter((c) => postFilter === 'all' || c.postId === postFilter);
  const postTitle = (id) => comments?.find((c) => c.postId === id)?.post.title ?? '';

  return (
    <section className="stack">
      <div className="row-between">
        <div>
          <h1 className="text-2xl">Comments</h1>
          {comments && <p className="muted">{comments.length} in total</p>}
        </div>

        <div className="field filter-field">
          <label className="label" htmlFor="post-filter">
            Filter by post
          </label>
          <select
            id="post-filter"
            className="select"
            value={postFilter}
            onChange={(e) => setPostFilter(e.target.value)}
            disabled={!comments}
          >
            <option value="all">All posts</option>
            {postIds.map((id) => (
              <option key={id} value={id}>
                {postTitle(id)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {!comments ? (
        <p className="muted">Loading comments…</p>
      ) : visible.length === 0 ? (
        <div className="empty card">
          <p>No comments to moderate.</p>
        </div>
      ) : (
        <div className="stack">
          {visible.map((comment) => (
            <CommentRow key={comment.id} comment={comment} onChanged={load} />
          ))}
        </div>
      )}
    </section>
  );
}

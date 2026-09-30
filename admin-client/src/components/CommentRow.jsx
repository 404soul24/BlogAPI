import { useState } from 'react';
import { api } from 'ui-kit/api';
import { formatDateTime } from '../format.js';

export default function CommentRow({ comment, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    try {
      await api.updateComment(comment.id, { content });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;

    setBusy(true);
    setError(null);
    try {
      await api.deleteComment(comment.id);
      onChanged();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="card comment-row">
      <p className="row comment-row-meta muted">
        <strong className="comment-author">{comment.user?.name}</strong>
        <span aria-hidden="true">·</span>
        <span>{formatDateTime(comment.createdAt)}</span>
        <span aria-hidden="true">·</span>
        <span className="comment-row-post">on “{comment.post?.title}”</span>
        {!comment.post?.published && <span className="badge badge-draft">on a draft</span>}
      </p>

      {editing ? (
        <form className="stack" onSubmit={save}>
          <div className="field">
            <label className="label" htmlFor={`admin-edit-${comment.id}`}>
              Edit comment
            </label>
            <textarea
              id={`admin-edit-${comment.id}`}
              className="textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
            />
          </div>
          <div className="row">
            <button className="btn btn-primary btn-sm" type="submit" disabled={busy || content.trim() === ''}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              className="btn btn-sm"
              type="button"
              onClick={() => {
                setContent(comment.content);
                setEditing(false);
              }}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="comment-body">{comment.content}</p>
          <div className="row comment-row-actions">
            <button className="btn btn-sm" onClick={() => setEditing(true)} disabled={busy}>
              Edit
            </button>
            <button className="btn btn-sm btn-danger" onClick={remove} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

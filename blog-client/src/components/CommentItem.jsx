import { useState } from 'react';
import { api } from 'ui-kit/api';
import { formatDateTime } from '../format.js';
import { CommentEditor } from './CommentList.jsx';

export default function CommentItem({ comment, user, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isOwner = user?.id === comment.userId;
  const canModify = isOwner || user?.isAuthor;

  const remove = async () => {
    if (busy) return;
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
    <div className="card comment">
      {editing ? (
        <CommentEditor comment={comment} onDone={() => { setEditing(false); onChanged(); }} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <p className="row comment-meta muted">
            <strong className="comment-author">{comment.user?.name}</strong>
            <span aria-hidden="true">·</span>
            <span>{formatDateTime(comment.createdAt)}</span>
            {user?.isAuthor && !isOwner && <span className="badge badge-neutral">author view</span>}
          </p>

          <p className="comment-body">{comment.content}</p>

          {canModify && (
            <div className="row comment-actions">
              {canModify && (
                <button className="btn btn-sm" onClick={() => setEditing(true)}>
                  Edit
                </button>
              )}
              <button className="btn btn-sm btn-danger" onClick={remove} disabled={busy}>
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
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

import { useState } from 'react';
import { api } from 'ui-kit/api';
import CommentItem from './CommentItem.jsx';

export default function CommentList({ comments, user, onChanged }) {
  if (comments.length === 0) {
    return <p className="muted comments-empty">No comments yet.</p>;
  }

  return (
    <ul className="comment-list">
      {comments.map((comment) => (
        <li key={comment.id}>
          <CommentItem comment={comment} user={user} onChanged={onChanged} />
        </li>
      ))}
    </ul>
  );
}

/** Inline edit form, used by the owner of a comment. */
export function CommentEditor({ comment, onDone, onCancel }) {
  const [content, setContent] = useState(comment.content);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.updateComment(comment.id, { content });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit}>
      <div className="field">
        <label className="label" htmlFor={`edit-${comment.id}`}>
          Edit your comment
        </label>
        <textarea
          id={`edit-${comment.id}`}
          className="textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={5000}
        />
      </div>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      <div className="row">
        <button className="btn btn-primary btn-sm" type="submit" disabled={busy || content.trim() === ''}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button className="btn btn-sm" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

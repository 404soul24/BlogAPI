import { useState } from 'react';
import { api } from 'ui-kit/api';

export default function CommentForm({ postId, onCreated }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      await api.createComment(postId, { content });
      setContent('');
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack comment-form" onSubmit={submit}>
      <div className="field">
        <label className="label" htmlFor="new-comment">
          Add a comment
        </label>
        <textarea
          id="new-comment"
          className="textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share what you think…"
          maxLength={5000}
        />
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <div>
        <button className="btn btn-primary" type="submit" disabled={busy || content.trim() === ''}>
          {busy ? 'Posting…' : 'Post comment'}
        </button>
      </div>
    </form>
  );
}

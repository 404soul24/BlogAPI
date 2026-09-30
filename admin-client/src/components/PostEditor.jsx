import { useEffect, useState } from 'react';
import { api } from 'ui-kit/api';
import { navigate } from '../router.jsx';

const BLANK = { title: '', content: '', published: false };

export default function PostEditor({ id }) {
  const isNew = id === null;

  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;

    let live = true;
    setLoading(true);
    api
      .getPost(id)
      .then(({ post }) => {
        if (!live) return;
        setForm({ title: post.title, content: post.content, published: post.published });
      })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
  }, [id, isNew]);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    setSaved(null);

    try {
      const result = isNew
        ? await api.createPost(form)
        : await api.updatePost(id, form);

      if (isNew) {
        navigate(`/posts/${result.post.id}/edit`);
      } else {
        setSaved('Saved.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="muted">Loading post…</p>;

  return (
    <form className="stack editor" onSubmit={save}>
      <div className="row-between">
        <h1 className="text-2xl">{isNew ? 'New post' : 'Edit post'}</h1>
        <button
          className="btn"
          type="button"
          onClick={() => navigate('/')}
          disabled={busy}
        >
          ← All posts
        </button>
      </div>

      <div className="field">
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className="input"
          value={form.title}
          onChange={update('title')}
          maxLength={200}
          required
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="content">
          Content
        </label>
        <textarea
          id="content"
          className="textarea editor-content"
          value={form.content}
          onChange={update('content')}
          required
        />
      </div>

      <label className="checkbox">
        <input type="checkbox" checked={form.published} onChange={update('published')} />
        <span>Published — visible to everyone on the blog</span>
      </label>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {saved && <div className="alert alert-info">{saved}</div>}

      <div>
        <button className="btn btn-primary" type="submit" disabled={busy || !form.title.trim() || !form.content.trim()}>
          {busy ? 'Saving…' : isNew ? 'Create post' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

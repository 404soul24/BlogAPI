import { useState } from 'react';
import { api } from 'ui-kit/api';

export default function LoginForm({ onAuthenticated }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const session = await api.login(form);
      onAuthenticated(session);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="stack card login-form" onSubmit={submit}>
      <h1 className="text-2xl">Blog Admin</h1>
      <p className="muted">Sign in with an author account.</p>

      <div className="field">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="input"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          autoComplete="email"
          required
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="input"
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Log in'}
      </button>

      <p className="muted login-hint">
        Seeded locally: <code>author@example.com</code> / <code>password123</code>
      </p>
    </form>
  );
}

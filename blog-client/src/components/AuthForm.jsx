import { useState } from 'react';
import { api } from 'ui-kit/api';
import { navigate } from '../router.jsx';

const COPY = {
  login: { title: 'Log in', submit: 'Log in', switchTo: 'register', switchLabel: 'Need an account?' },
  register: { title: 'Create an account', submit: 'Sign up', switchTo: 'login', switchLabel: 'Already have an account?' },
};

export default function AuthForm({ mode, onAuthenticated }) {
  const copy = COPY[mode];
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const session = mode === 'register' ? await api.register(form) : await api.login(form);
      onAuthenticated(session);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="stack card auth-form" onSubmit={submit}>
      <h1 className="text-2xl">{copy.title}</h1>

      {mode === 'register' && (
        <div className="field">
          <label className="label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="input"
            value={form.name}
            onChange={update('name')}
            autoComplete="name"
            required
          />
        </div>
      )}

      <div className="field">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="input"
          type="email"
          value={form.email}
          onChange={update('email')}
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
          onChange={update('password')}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          minLength={mode === 'register' ? 8 : undefined}
          required
        />
        {mode === 'register' && <p className="muted auth-hint">At least 8 characters.</p>}
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? 'Please wait…' : copy.submit}
      </button>

      <p className="muted auth-switch">
        {copy.switchLabel}{' '}
        <a
          href={`#/${copy.switchTo}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/${copy.switchTo}`);
          }}
        >
          {COPY[copy.switchTo].title}
        </a>
      </p>
    </form>
  );
}

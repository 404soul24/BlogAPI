import { useCallback, useEffect, useState } from 'react';
import { api, clearSession, getUser, setSession } from 'ui-kit/api';
import { matchRoute, navigate, useRoute } from './router.jsx';
import LoginForm from './components/LoginForm.jsx';
import PostTable from './components/PostTable.jsx';
import PostEditor from './components/PostEditor.jsx';
import CommentModeration from './components/CommentModeration.jsx';

export default function App() {
  const route = matchRoute(useRoute());
  const [user, setUser] = useState(getUser);
  const [checked, setChecked] = useState(!getUser());

  // Confirm the stored token is still valid, otherwise an expired JWT leaves the
  // app showing an authoring UI that every request will reject.
  useEffect(() => {
    if (!getUser()) return;
    api
      .me()
      .then(({ user: fresh }) => setUser(fresh))
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setChecked(true));
  }, []);

  const onAuthenticated = useCallback((session) => {
    setSession(session.token, session.user);
    setUser(session.user);
    navigate('/');
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    navigate('/login');
  }, []);

  if (!checked) return <div className="page"><p className="muted">Checking session…</p></div>;

  if (!user) {
    return (
      <div className="page narrow">
        <LoginForm onAuthenticated={onAuthenticated} />
      </div>
    );
  }

  if (!user.isAuthor) {
    return (
      <div className="page narrow">
        <div className="alert alert-error" role="alert">
          {user.name} is not an author. Only author accounts can use this app.
        </div>
        <button className="btn" onClick={logout} style={{ marginTop: 'var(--space-4)' }}>
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="site-header">
        <div className="page row-between">
          <a
            className="site-title"
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            Blog Admin
          </a>

          <nav className="row">
            <a
              className={`btn btn-sm ${route.name === 'posts' ? 'is-current' : ''}`}
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
            >
              Posts
            </a>
            <a
              className={`btn btn-sm ${route.name === 'comments' ? 'is-current' : ''}`}
              href="#/comments"
              onClick={(e) => {
                e.preventDefault();
                navigate('/comments');
              }}
            >
              Comments
            </a>
            <span className="muted admin-name">{user.name}</span>
            <button className="btn btn-sm" onClick={logout}>
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="page admin-main">
        {route.name === 'editor' && <PostEditor id={route.id} />}
        {route.name === 'comments' && <CommentModeration />}
        {route.name === 'posts' && <PostTable />}
      </main>
    </div>
  );
}

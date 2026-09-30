import { useCallback, useEffect, useState } from 'react';
import { api, clearSession, getUser, setSession } from 'ui-kit/api';
import { matchRoute, navigate, useRoute } from './router.jsx';
import Header from './components/Header.jsx';
import PostList from './components/PostList.jsx';
import PostView from './components/PostView.jsx';
import AuthForm from './components/AuthForm.jsx';

export default function App() {
  const route = matchRoute(useRoute());
  const [user, setUser] = useState(getUser);

  // The token can be cleared in another tab, or expire server-side. Re-checking
  // /users/me on load keeps the UI honest about whether the session is real.
  useEffect(() => {
    if (!getUser()) return;
    api
      .me()
      .then(({ user: fresh }) => setUser(fresh))
      .catch(() => {
        clearSession();
        setUser(null);
      });
  }, []);

  const onAuthenticated = useCallback((session) => {
    setSession(session.token, session.user);
    setUser(session.user);
    navigate('/');
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    navigate('/');
  }, []);

  if (route.name === 'login' || route.name === 'register') {
    return (
      <div className="shell">
        <Header user={user} onLogout={logout} />
        <main className="page narrow">
          <AuthForm mode={route.name} onAuthenticated={onAuthenticated} />
        </main>
      </div>
    );
  }

  if (route.name === 'post') {
    return (
      <div className="shell">
        <Header user={user} onLogout={logout} />
        <main className="page narrow">
          <PostView id={route.id} user={user} />
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <Header user={user} onLogout={logout} />
      <main className="page">
        <PostList />
      </main>
      <footer className="page site-footer">
        <span className="muted">A blog, built with Express, Prisma and React.</span>
      </footer>
    </div>
  );
}

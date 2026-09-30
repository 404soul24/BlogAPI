import { navigate } from '../router.jsx';

export default function Header({ user, onLogout }) {
  return (
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
          The Blog
        </a>

        <nav className="row">
          {user ? (
            <>
              <span className="muted reader-name">
                {user.name}
                {user.isAuthor && <span className="badge badge-neutral">author</span>}
              </span>
              <button className="btn btn-sm" onClick={onLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <a
                className="btn btn-sm"
                href="#/login"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                Log in
              </a>
              <a
                className="btn btn-sm btn-primary"
                href="#/register"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/register');
                }}
              >
                Sign up
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

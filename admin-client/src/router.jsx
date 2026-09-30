import { useEffect, useState } from 'react';

/**
 * Minimal hash router, same approach as the reader app — static hosting needs
 * no rewrite rules, and three views do not justify a router dependency.
 */
export function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1) || '/');

  useEffect(() => {
    const onChange = () => setHash(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return hash;
}

export const navigate = (path) => {
  window.location.hash = path;
};

export function matchRoute(hash) {
  if (hash === '/posts/new') return { name: 'editor', id: null };
  if (hash === '/comments') return { name: 'comments' };

  const edit = hash.match(/^\/posts\/([^/]+)\/edit$/);
  if (edit) return { name: 'editor', id: decodeURIComponent(edit[1]) };

  return { name: 'posts' };
}

import { useEffect, useState } from 'react';

/**
 * Minimal hash router (~25 lines) instead of react-router.
 *
 * Hash URLs work on any static host with no rewrite rules, which is where both
 * front-ends end up. Adding a router library to navigate between three views
 * would not buy anything.
 *
 * Supported: "#/", "#/posts/:id", "#/login", "#/register", "#/*"
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
  const postMatch = hash.match(/^\/posts\/([^/]+)$/);
  if (postMatch) return { name: 'post', id: decodeURIComponent(postMatch[1]) };

  if (hash === '/login') return { name: 'login' };
  if (hash === '/register') return { name: 'register' };

  return { name: 'list' };
}

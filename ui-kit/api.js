/**
 * Fetch wrapper shared by blog-client and admin-client.
 *
 * Attaches the JWT from localStorage as an Authorization: Bearer header and
 * normalises API errors into an Error with a `.status` and `.fields`.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'blog.token';
const USER_KEY = 'blog.user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

async function request(method, path, body) {
  const token = getToken();

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the API. Is it running?', 0);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(payload?.error || `Request failed (${res.status})`, res.status, payload?.fields);
  }

  return payload;
}

export const api = {
  register: (body) => request('POST', '/users/register', body),
  login: (body) => request('POST', '/users/login', body),
  me: () => request('GET', '/users/me'),

  listPosts: () => request('GET', '/posts'),
  getPost: (id) => request('GET', `/posts/${id}`),
  createPost: (body) => request('POST', '/posts', body),
  updatePost: (id, body) => request('PATCH', `/posts/${id}`, body),
  deletePost: (id) => request('DELETE', `/posts/${id}`),

  listComments: (postId) => request('GET', `/posts/${postId}/comments`),
  listAllComments: () => request('GET', '/comments'),
  createComment: (postId, body) => request('POST', `/posts/${postId}/comments`, body),
  updateComment: (id, body) => request('PATCH', `/comments/${id}`, body),
  deleteComment: (id) => request('DELETE', `/comments/${id}`),
};

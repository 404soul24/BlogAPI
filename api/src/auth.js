import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!SECRET) {
  throw new Error('JWT_SECRET is not set. Copy .env.example to api/.env and fill it in.');
}

export const hashPassword = (plain) => bcrypt.hash(plain, 10);

export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

export const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email, isAuthor: user.isAuthor }, SECRET, {
    expiresIn: EXPIRES_IN,
  });

/**
 * Reads `Authorization: Bearer <token>`, verifies it, and attaches the user to
 * `req.user`. Responds 401 and stops the chain when the header is missing or
 * the token is invalid/expired.
 */
export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header. Expected: Bearer <token>' });
  }

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  req.user = { id: payload.sub, email: payload.email, isAuthor: payload.isAuthor };
  next();
}

/** Same as requireAuth but tolerates no token, so public reads can still identify an author. */
export function optionalAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      const payload = jwt.verify(token, SECRET);
      req.user = { id: payload.sub, email: payload.email, isAuthor: payload.isAuthor };
    } catch {
      // An invalid token is treated as no token for public reads.
    }
  }

  next();
}

export const requireAuthor = (req, res, next) =>
  req.user?.isAuthor
    ? next()
    : res.status(403).json({ error: 'Author privileges required.' });

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncRoute, validate } from '../middleware.js';
import { hashPassword, signToken, requireAuth } from '../auth.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(80),
  email: z.string().trim().toLowerCase().email('Must be a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Must be a valid email.'),
  password: z.string().min(1, 'Password is required.'),
});

const publicUser = ({ id, name, email, isAuthor, createdAt }) => ({
  id,
  name,
  email,
  isAuthor,
  createdAt,
});

// The first account to register becomes the author. After that, registration
// only creates readers, so the blog cannot end up with rival authors.
router.post(
  '/register',
  validate(registerSchema),
  asyncRoute(async (req, res) => {
    const { name, email, password } = req.body;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        isAuthor: (await prisma.user.count()) === 0,
      },
    });

    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  }),
);

router.post(
  '/login',
  validate(loginSchema),
  asyncRoute(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Same response for "no such user" and "wrong password" so the endpoint
    // cannot be used to enumerate registered emails.
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    res.json({ user: publicUser(user), token: signToken(user) });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ error: 'Account no longer exists.' });
    res.json({ user: publicUser(user) });
  }),
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncRoute, validate } from '../middleware.js';
import { requireAuth, optionalAuth, requireAuthor } from '../auth.js';

const router = Router();

const postInput = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  content: z.string().trim().min(1, 'Content is required.'),
  published: z.boolean().optional(),
});

const postPatch = postInput.partial().refine((v) => Object.keys(v).length > 0, {
  message: 'Send at least one field to update.',
});

const withAuthor = { select: { id: true, name: true } };
const withCounts = { _count: { select: { comments: true } } };

/**
 * Readers see published posts only. An author sending a valid token sees every
 * post, so the admin app can list drafts and the `published` filter applies.
 */
router.get(
  '/',
  optionalAuth,
  asyncRoute(async (req, res) => {
    const where = {};

    if (req.user?.isAuthor) {
      if (req.query.published !== undefined) {
        where.published = req.query.published === 'true';
      }
    } else {
      where.published = true;
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { author: withAuthor, ...withCounts },
    });

    res.json({ posts });
  }),
);

router.post(
  '/',
  requireAuth,
  requireAuthor,
  validate(postInput),
  asyncRoute(async (req, res) => {
    const { title, content, published = false } = req.body;

    const post = await prisma.post.create({
      data: { title, content, published, authorId: req.user.id },
      include: { author: withAuthor, ...withCounts },
    });

    res.status(201).json({ post });
  }),
);

/** Unpublished posts are 404 for anyone who is not an author — not a 403, so the existence of a draft is not leaked. */
async function findVisible(id, user) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: withAuthor, ...withCounts },
  });

  if (!post) return { post: null };
  if (!post.published && !user?.isAuthor) return { post: null };
  return { post };
}

router.get(
  '/:id',
  optionalAuth,
  asyncRoute(async (req, res) => {
    const { post } = await findVisible(req.params.id, req.user);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ post });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  requireAuthor,
  validate(postPatch),
  asyncRoute(async (req, res) => {
    const { post: existing } = await findVisible(req.params.id, req.user);
    if (!existing) return res.status(404).json({ error: 'Post not found.' });

    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: req.body,
      include: { author: withAuthor, ...withCounts },
    });

    res.json({ post });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  requireAuthor,
  asyncRoute(async (req, res) => {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

export default router;

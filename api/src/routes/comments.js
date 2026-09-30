import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncRoute, validate } from '../middleware.js';
import { requireAuth, requireAuthor } from '../auth.js';

const router = Router();

const commentInput = z.object({ content: z.string().trim().min(1, 'Comment cannot be empty.').max(5000) });
const commentPatch = commentInput;

const withAuthor = { select: { id: true, name: true } };

/** Nested under a post: GET /api/posts/:postId/comments, POST same path. */
export const postCommentsRouter = Router({ mergeParams: true });

postCommentsRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    const comments = await prisma.comment.findMany({
      where: { postId: req.params.postId },
      orderBy: { createdAt: 'asc' },
      include: { user: withAuthor },
    });
    res.json({ comments });
  }),
);

postCommentsRouter.post(
  '/',
  requireAuth,
  validate(commentInput),
  asyncRoute(async (req, res) => {
    const post = await prisma.post.findUnique({ where: { id: req.params.postId }, select: { id: true, published: true } });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (!post.published) return res.status(404).json({ error: 'Post not found.' });

    const comment = await prisma.comment.create({
      data: { content: req.body.content, postId: post.id, userId: req.user.id },
      include: { user: withAuthor },
    });

    res.status(201).json({ comment });
  }),
);

/** Author-only: every comment across every post, newest first, for moderation. */
router.get(
  '/',
  requireAuth,
  requireAuthor,
  asyncRoute(async (req, res) => {
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: withAuthor, post: { select: { id: true, title: true, published: true } } },
    });
    res.json({ comments });
  }),
);

async function loadForUser(id, user) {
  return prisma.comment.findUnique({ where: { id }, include: { user: withAuthor, post: { select: { id: true, published: true } } } });
}

/** Owners edit their own comments; authors edit any. Anyone else is a 403. */
const canModify = (comment, user) => comment.userId === user.id || user.isAuthor;

router.get(
  '/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const comment = await loadForUser(req.params.id, req.user);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (!comment.post.published && !req.user.isAuthor) return res.status(404).json({ error: 'Comment not found.' });
    res.json({ comment });
  }),
);

router.patch(
  '/:id',
  requireAuth,
  validate(commentPatch),
  asyncRoute(async (req, res) => {
    const comment = await loadForUser(req.params.id, req.user);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (!canModify(comment, req.user)) return res.status(403).json({ error: 'You may only edit your own comments.' });

    const updated = await prisma.comment.update({
      where: { id: comment.id },
      data: { content: req.body.content },
      include: { user: withAuthor },
    });

    res.json({ comment: updated });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const comment = await loadForUser(req.params.id, req.user);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (!canModify(comment, req.user)) return res.status(403).json({ error: 'You may only delete your own comments.' });

    await prisma.comment.delete({ where: { id: comment.id } });
    res.status(204).end();
  }),
);

export default router;

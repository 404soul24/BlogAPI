import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './db.js';
import { errorHandler } from './middleware.js';
import usersRouter from './routes/users.js';
import postsRouter from './routes/posts.js';
import commentsRouter, { postCommentsRouter } from './routes/comments.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get(['/', '/api'], (_req, res) => res.redirect('/api/health'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/posts/:postId/comments', postCommentsRouter);
app.use('/api/comments', commentsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => console.log(`api listening on http://localhost:${port}`));
}

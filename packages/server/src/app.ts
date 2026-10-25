import cors from 'cors';
import express from 'express';
import { mkdirSync } from 'node:fs';
import { config } from './config';
import type { Db } from './db/pool';
import { errorHandler, HttpError } from './errors';
import { levelsForChild, publicLevel } from './levels';
import { adminRouter, loadContentOverrides } from './routes/admin';
import { authRouter } from './routes/auth';
import { billingRouter } from './routes/billing';
import { bookingsRouter } from './routes/bookings';
import { childrenRouter } from './routes/children';
import { lessonRoomRouter } from './routes/lessonRoom';
import { postsRouter } from './routes/posts';
import { supportRouter } from './routes/support';
import { tutorCabinetRouter } from './routes/tutorCabinet';
import { tutorsRouter } from './routes/tutors';

export function createApp(db: Db) {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  // Uploaded tutor videos. Kept under /api so the dev proxy serves them too.
  mkdirSync(`${config.uploadsDir}/videos`, { recursive: true });
  app.use('/api/uploads', express.static(config.uploadsDir, { maxAge: '7d', fallthrough: false }));

  // Tutors' diplomas are private: never served statically, only through checked routes.
  mkdirSync(config.documentsDir, { recursive: true });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter(db));
  app.use('/api/children', childrenRouter(db));
  app.use('/api/tutors', tutorsRouter(db));
  app.use('/api/bookings', lessonRoomRouter(db));
  app.use('/api/bookings', bookingsRouter(db));
  app.use('/api/billing', billingRouter(db));
  app.use('/api/support', supportRouter(db));
  app.use('/api/posts', postsRouter(db));
  app.use('/api/tutor', tutorCabinetRouter(db));
  app.use('/api/admin', adminRouter(db));

  // Topics, articles and lesson texts the admin added or edited; the client applies them on load.
  app.get('/api/content', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.json(await loadContentOverrides(db));
  });

  // Public catalogue for the landing page: titles and themes only, no level configs.
  app.get('/api/levels', async (_req, res) => {
    const levels = await levelsForChild(db, null, false);
    res.json({ levels: levels.map((l) => publicLevel(l, false)) });
  });

  // Guest trial from the landing page: free levels only, nothing is saved.
  app.get('/api/levels/:slug', async (req, res) => {
    const levels = await levelsForChild(db, null, false);
    const level = levels.find((l) => l.slug === req.params.slug && !l.is_premium);
    if (!level) throw new HttpError(404, 'Уровень не найден');
    res.json({ level: { ...publicLevel(level, true), unlocked: true }, savedProgram: null });
  });

  app.use(errorHandler);
  return app;
}

import cors from 'cors';
import express from 'express';
import { mkdirSync } from 'node:fs';
import { config } from './config';
import type { Db } from './db/pool';
import { errorHandler } from './errors';
import { levelsForChild, publicLevel } from './levels';
import { authRouter } from './routes/auth';
import { bookingsRouter } from './routes/bookings';
import { childrenRouter } from './routes/children';
import { lessonRoomRouter } from './routes/lessonRoom';
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

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter(db));
  app.use('/api/children', childrenRouter(db));
  app.use('/api/tutors', tutorsRouter(db));
  app.use('/api/bookings', lessonRoomRouter(db));
  app.use('/api/bookings', bookingsRouter(db));
  app.use('/api/support', supportRouter(db));
  app.use('/api/tutor', tutorCabinetRouter(db));

  // Public catalogue for the landing page: titles and themes only, no level configs.
  app.get('/api/levels', async (_req, res) => {
    const levels = await levelsForChild(db, null, false);
    res.json({ levels: levels.map((l) => publicLevel(l, false)) });
  });

  app.use(errorHandler);
  return app;
}

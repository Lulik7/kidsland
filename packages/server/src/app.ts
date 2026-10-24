import cors from 'cors';
import express from 'express';
import { config } from './config';
import type { Db } from './db/pool';
import { errorHandler } from './errors';
import { levelsForChild, publicLevel } from './levels';
import { authRouter } from './routes/auth';
import { childrenRouter } from './routes/children';

export function createApp(db: Db) {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter(db));
  app.use('/api/children', childrenRouter(db));

  // Public catalogue for the landing page: titles and themes only, no level configs.
  app.get('/api/levels', async (_req, res) => {
    const levels = await levelsForChild(db, null, false);
    res.json({ levels: levels.map((l) => publicLevel(l, false)) });
  });

  app.use(errorHandler);
  return app;
}

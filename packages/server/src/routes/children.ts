import { findForbiddenBlock, runProgram, validateProgram, type Program } from '@kidsland/shared';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth';
import type { Db } from '../db/pool';
import { HttpError } from '../errors';
import { getChildForUser, isPremiumUser, levelsForChild, publicLevel } from '../levels';

const createChildSchema = z.object({
  nickname: z.string().trim().min(1).max(30),
  avatarUrl: z.string().trim().max(200).optional(),
});

const attemptSchema = z.object({
  levelSlug: z.string().min(1).max(64),
  program: z.unknown(),
});

const MAX_CHILDREN = 5;
const COINS_PER_STAR = 5;

const publicChild = (c: Awaited<ReturnType<typeof getChildForUser>>, completedLevels: string[] = []) => ({
  id: c.id,
  parentId: c.parent_id,
  nickname: c.nickname,
  avatarUrl: c.avatar_url,
  coins: c.coins,
  xp: c.xp,
  completedLevels,
});

export function childrenRouter(db: Db) {
  const r = Router();
  r.use(requireAuth, requireRole('parent', 'admin'));

  r.get('/', async (req, res) => {
    const { rows } = await db.query(
      `SELECT c.*, COALESCE(array_agg(l.slug ORDER BY l.order_index) FILTER (WHERE gp.completed_at IS NOT NULL), '{}') AS completed
         FROM child_profiles c
         LEFT JOIN game_progress gp ON gp.child_id = c.id
         LEFT JOIN levels l ON l.id = gp.level_id
        WHERE c.parent_id = $1
        GROUP BY c.id
        ORDER BY c.created_at`,
      [req.user!.id],
    );
    res.json({ children: rows.map((c) => publicChild(c, c.completed)) });
  });

  r.post('/', async (req, res) => {
    const body = createChildSchema.parse(req.body);
    const { rows: countRows } = await db.query('SELECT count(*)::int AS n FROM child_profiles WHERE parent_id = $1', [
      req.user!.id,
    ]);
    if (countRows[0].n >= MAX_CHILDREN) throw new HttpError(400, `Можно создать не больше ${MAX_CHILDREN} профилей`);
    const { rows } = await db.query(
      'INSERT INTO child_profiles (parent_id, nickname, avatar_url) VALUES ($1, $2, $3) RETURNING *',
      [req.user!.id, body.nickname, body.avatarUrl ?? null],
    );
    res.status(201).json({ child: publicChild(rows[0]) });
  });

  r.get('/:childId/levels', async (req, res) => {
    const child = await getChildForUser(db, req.params.childId, req.user!.id);
    const levels = await levelsForChild(db, child.id, await isPremiumUser(db, req.user!.id));
    res.json({ levels: levels.map((l) => publicLevel(l, false)) });
  });

  r.get('/:childId/levels/:slug', async (req, res) => {
    const child = await getChildForUser(db, req.params.childId, req.user!.id);
    const levels = await levelsForChild(db, child.id, await isPremiumUser(db, req.user!.id));
    const level = levels.find((l) => l.slug === req.params.slug);
    if (!level) throw new HttpError(404, 'Уровень не найден');
    if (level.paywalled) throw new HttpError(402, 'Этот уровень доступен в премиум-подписке');
    if (!level.unlocked) throw new HttpError(403, 'Сначала пройди предыдущий уровень');
    const { rows } = await db.query('SELECT code_snippet FROM game_progress WHERE child_id = $1 AND level_id = $2', [
      child.id,
      level.id,
    ]);
    res.json({ level: publicLevel(level, true), savedProgram: rows[0]?.code_snippet ?? null });
  });

  /** Parent dashboard report: per-level results, mastery per concept and whether the base course is done. */
  r.get('/:childId/report', async (req, res) => {
    const child = await getChildForUser(db, req.params.childId, req.user!.id);
    const { rows } = await db.query(
      `SELECT l.slug, l.title, l.theme, l.order_index, l.is_premium, l.config_json->'concepts' AS concepts,
              gp.stars, gp.attempts, gp.completed_at, gp.updated_at
         FROM levels l
         LEFT JOIN game_progress gp ON gp.level_id = l.id AND gp.child_id = $1
        ORDER BY l.order_index`,
      [child.id],
    );
    const levels = rows.map((l) => ({
      slug: l.slug,
      title: l.title,
      theme: l.theme,
      order: l.order_index,
      isPremium: l.is_premium,
      concepts: l.concepts as string[],
      stars: l.stars ?? 0,
      attempts: l.attempts ?? 0,
      completed: l.completed_at !== null,
      completedAt: l.completed_at,
      lastPlayedAt: l.updated_at,
    }));
    const concepts: Record<string, { done: number; total: number }> = {};
    for (const l of levels) {
      for (const c of l.concepts) {
        concepts[c] ??= { done: 0, total: 0 };
        concepts[c].total++;
        if (l.completed) concepts[c].done++;
      }
    }
    const base = levels.filter((l) => !l.isPremium);
    const lastPlayed = levels.map((l) => l.lastPlayedAt).filter(Boolean).sort().at(-1) ?? null;
    res.json({
      child: publicChild(child, levels.filter((l) => l.completed).map((l) => l.slug)),
      levels,
      concepts,
      totals: {
        completed: levels.filter((l) => l.completed).length,
        levels: levels.length,
        stars: levels.reduce((n, l) => n + l.stars, 0),
        attempts: levels.reduce((n, l) => n + l.attempts, 0),
      },
      baseCourseCompleted: base.length > 0 && base.every((l) => l.completed),
      lastPlayedAt: lastPlayed,
    });
  });

  /**
   * Submit a program. The server re-runs it with the shared engine, so stars and rewards
   * cannot be faked by the client. XP and coins are only granted for improvements.
   */
  r.post('/:childId/attempts', async (req, res) => {
    const body = attemptSchema.parse(req.body);
    const programError = validateProgram(body.program);
    if (programError) throw new HttpError(400, `Некорректная программа: ${programError}`);
    const program = body.program as Program;

    const child = await getChildForUser(db, req.params.childId, req.user!.id);
    const levels = await levelsForChild(db, child.id, await isPremiumUser(db, req.user!.id));
    const level = levels.find((l) => l.slug === body.levelSlug);
    if (!level) throw new HttpError(404, 'Уровень не найден');
    if (level.paywalled) throw new HttpError(402, 'Этот уровень доступен в премиум-подписке');
    if (!level.unlocked) throw new HttpError(403, 'Сначала пройди предыдущий уровень');

    if (findForbiddenBlock(program, level.config_json.availableBlocks)) {
      throw new HttpError(400, 'В программе есть блоки, которых нет на этом уровне');
    }

    const result = runProgram(level.config_json, program);
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO game_progress (child_id, level_id) VALUES ($1, $2) ON CONFLICT (child_id, level_id) DO NOTHING`,
        [child.id, level.id],
      );
      const { rows } = await client.query(
        'SELECT stars, completed_at FROM game_progress WHERE child_id = $1 AND level_id = $2 FOR UPDATE',
        [child.id, level.id],
      );
      const prevStars: number = rows[0].stars;
      const firstCompletion = result.success && rows[0].completed_at === null;
      const improved = result.stars > prevStars;

      // XP for a level scales with stars; award only the part not yet earned.
      const xpFor = (stars: number) => Math.round((level.xp_reward * stars) / 3);
      const xpGained = improved ? xpFor(result.stars) - xpFor(prevStars) : 0;
      const coinsGained =
        (improved ? (result.stars - prevStars) * COINS_PER_STAR : 0) + (firstCompletion ? result.coinsCollected : 0);

      await client.query(
        `UPDATE game_progress SET
           attempts = attempts + 1,
           stars = GREATEST(stars, $3),
           score = GREATEST(score, $4),
           code_snippet = CASE WHEN $5 THEN $6::jsonb ELSE COALESCE(code_snippet, $6::jsonb) END,
           completed_at = CASE WHEN $7 AND completed_at IS NULL THEN now() ELSE completed_at END,
           updated_at = now()
         WHERE child_id = $1 AND level_id = $2`,
        [child.id, level.id, result.stars, result.score, improved || result.success, JSON.stringify(program), result.success],
      );
      const { rows: childRows } = await client.query(
        'UPDATE child_profiles SET xp = xp + $2, coins = coins + $3 WHERE id = $1 RETURNING xp, coins',
        [child.id, xpGained, coinsGained],
      );
      await client.query('COMMIT');

      res.json({
        success: result.success,
        failReason: result.failReason ?? null,
        stars: result.stars,
        bestStars: Math.max(prevStars, result.stars),
        score: result.score,
        blocksUsed: result.blocksUsed,
        rewards: { xp: xpGained, coins: coinsGained },
        child: { xp: childRows[0].xp, coins: childRows[0].coins },
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  });

  return r;
}

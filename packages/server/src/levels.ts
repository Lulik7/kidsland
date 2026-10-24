import type { LevelConfig, Theme } from '@kidsland/shared';
import type { Db } from './db/pool';
import { HttpError } from './errors';

export interface LevelRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  theme: Theme;
  order_index: number;
  config_json: LevelConfig;
  is_premium: boolean;
  xp_reward: number;
}

export interface LevelWithProgress extends LevelRow {
  stars: number;
  completed: boolean;
  unlocked: boolean;
  /** Premium level the account has not paid for. */
  paywalled: boolean;
}

export async function getChildForUser(db: Db, childId: string, userId: string) {
  // Guard the uuid cast so a malformed id is a 404, not a database error.
  if (!/^[0-9a-f-]{36}$/i.test(childId)) throw new HttpError(404, 'Профиль ребёнка не найден');
  const { rows } = await db.query(
    'SELECT id, parent_id, nickname, avatar_url, coins, xp, created_at FROM child_profiles WHERE id = $1 AND parent_id = $2',
    [childId, userId],
  );
  if (!rows[0]) throw new HttpError(404, 'Профиль ребёнка не найден');
  return rows[0] as {
    id: string;
    parent_id: string;
    nickname: string;
    avatar_url: string | null;
    coins: number;
    xp: number;
    created_at: Date;
  };
}

export async function isPremiumUser(db: Db, userId: string): Promise<boolean> {
  const { rows } = await db.query('SELECT is_premium FROM users WHERE id = $1', [userId]);
  return Boolean(rows[0]?.is_premium);
}

/**
 * Levels in play order with the child's progress. A level unlocks once the previous one is completed;
 * premium levels additionally need a premium account.
 */
export async function levelsForChild(db: Db, childId: string | null, premium: boolean): Promise<LevelWithProgress[]> {
  const { rows } = await db.query<LevelRow & { stars: number | null; completed_at: Date | null }>(
    `SELECT l.*, gp.stars, gp.completed_at
       FROM levels l
       LEFT JOIN game_progress gp ON gp.level_id = l.id AND gp.child_id = $1
      ORDER BY l.order_index`,
    [childId],
  );
  let prevCompleted = true;
  return rows.map(({ stars, completed_at, ...level }) => {
    const completed = completed_at !== null;
    const paywalled = level.is_premium && !premium;
    const item = { ...level, stars: stars ?? 0, completed, unlocked: prevCompleted && !paywalled, paywalled };
    prevCompleted = completed;
    return item;
  });
}

export function publicLevel(l: LevelWithProgress, withConfig: boolean) {
  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    description: l.description,
    theme: l.theme,
    order: l.order_index,
    isPremium: l.is_premium,
    xpReward: l.xp_reward,
    concepts: l.config_json.concepts,
    stars: l.stars,
    completed: l.completed,
    unlocked: l.unlocked,
    paywalled: l.paywalled,
    ...(withConfig ? { config: l.config_json } : {}),
  };
}

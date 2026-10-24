import { LEVELS } from '@kidsland/shared';
import type { Db } from './pool';
import { SCHEMA_SQL } from './schema';

/** Creates tables and upserts the built-in levels (matched by slug). Safe to run on every start. */
export async function migrate(db: Db): Promise<void> {
  await db.query(SCHEMA_SQL);
  for (const [i, level] of LEVELS.entries()) {
    await db.query(
      `INSERT INTO levels (slug, title, description, theme, order_index, config_json, is_premium, xp_reward)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title, description = EXCLUDED.description, theme = EXCLUDED.theme,
         order_index = EXCLUDED.order_index, config_json = EXCLUDED.config_json,
         is_premium = EXCLUDED.is_premium, xp_reward = EXCLUDED.xp_reward`,
      [level.slug, level.title, level.description, level.theme, i + 1, level.config, level.isPremium, level.xpReward],
    );
  }
}

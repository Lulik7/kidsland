import { LEVELS } from '@kidsland/shared';
import bcrypt from 'bcryptjs';
import type { Db } from './pool';
import { seedDemoTutors } from './demoTutors';
import { SCHEMA_SQL } from './schema';

/** Creates tables and upserts the built-in levels (matched by slug). Safe to run on every start. */
export const DEMO_ADMIN = { email: 'admin@kidsland.local', password: 'admin12345' };

export async function migrate(db: Db, opts: { demoTutors?: boolean; demoAdmin?: boolean } = {}): Promise<void> {
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
  if (opts.demoTutors ?? true) await seedDemoTutors(db);
  if (opts.demoAdmin) {
    await db.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin') ON CONFLICT (email) DO NOTHING`,
      [DEMO_ADMIN.email, await bcrypt.hash(DEMO_ADMIN.password, 10)],
    );
  }
}

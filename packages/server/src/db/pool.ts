import pg from 'pg';

export type Db = pg.Pool;

export function createPool(connectionString: string): Db {
  // Hosted Postgres (Neon) only accepts encrypted connections; turn SSL on even if the pasted URL lost "sslmode=require".
  const needsSsl = /\.neon\.tech[/:]/.test(connectionString) && !/[?&]sslmode=/.test(connectionString);
  return new pg.Pool({ connectionString, ...(needsSsl ? { ssl: true } : {}) });
}

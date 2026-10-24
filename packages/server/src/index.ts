import { createApp } from './app';
import { config } from './config';
import { migrate } from './db/migrate';
import { createPool } from './db/pool';

const db = createPool(config.databaseUrl);
await migrate(db);
createApp(db).listen(config.port, () => {
  console.log(`Kidsland API listening on http://localhost:${config.port}`);
});

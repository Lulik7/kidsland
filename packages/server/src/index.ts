import { createApp } from './app';
import { config } from './config';
import { migrate } from './db/migrate';
import { createPool } from './db/pool';
import { refreshContent } from './routes/admin';

const db = createPool(config.databaseUrl);
await migrate(db, { demoAdmin: config.seedDemoAdmin });
await refreshContent(db);
createApp(db).listen(config.port, () => {
  console.log(`Kidsland API listening on http://localhost:${config.port}`);
});

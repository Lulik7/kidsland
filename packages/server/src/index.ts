import { createApp } from './app';
import { config } from './config';
import { migrate } from './db/migrate';
import { deliverMail } from './mail';
import { sendLessonReminders } from './reminders';
import { createPool } from './db/pool';
import { refreshContent } from './routes/admin';

const db = createPool(config.databaseUrl);
await migrate(db, {
  demoAdmin: config.seedDemoAdmin,
  demoTutors: config.seedDemoTutors,
  admins: { emails: config.adminEmails, password: config.adminPassword },
});
await refreshContent(db);
// Payment confirmations and other letters go out from the outbox every 20 seconds.
setInterval(() => deliverMail(db).catch((e) => console.error('mail', e)), 20_000);
// Lesson reminders: on the lesson day and 30 minutes before, checked every minute.
setInterval(() => sendLessonReminders(db).catch((e) => console.error('reminders', e)), 60_000);

createApp(db).listen(config.port, () => {
  console.log(`Kidsland API listening on http://localhost:${config.port}`);
});

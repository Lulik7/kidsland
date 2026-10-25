// Kidsland service worker: shows lesson reminders sent by the server and opens the lesson on click.
self.addEventListener('push', (event) => {
  let msg = { title: 'Kidsland', body: '', url: '/' };
  try {
    msg = { ...msg, ...event.data.json() };
  } catch {
    if (event.data) msg.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(msg.title, { body: msg.body, icon: '/favicon.svg', badge: '/favicon.svg', data: { url: msg.url }, tag: msg.url }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if (c.url === url && 'focus' in c) return c.focus();
      return self.clients.openWindow(url);
    }),
  );
});

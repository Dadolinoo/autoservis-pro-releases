self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = data.title || 'Novi online zahtjev';
  const body = data.body || '';
  event.waitUntil((async () => {
    const termin = data.page === 'kalendar';
    await self.registration.showNotification(title, { body, icon: 'icons/icon-192.png', tag: termin ? 'termin-' + (data.apId || '') : undefined, data: termin ? { page: 'termini', apId: data.apId || '' } : { page: 'cekaonica' } });
    if (termin) return;
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of list) client.postMessage({ type: 'online-request' });
  })());
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = list.find((c) => c.url && c.url.includes(self.registration.scope)) || list[0];
    const d = event.notification.data || {};
    if (open) {
      await open.focus();
      open.postMessage(d.page === 'termini' ? { type: 'open-termin', apId: d.apId } : { type: 'open-cekaonica' });
      return;
    }
    await self.clients.openWindow(d.page === 'termini' ? './?page=termini&ap=' + encodeURIComponent(d.apId || '') : './?page=cekaonica');
  })());
});

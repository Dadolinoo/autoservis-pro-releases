// 0.3.20: postavka zvuka iz aplikacije (Cache API 'dh-prefs' → 'sound-pref'); bez zapisa = zvuk uključen
async function soundEnabled() {
  try {
    const c = await caches.open('dh-prefs');
    const r = await c.match('sound-pref');
    if (!r) return true;
    const p = await r.json();
    return !(p && (p.enabled === false || p.enabled === 'false' || p.enabled === 0));
  } catch { return true; }
}
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = data.title || 'Novi online zahtjev';
  const body = data.body || '';
  event.waitUntil((async () => {
    const termin = data.page === 'kalendar';
    // 0.3.20: zvuk obavijesti – isključen u aplikaciji → tiha obavijest; aplikacija otvorena na ekranu → ton svira aplikacija (bez dvostrukog zvuka)
    const enabled = await soundEnabled();
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const shown = list.some((c) => c.visibilityState === 'visible');
    await self.registration.showNotification(title, { body, icon: 'icons/icon-192.png', silent: !enabled || shown, tag: termin ? 'termin-' + (data.apId || '') : undefined, data: termin ? { page: 'termini', apId: data.apId || '' } : { page: 'cekaonica' } });
    if (termin) { if (enabled && shown) for (const client of list) client.postMessage({ type: 'notif-sound' }); return; }
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

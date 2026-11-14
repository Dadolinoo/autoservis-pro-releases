const CACHE = 'javno-0.1.0';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE)); });
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

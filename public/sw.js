// Network-first: online you always get the latest files, offline you get the last copy seen.
addEventListener('install', () => skipWaiting());
addEventListener('activate', e => e.waitUntil(clients.claim()));
addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone();
    caches.open('app').then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request)));
});

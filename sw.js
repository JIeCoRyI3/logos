/* Offline cache for Εἰκόνες: the app opens from the cache at once and quietly fetches a newer version for next time. */
const CACHE = 'eikones-75300ad10f';
const ASSETS = ["./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./favicon-32.png"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('eikones-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    const fresh = fetch(req)
      .then(async r => { if (r.ok) { const copy = r.clone(); const c = await caches.open(CACHE); await c.put('./index.html', copy); } return r; })
      .catch(() => null);
    e.waitUntil(fresh);
    e.respondWith(
      caches.match('./index.html').then(hit => hit || fresh.then(r => r || new Response('Нет сети', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })))
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});

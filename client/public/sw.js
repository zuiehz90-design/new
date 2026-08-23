const CACHE_VERSION = 'nour-shell-v4';
const QURAN_CACHE = 'nour-quran-v1';
const QURAN_PREFIX = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_VERSION));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_VERSION && key !== QURAN_CACHE)
        .map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  if (url.href.startsWith(QURAN_PREFIX)) {
    event.respondWith(
      caches.open(QURAN_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Les réponses API sont privées et ne doivent jamais être persistées dans le SW.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const contentType = response.headers.get('content-type') ?? '';
        if (response.ok && !url.pathname.endsWith('/sw.js') && !contentType.includes('text/html')) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const index = await caches.match('/index.html');
          if (index) return index;
        }
        return new Response('Hors ligne', { status: 503 });
      }),
  );
});

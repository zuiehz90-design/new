// Nour Service Worker v7 — Stale-while-revalidate optimisé
const CACHE_VERSION = 'nour-shell-v7';
const QURAN_CACHE = 'nour-quran-v1';
const QURAN_PREFIX = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api';

// Timeout avant de tomber sur le cache en cas de lenteur réseau (ms)
const NETWORK_TIMEOUT_MS = 800;

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

// Helper : course réseau avec timeout — renvoie null si trop lent
function fetchWithTimeout(request, timeoutMs) {
  return Promise.race([
    fetch(request),
    new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // ── CDN Quran : cache-first (données statiques) ──
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

  // ── API privée : jamais dans le cache ──
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // ── Navigation : stale-while-revalidate accéléré ──
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(event.request) || await cache.match('/');
      const networkPromise = fetch(event.request)
        .then(async (response) => {
          if (response.ok) await cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => null);

      if (!cached) return (await networkPromise) || new Response('Hors ligne', { status: 503 });

      // Attendre max 800ms le réseau ; sinon le cache instantané suffit
      const fast = await fetchWithTimeout(event.request, NETWORK_TIMEOUT_MS);
      return fast || cached;
    })());
    return;
  }

  // ── Assets statiques : stale-while-revalidate ──
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkPromise = fetch(event.request)
        .then(async (response) => {
          const contentType = response.headers.get('content-type') ?? '';
          if (response.ok && !url.pathname.endsWith('/sw.js') && !contentType.includes('text/html')) {
            await cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => null);

      if (cached) {
        // Retourner le cache immédiatement, rafraîchir en arrière-plan
        void networkPromise;
        return cached;
      }
      const network = await networkPromise;
      if (network) return network;
      return new Response('Hors ligne', { status: 503 });
    }),
  );
});

// ── Messages du client ──
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

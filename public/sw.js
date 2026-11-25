const CACHE_NAME = 'gusto-shell-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

/** Network first so users always get the newest build; the cache is the offline fallback. */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const isSameOriginGet = request.method === 'GET' && new URL(request.url).origin === self.location.origin;
  if (!isSameOriginGet) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => (await caches.match(request)) ?? (await caches.match('/')) ?? Response.error())
  );
});

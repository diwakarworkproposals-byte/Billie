const CACHE_NAME = 'billie-cache-v12';

// Install: Cache critical static assets relative to current scope
self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const assetsToCache = [
    scope,
    `${scope}index.html`,
    `${scope}manifest.webmanifest`,
    `${scope}favicon.svg`,
    `${scope}icon.svg`,
    `${scope}icon-192.png`,
    `${scope}icon-512.png`
  ];

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache).catch((err) => {
        console.warn('[Billie SW] Pre-caching partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for fresh updates, Cache fallback for offline
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const scope = self.registration.scope;

  // For HTML navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = 
            await cache.match(`${scope}index.html`) || 
            await cache.match(scope) ||
            await cache.match(request);
          return cachedResponse || new Response('Offline: Billie is ready offline.', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // For static assets, scripts, stylesheets, and fonts: Network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

// Listen for skip waiting messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

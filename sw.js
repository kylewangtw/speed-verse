const CACHE_NAME = 'speedverse-v4';
const BASE_PATH = self.location.pathname.replace(/sw\.js$/, '');
const BASE_URL = `${self.location.origin}${BASE_PATH}`;
const ASSET_PATHS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/speedverse_icon_192.png',
  './icons/speedverse_icon_512.png'
];
const PRECACHE_URLS = ASSET_PATHS.map((path) => new URL(path, BASE_URL).href);
const OFFLINE_URL = new URL('./index.html', BASE_URL).href;

// Install - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Network-first for navigation, cache-first for same-origin assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
            return networkResponse;
          })
          .catch(() => {
            const acceptsHtml = event.request.headers.get('accept')?.includes('text/html');
            if (acceptsHtml) {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});


const CACHE_NAME = 'mood-diary-v4';

const PRECACHE_URLS = [
  '/mood-diary/',
  '/mood-diary/index.html',
  '/mood-diary/css/style.css',
  '/mood-diary/js/app.js',
  '/mood-diary/js/db.js',
  '/mood-diary/js/guided-entry.js',
  '/mood-diary/js/free-entry.js',
  '/mood-diary/js/notes.js',
  '/mood-diary/js/manage.js',
  '/mood-diary/js/quotes.js',
  '/mood-diary/js/knowledge.js',
  '/mood-diary/js/utils.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip IndexedDB requests and other non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached response, then update cache in background
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // Offline fallback

      return cached || fetchPromise;
    })
  );
});

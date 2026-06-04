const CACHE_NAME = 'cupverse-v7';

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/data.js',
  './js/storage.js',
  './js/ui.js',
  './js/countdown.js',
  './js/shareCard.js',
  './js/router.js',
  './js/intelligence.js',
  './world_cup_data.json',
  './manifest.json',
  './assets/placeholder-stadium.jpg',
];

self.addEventListener('install', event => {
  // Use no-cache so the SW always fetches fresh files from the network,
  // bypassing any stale browser HTTP cache entries.
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        STATIC_ASSETS.map(url =>
          fetch(url, { cache: 'no-cache' })
            .then(res => { if (res.ok) cache.put(url, res); })
            .catch(() => {})
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  if (url.includes('world_cup_data.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

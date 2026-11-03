const CACHE_NAME = 'agromap-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './crop_fields.geojson',
  './parcels.geojson',
  './councils.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // If it is a satellite tile or third-party online request, try network first, fallback to offline
  if (e.request.url.includes('arcgisonline.com') || e.request.url.includes('google.com') || e.request.url.includes('mapbox')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // App core assets - cache first, fallback to network
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, fetchRes.clone());
          return fetchRes;
        });
      });
    }).catch(() => caches.match('./index.html'))
  );
});

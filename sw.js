
const CACHE = 'motorsport-career-cache-v306';

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './hero.jpg',
  './stage-kart.jpg',
  './stage-club.jpg',
  './stage-gt.jpg',
  './career-stages.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll([...new Set(FILES)]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE)
            .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (
    event.request.method !== 'GET' ||
    new URL(event.request.url).origin !== self.location.origin
  ) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE)
            .then(cache => cache.put(event.request, copy))
            .catch(console.error);
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

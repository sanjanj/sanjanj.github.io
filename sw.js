// Sanjan MFD – Service Worker
// Caches the site for offline use. No external data is ever cached.

const CACHE_NAME = 'sanjan-v2';
const OFFLINE_URL = '/404.html';

const PRECACHE = [
  '/',
  '/index.html',
  '/404.html',
  '/manifest.json'
];

// ── INSTALL: cache core files ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: remove old caches ────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// ── FETCH: serve from cache, fall back to network ──────
self.addEventListener('fetch', (event) => {
  // Only handle GET requests to same origin
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache external requests (WhatsApp, Yahoo Finance, corsproxy)
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Only cache successful same-origin responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, toCache);
        });
        return response;

      }).catch(() => {
        // Offline fallback — show 404 page
        if (event.request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
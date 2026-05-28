// FIREADER Service Worker
const CACHE_NAME = 'fireader-v2';
const ASSETS = [
  './',
  './index.html',
  './css/base.css',
  './css/app.css',
  './js/db.js',
  './js/highlighter.js',
  './js/wikipedia.js',
  './js/epub.js',
  './js/app.js',
  './icons/icon.svg',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(ASSETS.map(url => cache.add(url).catch(() => {})));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Skip non-GET and cross-origin API requests (Wikipedia needs fresh data)
  if (e.request.method !== 'GET') return;
  
  const url = new URL(e.request.url);
  const isWikiAPI = url.hostname.includes('wikipedia.org') && url.pathname.includes('/api/');
  
  if (isWikiAPI) {
    // Network first for Wikipedia API
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({ error: 'offline' }), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // Cache first for app shell
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});

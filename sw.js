const CACHE_NAME = 'tributo-57-v1.2.0';

// Core assets to pre-cache for offline capability on GitHub Pages
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use cache.addAll with individual resilience so a missing remote font doesn't abort installation
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) => cache.add(url).catch((err) => console.warn(`Cache skip for: ${url}`, err)))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Exclude external user media blob URLs or audio streams
  if (url.protocol === 'blob:' || url.protocol === 'data:') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If valid response, clone into cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache if network is offline
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Return root page for navigation requests when offline
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }

        return new Response('Sin conexión', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});
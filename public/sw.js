const CACHE_NAME = 'trustline-app-shell-v2';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// OneSignal Web Push SDK
try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (e) {
  console.warn('[SW] OneSignal SDK script load skipped:', e);
}

// 1. Install event: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching static app shell resources...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate event: purge obsolete cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[SW] Purging obsolete cache shell:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch event: cache strategy routings
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Strategy A: Supabase API Calls (Network First with Cache Fallback)
  if (requestUrl.host.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open('supabase-api-cache').then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] Network offline. Serving Supabase payload from cache...');
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({ error: 'Network offline. Fetch response cache missing.' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Strategy B: Images & Icons (Cache First, Network Fallback & update)
  if (event.request.destination === 'image' || requestUrl.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    event.respondWith(
      caches.open('image-cache').then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy C: App Shell Static Assets (Network First, Cache Fallback)
  if (STATIC_ASSETS.includes(requestUrl.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategy D: Everything Else (Network First)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// 4. PWA Background Sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'trustline-data-sync') {
    console.log('[SW] Background sync triggered: trustline-data-sync');
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    const response = await fetch('/api/sync/flush', { method: 'POST' });
    if (!response.ok) throw new Error('Network sync flush failed');
    return response.json();
  } catch (err) {
    console.error('[SW] Sync offline data execution failed:', err);
    throw err;
  }
}

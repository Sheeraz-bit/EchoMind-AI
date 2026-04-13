// EchoMind AI Service Worker
const CACHE_NAME = 'echomind-cache-v3';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/offline.html',
  '/assets/fevicon/favicon.ico',
  '/assets/fevicon/favicon-16x16.png',
  '/assets/fevicon/favicon-32x32.png',
  '/assets/fevicon/apple-touch-icon.png',
  '/assets/fevicon/android-chrome-192x192.png',
  '/assets/fevicon/android-chrome-512x512.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Pre-cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    
    // API requests - network only (don't cache)
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(event.request)
          .catch((error) => {
            console.error('[SW] API fetch failed:', error);
            return new Response(
              JSON.stringify({ 
                error: 'Network connection lost',
                offline: true 
              }),
              { 
                status: 503, 
                headers: { 'Content-Type': 'application/json' } 
              }
            );
          })
      );
      return;
    }
    
    // Static assets - cache first then network
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|webmanifest)$/)) {
      event.respondWith(
        caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              // Return cached version and update in background
              fetch(event.request)
                .then((networkResponse) => {
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse);
                  });
                })
                .catch(() => {});
              return cachedResponse;
            }
            
            return fetch(event.request)
              .then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                  return networkResponse;
                });
              })
              .catch(() => {
                // If offline and asset not cached, return offline page for HTML
                if (url.pathname === '/' || url.pathname === '/index.html') {
                  return caches.match(OFFLINE_URL);
                }
                return new Response('Asset not available offline', { status: 404 });
              });
          })
      );
      return;
    }
  }
  
  // Default: network first with cache fallback for HTML
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful HTML responses
        if (response.status === 200 && 
            response.headers.get('content-type')?.includes('text/html')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL).then((offlineResponse) => {
            if (offlineResponse) return offlineResponse;
            return new Response('You are offline. Please check your connection.', {
              status: 503,
              headers: { 'Content-Type': 'text/html' }
            });
          });
        }
        return new Response('Network error', { status: 503 });
      })
  );
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'EchoMind AI has a new insight for you',
    icon: '/assets/fevicon/android-chrome-192x192.png',
    badge: '/assets/fevicon/favicon-32x32.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open EchoMind'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('EchoMind AI', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length > 0) {
            return clientList[0].focus();
          }
          return clients.openWindow('/');
        })
    );
  }
});

// Function to sync offline messages (implement as needed)
async function syncMessages() {
  console.log('[SW] Syncing offline messages');
  // This would sync any stored offline messages with the server
}
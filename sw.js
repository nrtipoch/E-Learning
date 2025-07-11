const CACHE_NAME = 'pwa-app-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Files to cache
const STATIC_FILES = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/features.js',
  '/js/storage.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install Event
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Installed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Install failed', error);
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch Event - Network First with Cache Fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    fetch(request)
      .then(response => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        // Add to dynamic cache
        caches.open(DYNAMIC_CACHE)
          .then(cache => {
            cache.put(request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // If it's a navigation request and no cache, return offline page
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Return a generic offline response
            return new Response('ขออภัย เนื้อหานี้ไม่สามารถใช้งานออฟไลน์ได้', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain; charset=utf-8'
              })
            });
          });
      })
  );
});

// Background Sync
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      syncData()
    );
  }
});

// Push Notification
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'PWA App';
  const options = {
    body: data.body || 'คุณมีการแจ้งเตือนใหม่',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'ดู',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'ปิด'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message from main thread
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Helper function to sync data
async function syncData() {
  try {
    console.log('Service Worker: Syncing data...');
    
    // Get pending data from IndexedDB or localStorage
    const pendingData = await getPendingData();
    
    if (pendingData && pendingData.length > 0) {
      // Send data to server
      for (const item of pendingData) {
        await sendToServer(item);
      }
      
      // Clear pending data
      await clearPendingData();
      
      // Notify main thread
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          data: { count: pendingData.length }
        });
      });
    }
    
    console.log('Service Worker: Sync completed');
  } catch (error) {
    console.error('Service Worker: Sync failed', error);
  }
}

// Helper functions for data management
async function getPendingData() {
  // Implementation depends on your storage choice
  // This is a placeholder
  return [];
}

async function sendToServer(data) {
  // Send data to your Google Apps Script or server
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync data');
  }
  
  return response.json();
}

async function clearPendingData() {
  // Clear pending data from storage
  // This is a placeholder
}

// Version check and update
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    checkForUpdates().then(hasUpdate => {
      event.ports[0].postMessage({ hasUpdate });
    });
  }
});

async function checkForUpdates() {
  try {
    const response = await fetch('/manifest.json', { cache: 'no-cache' });
    const manifest = await response.json();
    
    // Check if version has changed
    // This is a simple check - you might want more sophisticated versioning
    const currentVersion = CACHE_NAME;
    const latestVersion = manifest.version || 'v1.0.0';
    
    return currentVersion !== `pwa-app-${latestVersion}`;
  } catch (error) {
    console.error('Error checking for updates:', error);
    return false;
  }
}

const CACHE_NAME = 'budzetownik-cache-v1';

const urlsToCache = [
  './index.html?v=1',
  './style.css?v=1',
  './script.js?v=1',
  './manifest.json?v=1',
  './web-app-manifest-192x192.png?v=1',
  './web-app-manifest-512x512.png?v=1'
];

// Instalacja Service Workera i dodanie plików do cache
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalacja...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Dodawanie plików do cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Przechwytywanie żądań i serwowanie z cache
self.addEventListener('fetch', (event) => {
  console.log(`[Service Worker] Przechwytywanie żądania: ${event.request.url}`);
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clonedResponse = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clonedResponse);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Usuwanie starego cache i aktywacja nowego Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Aktywacja...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[Service Worker] Usuwanie starego cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Natychmiastowe przejęcie kontroli
    })
  );
});

// Obsługa notyfikacji push
self.addEventListener('push', (event) => {
  const data = event.data.json();
  console.log('[Service Worker] Otrzymano powiadomienie push:', data);
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: './web-app-manifest-192x192.png',
  });
});

// Obsługa synchronizacji w tle (opcjonalne, jeśli jest obsługiwane w aplikacji)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    console.log('[Service Worker] Synchronizacja w tle...');
    event.waitUntil(
      // Tutaj można dodać logikę synchronizacji np. transakcji z serwerem
      Promise.resolve()
    );
  }
});
const CACHE_NAME = 'budzetownik-cache-v5';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './web-app-manifest-192x192.png',
  './web-app-manifest-512x512.png',
];

// Instalacja Service Workera i dodanie plików do cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Otwieranie cache i dodawanie plików');
      return cache.addAll(urlsToCache);
    })
  );
});

// Przechwytywanie żądań i serwowanie z cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          console.error('Nie udało się pobrać zasobu:', event.request.url);
        })
      );
    })
  );
});

// Usuwanie starych wersji cache przy aktywacji nowego Service Workera
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Usuwanie starego cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Obsługa notyfikacji push
self.addEventListener('push', (event) => {
  const data = event.data.json();
  console.log('Otrzymano powiadomienie push:', data);
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: './web-app-manifest-192x192.png',
  });
});
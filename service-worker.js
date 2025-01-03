const CACHE_NAME = 'budzetownik-cache-v6';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './web-app-manifest-192x192.png',
  './web-app-manifest-512x512.png',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Instalacja Service Worker i dodanie plików do cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Otwieranie cache i dodawanie plików');
      return cache.addAll(urlsToCache);
    }).catch((error) => {
      console.error('Błąd podczas dodawania plików do cache:', error);
    })
  );
});

// Przechwytywanie żądań i serwowanie z cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Jeśli plik znajduje się w cache, zwróć go, w przeciwnym razie pobierz z sieci
      return response || fetch(event.request).catch(() => {
        console.warn('Błąd podczas pobierania zasobu:', event.request.url);
      });
    })
  );
});

// Usuwanie starych wersji cache przy aktywacji nowego Service Worker
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
  if (!event.data) {
    console.warn('Otrzymano pustą wiadomość push');
    return;
  }

  const data = event.data.json();
  console.log('Otrzymano powiadomienie push:', data);

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: './web-app-manifest-192x192.png',
    badge: './web-app-manifest-192x192.png'
  });
});

// Dodanie obsługi błędów dla cache
self.addEventListener('error', (event) => {
  console.error('Błąd Service Worker:', event);
});
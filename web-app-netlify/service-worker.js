// Service Worker para Agro Floppy PWA
const CACHE_NAME = 'agrofloppy-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard-backend.html',
  '/admin.html',
  '/styles.css',
  '/app-backend.js',
  '/fotos/logo.jpeg',
  '/fotos/fondo.jpeg'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('[Service Worker] Error al cachear:', error);
      })
  );
  
  // Activar inmediatamente
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Tomar control inmediatamente
  return self.clients.claim();
});

// Estrategia: Network First, luego Cache
self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // No cachear peticiones al API
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('agrofloppy-backend.onrender.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonarla y cachearla
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar servir desde cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Si no está en cache, mostrar página offline
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Notificaciones Push (para futuro)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recibido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Notificación de Agro Floppy',
    icon: '/fotos/logo.jpeg',
    badge: '/fotos/logo.jpeg',
    vibrate: [200, 100, 200],
    tag: 'agrofloppy-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification('Agro Floppy', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificación clickeada');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});



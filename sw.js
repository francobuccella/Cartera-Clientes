const CACHE_NAME = 'mi-cartera-v1';
const ASSETS = [
  '/Cartera-Clientes/',
  '/Cartera-Clientes/index.html',
  '/Cartera-Clientes/manifest.json'
];

// Instalación: cachear los assets principales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback a cache
self.addEventListener('fetch', event => {
  // Solo manejar requests GET del mismo origen
  if (event.request.method !== 'GET') return;
  
  // Requests a la API de Anthropic y storage siempre van a la red
  const url = new URL(event.request.url);
  if (url.hostname === 'api.anthropic.com') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, actualizamos el cache
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin red: servir desde cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback: index.html para navegación offline
          return caches.match('/Cartera-Clientes/index.html');
        });
      })
  );
});

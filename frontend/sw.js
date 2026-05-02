const CACHE_NAME = 'tninfo-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/img/logo.jpg',
  '/js/security.js',
  '/cliente/painel-cliente.html',
  '/cliente/css/cliente.css',
  '/cliente/css/dashboard.css'
];

// Instalação: Cacheia os arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                  .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Fetch: Tenta buscar no cache primeiro, se não tiver vai pra rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

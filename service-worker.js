const CACHE_NAME = 'leads-app-cache-v2'; // Versão do cache, altere para forçar atualização
const urlsToCache = [
    '/',
    '/index.html',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://unpkg.com/dexie@latest/dist/dexie.min.js', // Cacheia o Dexie.js
    // Adicione os SDKs do Firebase que você está usando (Firestore, Auth)
    'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js',
    'https://www.gstatic.com/firebasejs/10.12.3/firebase-analytics.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cache aberto e recursos pré-cacheados.');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Falha ao pré-cachear recursos:', error);
            })
    );
});

self.addEventListener('fetch', (event) => {
    // Intercepta requisições de rede
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Se o recurso estiver no cache, retorna-o
                if (response) {
                    return response;
                }
                // Caso contrário, faz a requisição normal à rede
                return fetch(event.request).catch(() => {
                    // Se a rede falhar (offline), podemos retornar uma página offline genérica
                    // Por enquanto, não faremos isso para todas as requisições.
                    // Isso é mais complexo e depende do que você quer mostrar em caso de falha de rede.
                    // Para APIs do Firebase, o próprio SDK lida com o offline.
                });
            })
    );
});

self.addEventListener('activate', (event) => {
    // Limpa caches antigos
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log(`Service Worker: Deletando cache antigo: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
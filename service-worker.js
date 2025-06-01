// service-worker.js

const CACHE_NAME = 'lead-app-cache-v2'; // Incremente a versão se fizer alterações nos arquivos cacheados
const URLS_TO_CACHE = [
    './', // Cacheia a página principal (index.html no root)
    './index.html', // Seja explícito sobre o index.html
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap', // Se estiver usando a fonte Inter
    'https://unpkg.com/dexie@latest/dist/dexie.min.js' // Dexie CDN
];

self.addEventListener('install', event => {
    console.log('Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cacheando App Shell...');
                const promises = URLS_TO_CACHE.map(url => {
                    return fetch(new Request(url, { mode: 'cors' })) 
                        .then(response => {
                            if (!response.ok) {
                                console.warn(`Service Worker: Falha ao buscar ${url} para cache (status: ${response.status}).`);
                                return Promise.resolve(); 
                            }
                            return cache.put(url, response);
                        })
                        .catch(err => {
                            console.error(`Service Worker: Erro ao buscar e cachear ${url}`, err);
                        });
                });
                return Promise.all(promises);
            })
            .then(() => {
                console.log('Service Worker: App Shell cacheado com sucesso.');
                return self.skipWaiting(); 
            })
            .catch(err => {
                console.error('Service Worker: Falha ao cachear App Shell', err);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Ativando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Limpando cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Ativado e caches antigos limpos.');
            return self.clients.claim(); 
        })
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response.ok) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    console.log('Service Worker: Rede falhou para navegação, servindo do cache:', event.request.url);
                    return caches.match(event.request);
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                    }
                    return networkResponse;
                }).catch(error => {
                    console.error('Service Worker: Falha ao buscar da rede para:', event.request.url, error);
                });
            })
    );
});

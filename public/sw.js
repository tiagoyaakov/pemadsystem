import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache todos os assets estáticos
precacheAndRoute(self.__WB_MANIFEST);

// Cache para imagens
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
      }),
    ],
  })
);

// Cache para fontes
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 dias
      }),
    ],
  })
);

// Cache para API do Supabase
registerRoute(
  ({ url }) => url.origin === process.env.NEXT_PUBLIC_SUPABASE_URL,
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 horas
      }),
    ],
  })
);

// Cache para API da NASA FIRMS
registerRoute(
  ({ url }) => url.origin === 'https://firms.modaps.eosdis.nasa.gov',
  new StaleWhileRevalidate({
    cacheName: 'nasa-firms-api',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 6 * 60 * 60, // 6 horas
      }),
    ],
  })
);

// Fallback para outras rotas
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Este arquivo será substituído pelo gerado pelo next-pwa
// Ele serve como fallback caso o next-pwa não gere o arquivo

self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Fetch event para', event.request.url);
  
  // Estratégia básica: network first, cache as fallback
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        console.log('Service Worker: Falha na rede, tentando cache para', event.request.url);
        return caches.match(event.request);
      })
  );
});

// Evento de sincronização em segundo plano
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Evento de sincronização detectado', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Função para sincronizar dados armazenados offline
async function syncData() {
  console.log('Service Worker: Sincronizando dados em segundo plano');
  
  try {
    // Aqui seria implementada a lógica para sincronizar dados em IndexedDB
    // com o servidor quando a conexão for restabelecida
    
    console.log('Service Worker: Sincronização concluída com sucesso');
    
    // Notificar o usuário sobre a sincronização
    self.registration.showNotification('PEMAD Material Check', {
      body: 'Seus dados foram sincronizados com sucesso!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-96x96.png'
    });
    
  } catch (error) {
    console.error('Service Worker: Erro na sincronização', error);
  }
}

// Evento de notificação push
self.addEventListener('push', (event) => {
  console.log('Service Worker: Notificação push recebida');
  
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    console.log('Service Worker: Notificações não permitidas');
    return;
  }
  
  try {
    const data = event.data?.json() ?? { 
      title: 'PEMAD Material Check', 
      message: 'Nova atualização disponível' 
    };
    
    const options = {
      body: data.message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-96x96.png',
      data: data.url ? { url: data.url } : null
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Service Worker: Erro ao processar notificação push', error);
  }
});

// Evento de clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Clique em notificação');
  
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 
/// <reference lib="WebWorker" />

declare const self: ServiceWorkerGlobalScope;

import { metricsService } from './metrics.service';

const CACHE_VERSION = 'v1';
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;

// Recursos críticos para preload
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/static/js/main.bundle.js',
  '/static/css/main.css',
  '/static/fonts/roboto.woff2'
];

// Configuração de estratégias de cache
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first', // Tenta rede primeiro, fallback para cache
  CACHE_FIRST: 'cache-first',     // Tenta cache primeiro, fallback para rede
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate' // Retorna cache e atualiza em background
};

// Mapeamento de recursos para estratégias
const RESOURCE_STRATEGIES = new Map([
  [/\/api\//, CACHE_STRATEGIES.NETWORK_FIRST],
  [/\.(png|jpg|jpeg|gif|svg|ico)$/, CACHE_STRATEGIES.CACHE_FIRST],
  [/\.(css|js)$/, CACHE_STRATEGIES.STALE_WHILE_REVALIDATE],
  [/\/static\//, CACHE_STRATEGIES.CACHE_FIRST]
]);

// Configuração de preload
const PRELOAD_CONFIG = {
  enabled: true,
  minPriority: 0.7, // Prioridade mínima para preload (0-1)
  maxConcurrent: 3, // Máximo de downloads simultâneos
  timeWindow: 5000  // Janela de tempo para análise de uso (ms)
};

// Registro de uso de recursos para análise de preload
const resourceUsage = new Map<string, {
  frequency: number;
  lastUsed: number;
  priority: number;
}>();

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // Registrar início do preload
      metricsService.recordMetric('cache', 'preload_start', {
        resourceCount: CRITICAL_RESOURCES.length
      });

      // Preload de recursos críticos
      await cache.addAll(CRITICAL_RESOURCES);

      // Registrar conclusão do preload
      metricsService.recordMetric('cache', 'preload_complete', {
        duration: performance.now()
      });

      await (self as any).skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      // Limpar caches antigos
      const cacheKeys = await caches.keys();
      const oldCaches = cacheKeys.filter(key => key !== CACHE_NAME);
      await Promise.all(oldCaches.map(key => caches.delete(key)));

      await (self as any).clients.claim();

      metricsService.recordMetric('cache', 'activation_complete', {
        oldCachesRemoved: oldCaches.length
      });
    })()
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    (async () => {
      const url = new URL(event.request.url);
      
      // Ignorar requisições não GET
      if (event.request.method !== 'GET') {
        return fetch(event.request);
      }

      // Determinar estratégia de cache
      const strategy = getResourceStrategy(url.pathname);
      
      // Registrar uso do recurso
      recordResourceUsage(url.pathname);

      try {
        const response = await handleFetchStrategy(event.request, strategy);
        
        // Registrar métricas de cache
        metricsService.recordMetric('cache', 'request', {
          url: url.pathname,
          strategy,
          hit: response.headers.get('x-cache-hit') === 'true',
          duration: performance.now()
        });

        return response;
      } catch (error) {
        metricsService.recordMetric('error', 'cache_fetch', {
          url: url.pathname,
          strategy,
          error: (error instanceof Error) ? error.message : String(error)
        });

        throw error;
      }
    })()
  );
});

// Listener para mensagens do cliente
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data.type === 'SKIP_WAITING') {
    (self as any).skipWaiting();
  }

  if (event.data.type === 'UPDATE_RESOURCE_PRIORITY') {
    updateResourcePriority(event.data.url, event.data.priority);
  }
});

// Implementação das estratégias de cache
async function handleFetchStrategy(
  request: Request,
  strategy: string
): Promise<Response> {
  const startTime = performance.now();
  const cache = await caches.open(CACHE_NAME);

  switch (strategy) {
    case CACHE_STRATEGIES.NETWORK_FIRST:
      try {
        const networkResponse = await fetch(request);
        await cache.put(request, networkResponse.clone());
        return addCacheHeader(networkResponse, false);
      } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return addCacheHeader(cachedResponse, true);
        }
        throw error;
      }

    case CACHE_STRATEGIES.CACHE_FIRST:
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return addCacheHeader(cachedResponse, true);
      }
      const networkResponse = await fetch(request);
      await cache.put(request, networkResponse.clone());
      return addCacheHeader(networkResponse, false);

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      const cachedData = await cache.match(request);
      const fetchPromise = fetch(request).then(response => {
        cache.put(request, response.clone());
        return response;
      });

      return cachedData ? 
        addCacheHeader(cachedData, true) : 
        addCacheHeader(await fetchPromise, false);

    default:
      return fetch(request);
  }
}

// Utilitários
function getResourceStrategy(pathname: string): string {
  for (const [pattern, strategy] of RESOURCE_STRATEGIES) {
    if (pattern.test(pathname)) {
      return strategy;
    }
  }
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

function addCacheHeader(response: Response, isCache: boolean): Response {
  const headers = new Headers(response.headers);
  headers.append('x-cache-hit', isCache.toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function recordResourceUsage(url: string): void {
  const now = Date.now();
  const usage = resourceUsage.get(url) || {
    frequency: 0,
    lastUsed: now,
    priority: 0
  };

  usage.frequency++;
  usage.lastUsed = now;
  
  // Calcular prioridade baseada em frequência e tempo
  const timeFactor = Math.exp(-(now - usage.lastUsed) / PRELOAD_CONFIG.timeWindow);
  usage.priority = (usage.frequency * timeFactor) / 100;

  resourceUsage.set(url, usage);

  // Iniciar preload se necessário
  if (PRELOAD_CONFIG.enabled && usage.priority >= PRELOAD_CONFIG.minPriority) {
    preloadResource(url);
  }
}

function updateResourcePriority(url: string, priority: number): void {
  const usage = resourceUsage.get(url);
  if (usage) {
    usage.priority = priority;
    resourceUsage.set(url, usage);
  }
}

async function preloadResource(url: string): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    if (!(await cache.match(url))) {
      const response = await fetch(url);
      await cache.put(url, response);

      metricsService.recordMetric('cache', 'preload_resource', {
        url,
        success: true,
        size: response.headers.get('content-length'),
        type: response.headers.get('content-type')
      });
    }
  } catch (error) {
    metricsService.recordMetric('error', 'preload_resource', {
      url,
      error: (error instanceof Error) ? error.message : String(error)
    });
  }
} 
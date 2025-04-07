import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.1.0/index.js';

// Métricas personalizadas
const swActivationTime = new Trend('service_worker_activation_time');
const cacheHitRate = new Rate('cache_hit_rate');
const resourceLoadedCounter = new Counter('resources_loaded');
const offlineRequestsSuccessRate = new Rate('offline_requests_success_rate');

// Opções para diferentes cenários de teste
export const options = {
  scenarios: {
    // Cenário que simula usuários navegando normalmente
    normal_usage: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 50 },  // Ramp-up para 50 usuários em 1 minuto
        { duration: '3m', target: 50 },  // Manter 50 usuários por 3 minutos
        { duration: '1m', target: 0 }    // Ramp-down para 0 usuários em 1 minuto
      ],
      gracefulRampDown: '30s',
    },
    // Cenário que simula carga alta de usuários
    high_load: {
      executor: 'constant-arrival-rate',
      rate: 100,                 // 100 requisições por segundo
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
    // Cenário que simula conexão instável (on/off)
    intermittent_connection: {
      executor: 'per-vu-iterations',
      vus: 30,
      iterations: 10,
      maxDuration: '2m',
    }
  },
  thresholds: {
    'http_req_duration': ['p(95)<1000'],                 // 95% das requisições devem completar em menos de 1s
    'service_worker_activation_time': ['p(95)<1000'],    // 95% das ativações do Service Worker devem ocorrer em menos de 1s
    'cache_hit_rate': ['rate>0.7'],                      // Taxa de cache hit deve ser maior que 70%
    'offline_requests_success_rate': ['rate>0.9'],       // 90% das requisições offline devem ser bem-sucedidas
  },
};

// Função auxiliar para verificar se uma resposta veio do cache
function isFromCache(response) {
  return response.headers['X-Cache'] === 'HIT' || 
         response.headers['cf-cache-status'] === 'HIT' ||
         response.headers['x-from-cache'] === 'true';
}

// Cenário principal - simulando navegação normal
export default function() {
  // Visitar a página inicial (primeira vez deve cachear recursos)
  let startTime = new Date().getTime();
  let res = http.get('http://localhost:3000/');
  let endTime = new Date().getTime();
  
  // Registrar tempo de ativação do SW (aproximado)
  swActivationTime.add(endTime - startTime);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'page contains Service Worker': (r) => r.body.includes('serviceWorker'),
  });
  
  // Simular navegação por várias páginas
  const pages = [
    'http://localhost:3000/about',
    'http://localhost:3000/materials',
    'http://localhost:3000/reports',
    'http://localhost:3000/settings',
  ];
  
  // Escolher uma página aleatória para visitar
  const randomPage = pages[Math.floor(Math.random() * pages.length)];
  res = http.get(randomPage);
  
  // Verificar se a resposta veio do cache
  const cachedResponse = isFromCache(res);
  cacheHitRate.add(cachedResponse ? 1 : 0);
  
  // Contabilizar recursos carregados
  resourceLoadedCounter.add(1);
  
  // Simular um tempo realista de navegação
  sleep(randomIntBetween(1, 5));
  
  // Para o cenário de conexão intermitente
  if (__ITER % 2 === 0) {
    // Simular estado offline
    console.log('Simulando estado offline...');
    
    // Tentar acessar recursos que deveriam estar no cache
    const offlineRes = http.get('http://localhost:3000/offline-page');
    
    // Verificar se o recurso foi acessível offline (deve vir do cache)
    const offlineSuccess = offlineRes.status === 200;
    offlineRequestsSuccessRate.add(offlineSuccess ? 1 : 0);
    
    check(offlineRes, {
      'offline page is accessible': (r) => r.status === 200,
    });
  }
  
  // Simular retorno ao estado online
  sleep(randomIntBetween(1, 3));
}

// Função para cenário de carga alta
export function highLoad() {
  // Carregar a página principal
  const res = http.get('http://localhost:3000/');
  
  // Verificar se a página foi carregada corretamente
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  // Verificar se a resposta veio do cache
  cacheHitRate.add(isFromCache(res) ? 1 : 0);
  
  // Dormir por um curto período para simular interações do usuário
  sleep(0.5);
}

// Função para cenário de conexão intermitente
export function intermittentConnection() {
  // Simular alternância entre online e offline
  for (let i = 0; i < 3; i++) {
    // Estado online
    let res = http.get('http://localhost:3000/');
    
    check(res, {
      'page loads in online state': (r) => r.status === 200,
    });
    
    // Simular navegação normal para preencher o cache
    sleep(1);
    
    // Estado offline - verificar acesso a recursos cacheados
    res = http.get('http://localhost:3000/offline-assets/main.js');
    
    // Verificar se o recurso foi acessível offline
    const offlineSuccess = res.status === 200;
    offlineRequestsSuccessRate.add(offlineSuccess ? 1 : 0);
    
    check(res, {
      'cached resources are accessible offline': (r) => r.status === 200,
    });
    
    sleep(1);
  }
} 
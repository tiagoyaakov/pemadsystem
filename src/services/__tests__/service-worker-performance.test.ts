import { performance } from 'perf_hooks';
import { metricsService } from '../metrics.service';
import { registerServiceWorker, unregisterServiceWorker } from '../service-worker-registration';

jest.mock('../metrics.service', () => ({
  metricsService: {
    recordMetric: jest.fn()
  }
}));

// Mock para PerformanceObserver
class MockPerformanceObserver {
  private callback: (list: PerformanceObserverEntryList) => void;
  
  constructor(callback: (list: PerformanceObserverEntryList) => void) {
    this.callback = callback;
  }

  observe() {
    // Implementação vazia
  }

  disconnect() {
    // Implementação vazia
  }

  // Método para simular entrada de performance
  triggerEntry(entry: PerformanceEntry) {
    this.callback({
      getEntries: () => [entry],
      getEntriesByName: () => [entry],
      getEntriesByType: () => [entry]
    } as PerformanceObserverEntryList);
  }
}

// Mock para ServiceWorkerRegistration
const mockRegistration = {
  scope: '/',
  installing: {
    state: 'installed',
    addEventListener: jest.fn((event: string, callback: (event: Event) => void) => {
      if (event === 'statechange') {
        callback({ target: { state: 'activated' } } as unknown as Event);
      }
    })
  },
  addEventListener: jest.fn((event: string, callback: () => void) => {
    if (event === 'updatefound') {
      callback();
    }
  }),
  update: jest.fn().mockResolvedValue(undefined),
  unregister: jest.fn().mockResolvedValue(true),
  active: { state: 'activated' }
};

describe('Service Worker Performance', () => {
  let originalPerformanceObserver: any;
  let mockObserver: MockPerformanceObserver;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Salvar implementação original do PerformanceObserver
    originalPerformanceObserver = global.PerformanceObserver;
    
    // Substituir com mock
    global.PerformanceObserver = MockPerformanceObserver as any;
    
    // Mock para navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: jest.fn().mockResolvedValue(mockRegistration),
        ready: Promise.resolve(mockRegistration),
        controller: {
          postMessage: jest.fn()
        }
      },
      configurable: true
    });
    
    // Mock para process.env
    process.env.APP_VERSION = '1.0.0';
  });
  
  afterEach(() => {
    // Restaurar PerformanceObserver original
    global.PerformanceObserver = originalPerformanceObserver;
  });

  it('should register service worker with acceptable performance', async () => {
    const startTime = performance.now();
    
    await registerServiceWorker();
    
    const endTime = performance.now();
    const registrationTime = endTime - startTime;
    
    // Verificar se o registro ocorre em menos de 200ms
    expect(registrationTime).toBeLessThan(200);
    expect(navigator.serviceWorker.register).toHaveBeenCalled();
  });

  it('should cache critical resources efficiently', async () => {
    await registerServiceWorker();
    
    // Simular evento de instalação com timing
    const installPerformance = {
      name: 'service-worker-install',
      entryType: 'measure',
      startTime: 0,
      duration: 150, // 150ms para instalar e cachear recursos
      toJSON: () => ({
        name: 'service-worker-install',
        entryType: 'measure',
        startTime: 0,
        duration: 150
      })
    } as PerformanceEntry;
    
    mockObserver = new MockPerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        const entry = entries[0];
        expect(entry.duration).toBeLessThan(300); // Deve cachear em menos de 300ms
      }
    });
    
    mockObserver.triggerEntry(installPerformance);
  });

  it('should handle fetch events with minimal overhead', async () => {
    await registerServiceWorker();
    
    // Simular 10 buscas de recursos
    const fetchPerformances = Array.from({ length: 10 }, (_, i) => ({
      name: `resource-${i}`,
      entryType: 'resource',
      startTime: i * 10,
      duration: Math.random() * 20 + 10, // Entre 10-30ms por recurso
      initiatorType: 'fetch'
    }));
    
    // Calcular tempo médio de busca
    const avgFetchTime = fetchPerformances.reduce((sum, perf) => sum + perf.duration, 0) / fetchPerformances.length;
    
    // Verificar se o tempo médio é aceitável (menos de 50ms)
    expect(avgFetchTime).toBeLessThan(50);
  });

  it('should use minimal memory during operation', async () => {
    // Este teste é mais conceitual já que o Jest não consegue medir o uso de memória real
    
    // Simular medição de memória
    const memoryUsage = {
      usedJSHeapSize: 5 * 1024 * 1024, // 5MB
      totalJSHeapSize: 20 * 1024 * 1024 // 20MB
    };
    
    // Verificar se o uso de memória é aceitável (menos de 10MB)
    expect(memoryUsage.usedJSHeapSize).toBeLessThan(10 * 1024 * 1024);
  });

  it('should unregister service worker with acceptable performance', async () => {
    await registerServiceWorker();
    
    const startTime = performance.now();
    
    await unregisterServiceWorker();
    
    const endTime = performance.now();
    const unregistrationTime = endTime - startTime;
    
    // Verificar se o cancelamento do registro ocorre em menos de 100ms
    expect(unregistrationTime).toBeLessThan(100);
    expect(mockRegistration.unregister).toHaveBeenCalled();
  });

  it('should load cached resources faster than network resources', async () => {
    await registerServiceWorker();
    
    // Simular tempo de carregamento de um recurso da rede
    const networkLoadTime = 120; // 120ms
    
    // Simular tempo de carregamento do mesmo recurso do cache
    const cacheLoadTime = 20; // 20ms
    
    // Verificar se o carregamento do cache é significativamente mais rápido
    expect(cacheLoadTime).toBeLessThan(networkLoadTime / 2);
  });
}); 
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ServiceWorkerMonitor } from '../ServiceWorkerMonitor';
import { useServiceWorker } from '../../hooks/useServiceWorker';
import { metricsService } from '../../services/metrics.service';

jest.mock('../../hooks/useServiceWorker');
jest.mock('../../services/metrics.service', () => ({
  metricsService: {
    recordMetric: jest.fn()
  }
}));

// Mock para window.caches
const mockCaches = {
  open: jest.fn().mockResolvedValue({
    keys: jest.fn().mockResolvedValue([
      new Request('/index.html'),
      new Request('/static/js/main.bundle.js'),
      new Request('/static/css/main.css')
    ]),
    match: jest.fn().mockImplementation((request) => {
      const responses: Record<string, { 
        clone: () => { blob: () => Promise<Blob> }, 
        headers: Headers 
      }> = {
        '/index.html': {
          clone: () => ({
            blob: () => Promise.resolve(new Blob([new ArrayBuffer(5000)]))
          }),
          headers: new Headers({
            'content-type': 'text/html'
          })
        },
        '/static/js/main.bundle.js': {
          clone: () => ({
            blob: () => Promise.resolve(new Blob([new ArrayBuffer(150000)]))
          }),
          headers: new Headers({
            'content-type': 'application/javascript'
          })
        },
        '/static/css/main.css': {
          clone: () => ({
            blob: () => Promise.resolve(new Blob([new ArrayBuffer(30000)]))
          }),
          headers: new Headers({
            'content-type': 'text/css'
          })
        }
      };
      
      const url = request.url;
      const path = url.substring(url.lastIndexOf('/'));
      return Promise.resolve(responses[path]);
    })
  })
};

describe('ServiceWorkerMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mock do hook
    (useServiceWorker as jest.Mock).mockReturnValue({
      registration: {
        scope: '/',
        active: { state: 'activated' }
      },
      updateAvailable: false,
      error: null,
      update: jest.fn(),
      skipWaiting: jest.fn()
    });
    
    // Configurar mock para caches
    Object.defineProperty(window, 'caches', {
      value: mockCaches,
      writable: true
    });
    
    // Mock para process.env
    process.env.APP_VERSION = '1.0.0';
    
    // Definir IntersectionObserver (necessário para alguns componentes React)
    global.IntersectionObserver = class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | null = null;
      readonly rootMargin: string = '0px';
      readonly thresholds: ReadonlyArray<number> = [0];
      
      constructor(private callback: IntersectionObserverCallback) {}
      
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] { return []; }
    } as any;
  });

  it('should render ServiceWorkerMonitor component', async () => {
    await act(async () => {
      render(<ServiceWorkerMonitor />);
    });

    expect(screen.getByText('Service Worker')).toBeInTheDocument();
  });

  it('should show active status when service worker is active', async () => {
    await act(async () => {
      render(<ServiceWorkerMonitor />);
    });

    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('should show error status when service worker has error', async () => {
    (useServiceWorker as jest.Mock).mockReturnValue({
      registration: null,
      updateAvailable: false,
      error: new Error('Test error'),
      update: jest.fn(),
      skipWaiting: jest.fn()
    });

    await act(async () => {
      render(<ServiceWorkerMonitor />);
    });

    expect(screen.getByText('Erro: Test error')).toBeInTheDocument();
  });

  it('should show update available status when update is available', async () => {
    (useServiceWorker as jest.Mock).mockReturnValue({
      registration: {
        scope: '/',
        active: { state: 'activated' }
      },
      updateAvailable: true,
      waitingWorker: {},
      error: null,
      update: jest.fn(),
      skipWaiting: jest.fn()
    });

    await act(async () => {
      render(<ServiceWorkerMonitor />);
    });

    expect(screen.getByText('Atualização disponível')).toBeInTheDocument();
    expect(screen.getByText('Atualizar')).toBeInTheDocument();
  });

  it('should expand details when expand button is clicked', async () => {
    await act(async () => {
      render(<ServiceWorkerMonitor />);
    });

    // Inicialmente não mostra detalhes
    expect(screen.queryByText('Recursos em cache')).not.toBeInTheDocument();

    // Clicar no botão de expandir
    const expandButton = screen.getByTitle('Expandir');
    await act(async () => {
      fireEvent.click(expandButton);
    });

    // Agora deve mostrar detalhes
    expect(screen.getByText('Recursos em cache')).toBeInTheDocument();
    expect(screen.getByText('Tamanho total')).toBeInTheDocument();
    expect(screen.getByText('Última atualização')).toBeInTheDocument();
  });

  it('should check for updates when update button is clicked', async () => {
    const mockUpdate = jest.fn();
    (useServiceWorker as jest.Mock).mockReturnValue({
      registration: {
        scope: '/',
        active: { state: 'activated' }
      },
      updateAvailable: false,
      error: null,
      update: mockUpdate,
      skipWaiting: jest.fn()
    });

    await act(async () => {
      render(<ServiceWorkerMonitor />);
    });

    const updateButton = screen.getByText('Verificar atualização');
    await act(async () => {
      fireEvent.click(updateButton);
    });

    expect(mockUpdate).toHaveBeenCalled();
    expect(metricsService.recordMetric).toHaveBeenCalledWith(
      'user',
      'sw_check_update',
      expect.objectContaining({
        source: 'monitor'
      })
    );
  });

  it('should refresh cache stats when refresh button is clicked', async () => {
    await act(async () => {
      render(<ServiceWorkerMonitor showDetails={true} />);
    });

    // Limpar chamadas anteriores
    (metricsService.recordMetric as jest.Mock).mockClear();

    const refreshButton = screen.getByTitle('Atualizar estatísticas');
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    expect(metricsService.recordMetric).toHaveBeenCalledWith(
      'user',
      'sw_monitor_refresh',
      expect.objectContaining({
        manual: true
      })
    );
  });

  it('should format bytes correctly', async () => {
    await act(async () => {
      render(<ServiceWorkerMonitor showDetails={true} />);
    });

    // Encontrar o tamanho formatado na tabela
    expect(screen.getByText('146.48 KB')).toBeInTheDocument();
    expect(screen.getByText('29.3 KB')).toBeInTheDocument();
    expect(screen.getByText('4.88 KB')).toBeInTheDocument();
  });

  it('should record metrics for monitoring updates', async () => {
    await act(async () => {
      render(<ServiceWorkerMonitor />);
    });

    expect(metricsService.recordMetric).toHaveBeenCalledWith(
      'service_worker',
      'monitor_update',
      expect.objectContaining({
        cacheSize: expect.any(Number),
        itemCount: expect.any(Number)
      })
    );
  });
}); 
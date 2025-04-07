import { rumService } from '../rum.service';
import { metricsService } from '../metrics.service';
import { alertService } from '../alert.service';
import newrelic from 'newrelic';

jest.mock('newrelic', () => ({
  recordCustomEvent: jest.fn()
}));

jest.mock('../alert.service', () => ({
  alertService: {
    sendAlert: jest.fn()
  }
}));

describe('RUM and Metrics Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    rumService.cleanup();
    metricsService.cleanup();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('User Metrics Flow', () => {
    it('should collect and record user metrics through RUM', async () => {
      // Inicializar RUM
      await rumService.init();

      // Simular dados do navegador
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/90.0.4430.212',
        configurable: true
      });

      Object.defineProperty(window.navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 50
        },
        configurable: true
      });

      // Verificar se as métricas do usuário foram coletadas
      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'user_device',
          attributes: expect.objectContaining({
            browser: 'Chrome',
            os: 'Windows',
            connection: '4g'
          })
        })
      );
    });

    it('should track viewport changes and debounce updates', async () => {
      await rumService.init();

      // Simular múltiplas mudanças de viewport
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));

      jest.runAllTimers();

      // Verificar se apenas uma métrica foi registrada após o debounce
      const viewportMetrics = metricsService['metricsBuffer'].filter(
        m => m.name === 'user_viewport'
      );
      expect(viewportMetrics).toHaveLength(1);
    });
  });

  describe('Performance Metrics Flow', () => {
    it('should track and alert on performance issues', async () => {
      await rumService.init();

      // Simular entrada de performance
      const observer = new PerformanceObserver(() => {});
      const entry = {
        entryType: 'largest-contentful-paint',
        startTime: 3500, // Acima do limite crítico
        element: document.createElement('div')
      };

      observer.callback([entry]);

      // Verificar se a métrica foi registrada
      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'performance_lcp',
          attributes: expect.objectContaining({
            duration: 3500
          })
        })
      );

      // Verificar se o alerta foi enviado
      expect(alertService.sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'critical',
          metric: 'lcp',
          value: 3500
        })
      );
    });

    it('should aggregate multiple performance metrics', async () => {
      await rumService.init();

      // Simular várias métricas de performance
      const metrics = [
        { entryType: 'first-contentful-paint', startTime: 1000 },
        { entryType: 'largest-contentful-paint', startTime: 2000 },
        { entryType: 'layout-shift', value: 0.1, hadRecentInput: false }
      ];

      metrics.forEach(metric => {
        const observer = new PerformanceObserver(() => {});
        observer.callback([metric]);
      });

      // Verificar se todas as métricas foram registradas
      const performanceMetrics = metricsService['metricsBuffer'].filter(
        m => m.name.startsWith('performance_')
      );
      expect(performanceMetrics).toHaveLength(3);
    });
  });

  describe('Error Tracking Flow', () => {
    it('should capture and record JavaScript errors', async () => {
      await rumService.init();

      // Simular erro JavaScript
      const error = new Error('Test error');
      window.dispatchEvent(new ErrorEvent('error', { error }));

      // Verificar se o erro foi registrado
      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'error_javascript',
          attributes: expect.objectContaining({
            message: 'Test error',
            type: 'Error'
          })
        })
      );
    });

    it('should track unhandled promise rejections', async () => {
      await rumService.init();

      // Simular rejeição de promise não tratada
      const error = new Error('Promise rejection');
      window.dispatchEvent(
        new PromiseRejectionEvent('unhandledrejection', {
          reason: error,
          promise: Promise.reject(error)
        })
      );

      // Verificar se a rejeição foi registrada
      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'error_promise_rejection',
          attributes: expect.objectContaining({
            message: 'Promise rejection'
          })
        })
      );
    });
  });

  describe('Resource Monitoring Flow', () => {
    it('should track resource loading errors', async () => {
      await rumService.init();

      // Simular erro de carregamento de recurso
      const img = document.createElement('img');
      img.src = 'invalid-image.jpg';
      document.body.appendChild(img);

      // Disparar evento de erro
      img.dispatchEvent(new Event('error'));

      // Verificar se o erro foi registrado
      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'error_resource',
          attributes: expect.objectContaining({
            resourceType: 'img',
            src: 'invalid-image.jpg'
          })
        })
      );

      document.body.removeChild(img);
    });

    it('should monitor resource timing', async () => {
      await rumService.init();

      // Simular entrada de resource timing
      const observer = new PerformanceObserver(() => {});
      const entry = {
        entryType: 'resource',
        name: 'https://api.example.com/data',
        initiatorType: 'fetch',
        duration: 500,
        transferSize: 1024
      };

      observer.callback([entry]);

      // Verificar se a métrica foi registrada
      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'resource_timing',
          attributes: expect.objectContaining({
            url: 'https://api.example.com/data',
            type: 'fetch',
            duration: 500,
            size: 1024
          })
        })
      );
    });
  });

  describe('Metric Buffering and Flushing', () => {
    it('should flush metrics when buffer is full', async () => {
      await rumService.init();

      // Gerar métricas suficientes para encher o buffer
      for (let i = 0; i < 100; i++) {
        metricsService.recordMetric('test', `metric_${i}`, { value: i });
      }

      // Verificar se o New Relic foi chamado para registrar os eventos
      expect(newrelic.recordCustomEvent).toHaveBeenCalled();
      expect(metricsService['metricsBuffer']).toHaveLength(0);
    });

    it('should preserve metric order during flush', async () => {
      await rumService.init();

      const metrics = [
        { category: 'test', name: 'first', value: 1 },
        { category: 'test', name: 'second', value: 2 },
        { category: 'test', name: 'third', value: 3 }
      ];

      metrics.forEach(m => {
        metricsService.recordMetric(m.category, m.name, { value: m.value });
      });

      await metricsService.cleanup();

      // Verificar se as métricas foram registradas na ordem correta
      const calls = (newrelic.recordCustomEvent as jest.Mock).mock.calls;
      expect(calls[0][1].value).toBe(1);
      expect(calls[1][1].value).toBe(2);
      expect(calls[2][1].value).toBe(3);
    });
  });

  describe('Alert Integration', () => {
    it('should trigger alerts based on aggregated metrics', async () => {
      await rumService.init();

      // Simular várias interações lentas
      for (let i = 0; i < 5; i++) {
        metricsService.recordUserInteraction('button', 'click', 2000);
      }

      // Verificar se o alerta foi enviado com dados agregados
      expect(alertService.sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          metric: 'interaction_latency',
          count: 5,
          averageValue: 2000
        })
      );
    });

    it('should escalate alerts based on frequency', async () => {
      await rumService.init();

      // Simular erros frequentes
      for (let i = 0; i < 20; i++) {
        window.dispatchEvent(
          new ErrorEvent('error', { error: new Error('Frequent error') })
        );
      }

      // Verificar se o alerta foi escalado para crítico
      const alerts = (alertService.sendAlert as jest.Mock).mock.calls;
      const criticalAlert = alerts.find(
        call => call[0].type === 'critical' && call[0].metric === 'error_frequency'
      );

      expect(criticalAlert).toBeTruthy();
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should properly cleanup all observers and flush metrics', async () => {
      await rumService.init();

      // Registrar algumas métricas
      metricsService.recordMetric('test', 'cleanup', { value: 1 });

      // Executar cleanup
      await Promise.all([
        rumService.cleanup(),
        metricsService.cleanup()
      ]);

      // Verificar se as métricas foram enviadas
      expect(newrelic.recordCustomEvent).toHaveBeenCalled();

      // Verificar se os observers foram desconectados
      const performanceObservers = (rumService as any).performanceObservers;
      Object.values(performanceObservers).forEach((observer: any) => {
        expect(observer.disconnect).toHaveBeenCalled();
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      await rumService.init();

      // Forçar erro durante o flush
      (newrelic.recordCustomEvent as jest.Mock).mockRejectedValueOnce(
        new Error('Flush error')
      );

      // Registrar métrica
      metricsService.recordMetric('test', 'error', { value: 1 });

      // Executar cleanup
      await metricsService.cleanup();

      // Verificar se o erro foi registrado
      expect(alertService.sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          metric: 'metrics_flush',
          message: 'Failed to flush metrics'
        })
      );
    });
  });
}); 
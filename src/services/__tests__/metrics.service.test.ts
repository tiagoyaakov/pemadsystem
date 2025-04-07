import { metricsService } from '../metrics.service';
import { alertService } from '../alert.service';
import { METRICS_CONFIG } from '../../../config/metrics.config';
import newrelic from 'newrelic';

jest.mock('newrelic', () => ({
  recordCustomEvent: jest.fn()
}));

jest.mock('../alert.service', () => ({
  alertService: {
    sendAlert: jest.fn()
  }
}));

jest.mock('../../../config/metrics.config', () => ({
  METRICS_CONFIG: {
    collection: {
      interval: 1000,
      bufferSize: 100,
      sampling: {
        enabled: true,
        rate: 0.1
      }
    },
    alerts: {
      thresholds: {
        latency: {
          warning: 1000,
          critical: 3000
        },
        memory: {
          warning: 0.8,
          critical: 0.9
        },
        cpu: {
          warning: 0.7,
          critical: 0.9
        }
      }
    }
  }
}));

describe('MetricsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    metricsService.cleanup();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should be a singleton', () => {
      const instance1 = metricsService;
      const instance2 = metricsService;
      expect(instance1).toBe(instance2);
    });

    it('should setup collection interval', () => {
      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        METRICS_CONFIG.collection.interval
      );
    });
  });

  describe('metric recording', () => {
    it('should buffer metrics and flush when full', async () => {
      // Preencher o buffer
      for (let i = 0; i < METRICS_CONFIG.collection.bufferSize; i++) {
        metricsService.recordMetric('test', 'metric', { value: i });
      }

      // Verificar se o flush foi chamado
      expect(newrelic.recordCustomEvent).toHaveBeenCalled();
    });

    it('should include timestamp in recorded metrics', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      metricsService.recordMetric('test', 'metric', { value: 1 });
      jest.runAllTimers();

      expect(newrelic.recordCustomEvent).toHaveBeenCalledWith(
        'test_metric',
        expect.objectContaining({
          timestamp: now
        })
      );
    });
  });

  describe('user metrics', () => {
    it('should record user interactions', () => {
      metricsService.recordUserInteraction('button', 'click', 500);

      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'user_interaction',
          attributes: expect.objectContaining({
            componentName: 'button',
            eventType: 'click',
            duration: 500
          })
        })
      );
    });

    it('should alert on slow interactions', () => {
      metricsService.recordUserInteraction('button', 'click', 2000);

      expect(alertService.sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          metric: 'interaction_latency',
          value: 2000
        })
      );
    });
  });

  describe('error tracking', () => {
    it('should track form errors', () => {
      metricsService.recordFormError('login', 'email', 'invalid', 'test@test');

      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'user_form_error',
          attributes: expect.objectContaining({
            formName: 'login',
            fieldName: 'email',
            errorType: 'invalid',
            value: 'test@test'
          })
        })
      );
    });

    it('should alert on repeated errors', () => {
      // Simular múltiplos erros
      for (let i = 0; i < 11; i++) {
        metricsService.recordFormError('login', 'email', 'invalid', 'test@test');
      }

      expect(alertService.sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          metric: 'form_errors',
          value: 11
        })
      );
    });
  });

  describe('performance metrics', () => {
    it('should track navigation timing', () => {
      metricsService.recordNavigation('/home', '/profile', 1500);

      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'user_navigation',
          attributes: expect.objectContaining({
            fromPath: '/home',
            toPath: '/profile',
            duration: 1500
          })
        })
      );
    });

    it('should track component load time', () => {
      metricsService.recordComponentLoad('UserProfile', 800, ['api', 'store']);

      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'resource_component_load',
          attributes: expect.objectContaining({
            componentName: 'UserProfile',
            loadTime: 800,
            dependencies: 'api,store'
          })
        })
      );
    });
  });

  describe('infrastructure metrics', () => {
    it('should track memory usage', () => {
      metricsService.recordMemoryUsage(1000, 800, 600);

      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'infrastructure_memory_usage',
          attributes: expect.objectContaining({
            heap: 1000,
            allocated: 800,
            used: 600,
            usagePercentage: 75
          })
        })
      );
    });

    it('should track CPU usage', () => {
      metricsService.recordCPUUsage(30, 20, 50);

      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'infrastructure_cpu_usage',
          attributes: expect.objectContaining({
            user: 30,
            system: 20,
            idle: 50,
            usage: 50
          })
        })
      );
    });

    it('should alert on high resource usage', () => {
      metricsService.recordMemoryUsage(1000, 1000, 900); // 90% usage

      expect(alertService.sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'critical',
          metric: 'memory_usage'
        })
      );
    });
  });

  describe('business metrics', () => {
    it('should track conversion rates', () => {
      metricsService.recordConversion('signup', 'step1', true);

      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'business_conversion',
          attributes: expect.objectContaining({
            funnel: 'signup',
            step: 'step1',
            success: true
          })
        })
      );
    });

    it('should track engagement', () => {
      metricsService.recordEngagement('feature1', 60000, 10);

      expect(metricsService['metricsBuffer']).toContainEqual(
        expect.objectContaining({
          name: 'business_engagement',
          attributes: expect.objectContaining({
            feature: 'feature1',
            duration: 60000,
            interactions: 10,
            interactionsPerMinute: 10
          })
        })
      );
    });

    it('should alert on low engagement', () => {
      metricsService.recordEngagement('feature1', 60000, 0);

      expect(alertService.sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          metric: 'zero_engagement'
        })
      );
    });
  });

  describe('cleanup', () => {
    it('should flush metrics and clear interval on cleanup', async () => {
      metricsService.recordMetric('test', 'cleanup', { value: 1 });
      await metricsService.cleanup();

      expect(newrelic.recordCustomEvent).toHaveBeenCalled();
      expect(clearInterval).toHaveBeenCalled();
    });
  });
}); 
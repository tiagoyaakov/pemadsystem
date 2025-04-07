import { rumService } from '../rum.service';
import { metricsService } from '../metrics.service';

jest.mock('../metrics.service', () => ({
  metricsService: {
    recordMetric: jest.fn()
  }
}));

describe('RUMService', () => {
  let originalWindow: any;
  let mockPerformanceObserver: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    originalWindow = { ...window };

    // Mock PerformanceObserver
    mockPerformanceObserver = jest.fn();
    mockPerformanceObserver.prototype.observe = jest.fn();
    mockPerformanceObserver.prototype.disconnect = jest.fn();
    (window as any).PerformanceObserver = mockPerformanceObserver;

    // Mock navigator
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/90.0.4430.212',
      configurable: true
    });

    // Mock connection
    Object.defineProperty(window.navigator, 'connection', {
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50
      },
      configurable: true
    });

    // Mock performance
    window.performance.getEntriesByType = jest.fn().mockReturnValue([{
      type: 'navigate',
      redirectCount: 0,
      responseStart: 100,
      requestStart: 50,
      domInteractive: 200,
      domComplete: 300,
      loadEventEnd: 400
    }]);
  });

  afterEach(() => {
    window = originalWindow;
    rumService.cleanup();
  });

  describe('init', () => {
    it('should initialize only once', () => {
      rumService.init();
      rumService.init();
      expect(metricsService.recordMetric).toHaveBeenCalledTimes(1);
    });

    it('should collect user metrics on initialization', () => {
      rumService.init();
      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'user',
        'device_info',
        expect.objectContaining({
          deviceType: expect.any(String),
          browser: expect.any(String),
          os: expect.any(String),
          connection: expect.any(Object),
          viewport: expect.any(Object)
        })
      );
    });
  });

  describe('performance monitoring', () => {
    beforeEach(() => {
      rumService.init();
    });

    it('should observe FCP', () => {
      const callback = mockPerformanceObserver.mock.calls[0][0];
      callback({
        getEntries: () => [{
          name: 'first-contentful-paint',
          startTime: 1000
        }]
      });

      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'performance',
        'fcp',
        { value: 1000 }
      );
    });

    it('should observe LCP', () => {
      const callback = mockPerformanceObserver.mock.calls[1][0];
      callback({
        getEntries: () => [{
          startTime: 2000
        }]
      });

      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'performance',
        'lcp',
        { value: 2000 }
      );
    });

    it('should observe CLS', () => {
      const callback = mockPerformanceObserver.mock.calls[3][0];
      callback({
        getEntries: () => [{
          value: 0.1,
          hadRecentInput: false,
          startTime: performance.now()
        }]
      });

      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'performance',
        'cls',
        expect.objectContaining({ value: expect.any(Number) })
      );
    });
  });

  describe('error monitoring', () => {
    beforeEach(() => {
      rumService.init();
    });

    it('should record JavaScript errors', () => {
      const error = new Error('Test error');
      window.dispatchEvent(new ErrorEvent('error', {
        error,
        message: error.message,
        filename: 'test.js',
        lineno: 1,
        colno: 1
      }));

      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'error',
        'javascript',
        expect.objectContaining({
          message: 'Test error',
          filename: 'test.js',
          lineno: 1,
          colno: 1,
          stack: expect.any(String),
          type: 'Error'
        })
      );
    });

    it('should record unhandled promise rejections', () => {
      const error = new Error('Promise error');
      window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
        reason: error,
        promise: Promise.reject(error)
      }));

      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'error',
        'promise_rejection',
        expect.objectContaining({
          message: 'Promise error',
          stack: expect.any(String),
          type: 'Error'
        })
      );
    });
  });

  describe('user interaction monitoring', () => {
    beforeEach(() => {
      rumService.init();
    });

    it('should record user interactions', () => {
      const button = document.createElement('button');
      button.id = 'test-button';
      document.body.appendChild(button);

      button.click();

      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'interaction',
        'click',
        expect.objectContaining({
          targetType: 'button',
          targetId: 'test-button',
          path: expect.any(String),
          timeSinceLastInteraction: expect.any(Number)
        })
      );

      document.body.removeChild(button);
    });

    it('should debounce viewport changes', () => {
      jest.useFakeTimers();

      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));

      jest.runAllTimers();

      expect(metricsService.recordMetric).toHaveBeenCalledTimes(2); // Uma vez para device_info e uma para viewport_change
      expect(metricsService.recordMetric).toHaveBeenLastCalledWith(
        'user',
        'viewport_change',
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number)
        })
      );

      jest.useRealTimers();
    });
  });

  describe('cleanup', () => {
    it('should disconnect all observers and reset state', () => {
      rumService.init();
      rumService.cleanup();

      expect(mockPerformanceObserver.prototype.disconnect).toHaveBeenCalled();
      
      // Verificar se a reinicialização funciona
      rumService.init();
      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'user',
        'device_info',
        expect.any(Object)
      );
    });
  });
}); 
import { metricsService } from '../metrics.service';
import { registerServiceWorker, unregisterServiceWorker, skipWaiting, updateResourcePriority } from '../service-worker-registration';

jest.mock('../metrics.service', () => ({
  metricsService: {
    recordMetric: jest.fn()
  }
}));

describe('Service Worker', () => {
  let mockRegistration: any;
  let mockController: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock do Service Worker
    mockRegistration = {
      scope: '/',
      installing: {
        state: 'installed',
        addEventListener: jest.fn()
      },
      addEventListener: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      unregister: jest.fn().mockResolvedValue(true)
    };

    mockController = {
      postMessage: jest.fn()
    };

    // Mock do navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: jest.fn().mockResolvedValue(mockRegistration),
        ready: Promise.resolve(mockRegistration),
        controller: mockController
      },
      configurable: true
    });

    // Mock do process.env
    process.env.APP_VERSION = '1.0.0';
  });

  describe('registerServiceWorker', () => {
    it('should register service worker successfully', async () => {
      await registerServiceWorker();

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
        '/service-worker.js',
        { scope: '/' }
      );

      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'service_worker',
        'registration',
        expect.objectContaining({
          success: true,
          scope: '/'
        })
      );
    });

    it('should handle registration error', async () => {
      const error = new Error('Registration failed');
      (navigator.serviceWorker.register as jest.Mock).mockRejectedValueOnce(error);

      await registerServiceWorker();

      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'error',
        'sw_registration',
        expect.objectContaining({
          message: 'Registration failed'
        })
      );
    });

    it('should monitor worker updates', async () => {
      await registerServiceWorker();

      // Simular evento updatefound
      const updateFoundCallback = mockRegistration.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'updatefound'
      )[1];
      updateFoundCallback();

      // Simular statechange
      const stateChangeCallback = mockRegistration.installing.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'statechange'
      )[1];
      stateChangeCallback();

      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'service_worker',
        'state_change',
        expect.objectContaining({
          state: 'installed'
        })
      );

      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'service_worker',
        'update_available',
        expect.objectContaining({
          version: '1.0.0'
        })
      );
    });

    it('should check for updates periodically', async () => {
      jest.useFakeTimers();

      await registerServiceWorker();

      // Avançar 1 hora
      jest.advanceTimersByTime(1000 * 60 * 60);

      expect(mockRegistration.update).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should handle update check errors', async () => {
      jest.useFakeTimers();

      const error = new Error('Update failed');
      mockRegistration.update.mockRejectedValueOnce(error);

      await registerServiceWorker();

      // Avançar 1 hora
      jest.advanceTimersByTime(1000 * 60 * 60);

      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'error',
        'sw_update_check',
        expect.objectContaining({
          message: 'Update failed'
        })
      );

      jest.useRealTimers();
    });
  });

  describe('unregisterServiceWorker', () => {
    it('should unregister service worker successfully', async () => {
      const success = await unregisterServiceWorker();

      expect(success).toBe(true);
      expect(mockRegistration.unregister).toHaveBeenCalled();
      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'service_worker',
        'unregistration',
        expect.objectContaining({
          success: true
        })
      );
    });

    it('should handle unregister error', async () => {
      const error = new Error('Unregister failed');
      mockRegistration.unregister.mockRejectedValueOnce(error);

      await expect(unregisterServiceWorker()).rejects.toThrow('Unregister failed');

      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'error',
        'sw_unregistration',
        expect.objectContaining({
          message: 'Unregister failed'
        })
      );
    });

    it('should resolve false when service worker is not supported', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true
      });

      const success = await unregisterServiceWorker();
      expect(success).toBe(false);
    });
  });

  describe('skipWaiting', () => {
    it('should send skip waiting message to controller', () => {
      skipWaiting();

      expect(mockController.postMessage).toHaveBeenCalledWith({
        type: 'SKIP_WAITING'
      });
    });

    it('should not throw when controller is not available', () => {
      Object.defineProperty(navigator.serviceWorker, 'controller', {
        value: null,
        configurable: true
      });

      expect(() => skipWaiting()).not.toThrow();
    });
  });

  describe('updateResourcePriority', () => {
    it('should send update priority message to controller', () => {
      const url = '/test.js';
      const priority = 0.8;

      updateResourcePriority(url, priority);

      expect(mockController.postMessage).toHaveBeenCalledWith({
        type: 'UPDATE_RESOURCE_PRIORITY',
        url,
        priority
      });
    });

    it('should not throw when controller is not available', () => {
      Object.defineProperty(navigator.serviceWorker, 'controller', {
        value: null,
        configurable: true
      });

      expect(() => updateResourcePriority('/test.js', 0.8)).not.toThrow();
    });
  });
}); 
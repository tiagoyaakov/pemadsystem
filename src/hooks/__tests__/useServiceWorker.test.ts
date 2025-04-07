import { renderHook, act } from '@testing-library/react';
import { useServiceWorker } from '../useServiceWorker';
import { metricsService } from '../../services/metrics.service';
import * as registration from '../../services/service-worker-registration';

jest.mock('../../services/metrics.service', () => ({
  metricsService: {
    recordMetric: jest.fn()
  }
}));

jest.mock('../../services/service-worker-registration', () => ({
  registerServiceWorker: jest.fn(),
  unregisterServiceWorker: jest.fn(),
  skipWaiting: jest.fn(),
  updateResourcePriority: jest.fn()
}));

describe('useServiceWorker', () => {
  let mockRegistration: any;
  let mockWaitingWorker: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWaitingWorker = {
      state: 'installed',
      addEventListener: jest.fn()
    };

    mockRegistration = {
      waiting: mockWaitingWorker,
      update: jest.fn()
    };

    // Mock do process.env
    process.env.APP_VERSION = '1.0.0';
  });

  it('should register service worker on mount', async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useServiceWorker({ onSuccess }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(registration.registerServiceWorker).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should handle registration error', async () => {
    const error = new Error('Registration failed');
    (registration.registerServiceWorker as jest.Mock).mockRejectedValueOnce(error);

    const onError = jest.fn();
    const { result } = renderHook(() => useServiceWorker({ onError }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.error).toBe(error);
  });

  it('should handle update available event', async () => {
    const onUpdate = jest.fn();
    const { result } = renderHook(() => useServiceWorker({ onUpdate }));

    await act(async () => {
      const event = new CustomEvent('swUpdateAvailable');
      window.dispatchEvent(event);
    });

    expect(result.current.updateAvailable).toBe(true);
    expect(onUpdate).toHaveBeenCalled();
    expect(metricsService.recordMetric).toHaveBeenCalledWith(
      'service_worker',
      'update_available',
      expect.objectContaining({
        version: '1.0.0'
      })
    );
  });

  it('should update service worker', async () => {
    const { result } = renderHook(() => useServiceWorker());

    // Simular registro bem-sucedido
    (result.current as any).registration = mockRegistration;

    await act(async () => {
      await result.current.update();
    });

    expect(mockRegistration.update).toHaveBeenCalled();
    expect(metricsService.recordMetric).toHaveBeenCalledWith(
      'service_worker',
      'update_check',
      expect.objectContaining({
        success: true
      })
    );
  });

  it('should handle update error', async () => {
    const error = new Error('Update failed');
    mockRegistration.update.mockRejectedValueOnce(error);

    const onError = jest.fn();
    const { result } = renderHook(() => useServiceWorker({ onError }));

    // Simular registro bem-sucedido
    (result.current as any).registration = mockRegistration;

    await act(async () => {
      await result.current.update();
    });

    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.error).toBe(error);
    expect(metricsService.recordMetric).toHaveBeenCalledWith(
      'error',
      'sw_update_check',
      expect.objectContaining({
        message: 'Update failed'
      })
    );
  });

  it('should unregister service worker', async () => {
    const { result } = renderHook(() => useServiceWorker());

    await act(async () => {
      await result.current.unregister();
    });

    expect(registration.unregisterServiceWorker).toHaveBeenCalled();
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
    (registration.unregisterServiceWorker as jest.Mock).mockRejectedValueOnce(error);

    const onError = jest.fn();
    const { result } = renderHook(() => useServiceWorker({ onError }));

    await act(async () => {
      await result.current.unregister();
    });

    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.error).toBe(error);
    expect(metricsService.recordMetric).toHaveBeenCalledWith(
      'error',
      'sw_unregistration',
      expect.objectContaining({
        message: 'Unregister failed'
      })
    );
  });

  it('should skip waiting and reload on activation', async () => {
    const { result } = renderHook(() => useServiceWorker());

    // Simular worker em espera
    (result.current as any).waitingWorker = mockWaitingWorker;

    await act(async () => {
      result.current.skipWaiting();
    });

    expect(registration.skipWaiting).toHaveBeenCalled();
    expect(mockWaitingWorker.addEventListener).toHaveBeenCalledWith(
      'statechange',
      expect.any(Function)
    );

    // Simular ativação
    const stateChangeCallback = mockWaitingWorker.addEventListener.mock.calls[0][1];
    const mockEvent = { target: { state: 'activated' } };

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, reload: jest.fn() };

    stateChangeCallback(mockEvent);

    expect(window.location.reload).toHaveBeenCalled();

    // Restaurar window.location
    window.location = originalLocation;
  });

  it('should update resource priority', async () => {
    const { result } = renderHook(() => useServiceWorker());

    const url = '/test.js';
    const priority = 0.8;

    await act(async () => {
      result.current.updateResourcePriority(url, priority);
    });

    expect(registration.updateResourcePriority).toHaveBeenCalledWith(url, priority);
    expect(metricsService.recordMetric).toHaveBeenCalledWith(
      'service_worker',
      'update_priority',
      expect.objectContaining({
        url,
        priority
      })
    );
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => useServiceWorker());

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'swUpdateAvailable',
      expect.any(Function)
    );
  });
}); 
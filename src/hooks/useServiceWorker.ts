import { useState, useEffect, useCallback } from 'react';
import { metricsService } from '../services/metrics.service';
import {
  registerServiceWorker,
  unregisterServiceWorker,
  skipWaiting,
  updateResourcePriority
} from '../services/service-worker-registration';

interface UseServiceWorkerOptions {
  onUpdate?: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseServiceWorkerReturn {
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  waitingWorker: ServiceWorker | null;
  error: Error | null;
  update: () => Promise<void>;
  unregister: () => Promise<void>;
  skipWaiting: () => void;
  updateResourcePriority: (url: string, priority: number) => void;
}

export function useServiceWorker({
  onUpdate,
  onSuccess,
  onError
}: UseServiceWorkerOptions = {}): UseServiceWorkerReturn {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Registrar Service Worker
  useEffect(() => {
    async function register() {
      try {
        await registerServiceWorker();
        onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
      }
    }

    register();
  }, [onSuccess, onError]);

  // Monitorar atualizações
  useEffect(() => {
    function handleUpdateAvailable(event: CustomEvent) {
      setUpdateAvailable(true);
      if (registration?.waiting) {
        setWaitingWorker(registration.waiting);
      }
      onUpdate?.();

      metricsService.recordMetric('service_worker', 'update_available', {
        version: process.env.APP_VERSION
      });
    }

    window.addEventListener('swUpdateAvailable', handleUpdateAvailable as EventListener);

    return () => {
      window.removeEventListener('swUpdateAvailable', handleUpdateAvailable as EventListener);
    };
  }, [registration, onUpdate]);

  // Atualizar Service Worker
  const update = useCallback(async () => {
    if (!registration) {
      return;
    }

    try {
      await registration.update();
      metricsService.recordMetric('service_worker', 'update_check', {
        success: true
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Update check failed');
      setError(error);
      onError?.(error);

      metricsService.recordMetric('error', 'sw_update_check', {
        message: error.message
      });
    }
  }, [registration, onError]);

  // Desregistrar Service Worker
  const unregister = useCallback(async () => {
    try {
      await unregisterServiceWorker();
      setRegistration(null);
      setUpdateAvailable(false);
      setWaitingWorker(null);

      metricsService.recordMetric('service_worker', 'unregistration', {
        success: true
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unregister failed');
      setError(error);
      onError?.(error);

      metricsService.recordMetric('error', 'sw_unregistration', {
        message: error.message
      });
    }
  }, [onError]);

  // Pular waiting e ativar novo worker
  const skipWaitingCallback = useCallback(() => {
    if (waitingWorker) {
      skipWaiting();
      waitingWorker.addEventListener('statechange', (event) => {
        if ((event.target as ServiceWorker).state === 'activated') {
          window.location.reload();
        }
      });

      metricsService.recordMetric('service_worker', 'skip_waiting', {
        success: true
      });
    }
  }, [waitingWorker]);

  // Atualizar prioridade de recurso
  const updateResourcePriorityCallback = useCallback((url: string, priority: number) => {
    updateResourcePriority(url, priority);

    metricsService.recordMetric('service_worker', 'update_priority', {
      url,
      priority
    });
  }, []);

  return {
    registration,
    updateAvailable,
    waitingWorker,
    error,
    update,
    unregister,
    skipWaiting: skipWaitingCallback,
    updateResourcePriority: updateResourcePriorityCallback
  };
} 
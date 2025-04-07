import { metricsService } from './metrics.service';

export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      // Registrar sucesso
      metricsService.recordMetric('service_worker', 'registration', {
        success: true,
        scope: registration.scope
      });

      // Monitorar atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            metricsService.recordMetric('service_worker', 'state_change', {
              state: newWorker.state
            });

            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              metricsService.recordMetric('service_worker', 'update_available', {
                version: process.env.APP_VERSION
              });

              // Notificar o usuário sobre a atualização
              dispatchEvent(new CustomEvent('swUpdateAvailable'));
            }
          });
        }
      });

      // Verificar atualizações periodicamente
      setInterval(() => {
        registration.update().catch(error => {
          metricsService.recordMetric('error', 'sw_update_check', {
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        });
      }, 1000 * 60 * 60); // Verificar a cada hora

    } catch (error) {
      metricsService.recordMetric('error', 'sw_registration', {
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export function unregisterServiceWorker(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(registration => {
          registration.unregister()
            .then(success => {
              metricsService.recordMetric('service_worker', 'unregistration', {
                success
              });
              resolve(success);
            })
            .catch(error => {
              metricsService.recordMetric('error', 'sw_unregistration', {
                message: error instanceof Error ? error.message : 'Unknown error'
              });
              reject(error);
            });
        })
        .catch(reject);
    } else {
      resolve(false);
    }
  });
}

// Utilitários para comunicação com o Service Worker
export function skipWaiting(): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
}

export function updateResourcePriority(url: string, priority: number): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_RESOURCE_PRIORITY',
      url,
      priority
    });
  }
}

// Adicionar tipos para eventos do Service Worker
declare global {
  interface WindowEventMap {
    'swUpdateAvailable': CustomEvent;
  }
} 
import React, { useCallback } from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { metricsService } from '../services/metrics.service';

interface ServiceWorkerUpdaterProps {
  onUpdateComplete?: () => void;
}

export const ServiceWorkerUpdater: React.FC<ServiceWorkerUpdaterProps> = ({
  onUpdateComplete
}) => {
  const {
    updateAvailable,
    waitingWorker,
    error,
    skipWaiting
  } = useServiceWorker({
    onUpdate: () => {
      metricsService.recordMetric('service_worker', 'update_notification', {
        shown: true
      });
    },
    onError: (error) => {
      metricsService.recordMetric('error', 'sw_update', {
        message: error.message
      });
    }
  });

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      metricsService.recordMetric('service_worker', 'update_accepted', {
        version: process.env.APP_VERSION
      });

      skipWaiting();
      onUpdateComplete?.();
    }
  }, [waitingWorker, skipWaiting, onUpdateComplete]);

  const handleDismiss = useCallback(() => {
    metricsService.recordMetric('service_worker', 'update_dismissed', {
      version: process.env.APP_VERSION
    });
  }, []);

  if (error) {
    return null;
  }

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-blue-500 text-white flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span>Uma nova versão está disponível!</span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded"
        >
          Depois
        </button>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 text-sm bg-white text-blue-500 hover:bg-blue-50 rounded"
        >
          Atualizar agora
        </button>
      </div>
    </div>
  );
}; 
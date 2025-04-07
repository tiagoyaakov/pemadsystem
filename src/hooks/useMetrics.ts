import { useEffect, useRef } from 'react';
import { metricsService } from '../services/metrics.service';

interface UseMetricsOptions {
  componentName: string;
  dependencies?: string[];
  trackInteractions?: boolean;
  trackEngagement?: boolean;
}

export function useMetrics({
  componentName,
  dependencies = [],
  trackInteractions = false,
  trackEngagement = false
}: UseMetricsOptions) {
  const mountTime = useRef<number>(0);
  const interactionCount = useRef<number>(0);

  useEffect(() => {
    // Registrar tempo de montagem
    mountTime.current = performance.now();

    // Registrar carregamento do componente
    const loadTime = performance.now() - mountTime.current;
    metricsService.recordComponentLoad(componentName, loadTime, dependencies);

    return () => {
      // Registrar métricas de engajamento ao desmontar
      if (trackEngagement) {
        const duration = performance.now() - mountTime.current;
        metricsService.recordEngagement(
          componentName,
          duration,
          interactionCount.current
        );
      }
    };
  }, [componentName, dependencies, trackEngagement]);

  const trackInteraction = (eventType: string) => {
    if (!trackInteractions) return;

    const startTime = performance.now();
    interactionCount.current++;

    return {
      end: () => {
        const duration = performance.now() - startTime;
        metricsService.recordUserInteraction(componentName, eventType, duration);
      }
    };
  };

  const trackFormError = (fieldName: string, errorType: string, value: string) => {
    metricsService.recordFormError(componentName, fieldName, errorType, value);
  };

  const trackNavigation = (toPath: string) => {
    const startTime = performance.now();

    return {
      end: () => {
        const duration = performance.now() - startTime;
        metricsService.recordNavigation(window.location.pathname, toPath, duration);
      }
    };
  };

  return {
    trackInteraction,
    trackFormError,
    trackNavigation
  };
} 
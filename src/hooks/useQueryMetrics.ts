import { useEffect, useRef } from 'react';
import { metricsService } from '../services/metrics.service';

interface QueryMetricsOptions {
  queryName: string;
  queryType: 'select' | 'insert' | 'update' | 'delete';
  tableName: string;
}

interface QueryMetrics {
  startQuery: () => void;
  endQuery: (rowCount?: number) => void;
  recordError: (error: Error) => void;
}

export function useQueryMetrics({
  queryName,
  queryType,
  tableName
}: QueryMetricsOptions): QueryMetrics {
  const startTimeRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      // Se a query ainda estiver ativa quando o componente for desmontado,
      // registrar como erro de timeout
      if (isActiveRef.current) {
        const duration = performance.now() - startTimeRef.current;
        metricsService.recordApiCall(
          `${queryType}/${tableName}/${queryName}`,
          queryType,
          duration,
          408 // Request Timeout
        );
      }
    };
  }, [queryName, queryType, tableName]);

  const startQuery = () => {
    startTimeRef.current = performance.now();
    isActiveRef.current = true;
  };

  const endQuery = (rowCount?: number) => {
    if (!isActiveRef.current) return;

    const duration = performance.now() - startTimeRef.current;
    isActiveRef.current = false;

    metricsService.recordApiCall(
      `${queryType}/${tableName}/${queryName}`,
      queryType,
      duration,
      200
    );

    // Registrar métricas adicionais se houver contagem de linhas
    if (rowCount !== undefined) {
      const metrics = {
        queryName,
        queryType,
        tableName,
        duration,
        rowCount,
        rowsPerSecond: (rowCount / duration) * 1000
      };

      console.debug('Query metrics:', metrics);

      // Se a query for muito lenta para a quantidade de dados
      if (rowCount > 0 && duration > 1000) {
        const threshold = 1000; // 1 linha por milissegundo
        if (metrics.rowsPerSecond < threshold) {
          console.warn(
            `Slow query detected: ${queryName} (${metrics.rowsPerSecond.toFixed(2)} rows/sec)`
          );
        }
      }
    }
  };

  const recordError = (error: Error) => {
    if (!isActiveRef.current) return;

    const duration = performance.now() - startTimeRef.current;
    isActiveRef.current = false;

    metricsService.recordApiCall(
      `${queryType}/${tableName}/${queryName}`,
      queryType,
      duration,
      500
    );

    console.error('Query error:', {
      queryName,
      queryType,
      tableName,
      error: error.message,
      duration
    });
  };

  return {
    startQuery,
    endQuery,
    recordError
  };
} 
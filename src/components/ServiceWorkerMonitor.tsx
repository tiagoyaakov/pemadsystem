import React, { useState, useEffect, useCallback } from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { metricsService } from '../services/metrics.service';

interface CacheStats {
  totalItems: number;
  totalSize: number;
  lastUpdated: Date | null;
}

interface ResourceStats {
  url: string;
  size: number;
  type: string;
  lastAccessed: Date;
  hits: number;
}

interface ServiceWorkerMonitorProps {
  showDetails?: boolean;
}

export const ServiceWorkerMonitor: React.FC<ServiceWorkerMonitorProps> = ({
  showDetails = false
}) => {
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalItems: 0,
    totalSize: 0,
    lastUpdated: null
  });
  const [topResources, setTopResources] = useState<ResourceStats[]>([]);
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const {
    registration,
    updateAvailable,
    error,
    update,
    skipWaiting
  } = useServiceWorker({
    onError: (error) => {
      metricsService.recordMetric('error', 'sw_monitor', {
        message: error.message
      });
    }
  });

  // Função para obter estatísticas do cache
  const fetchCacheStats = useCallback(async () => {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cache = await caches.open('app-cache-v1');
      const keys = await cache.keys();
      let totalSize = 0;

      const resourcesPromises = keys.map(async (request) => {
        const response = await cache.match(request);
        if (!response) return null;

        const clone = response.clone();
        const blob = await clone.blob();
        const size = blob.size;
        const type = response.headers.get('content-type') || 'unknown';
        
        totalSize += size;
        
        return {
          url: request.url,
          size,
          type,
          lastAccessed: new Date(),
          hits: 0 // Em uma implementação real, isso seria obtido do SW
        };
      });

      const resources = (await Promise.all(resourcesPromises)).filter(Boolean) as ResourceStats[];
      
      // Ordenar por tamanho (os maiores primeiro)
      const sortedResources = resources.sort((a, b) => b.size - a.size).slice(0, 5);
      
      setCacheStats({
        totalItems: keys.length,
        totalSize,
        lastUpdated: new Date()
      });
      
      setTopResources(sortedResources);
      
      metricsService.recordMetric('service_worker', 'monitor_update', {
        cacheSize: totalSize,
        itemCount: keys.length
      });
    } catch (error) {
      metricsService.recordMetric('error', 'cache_stats', {
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, []);

  // Buscar estatísticas a cada 30 segundos
  useEffect(() => {
    fetchCacheStats();
    
    const interval = setInterval(() => {
      fetchCacheStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchCacheStats]);

  const handleRefresh = useCallback(() => {
    fetchCacheStats();
    
    metricsService.recordMetric('user', 'sw_monitor_refresh', {
      manual: true
    });
  }, [fetchCacheStats]);

  const handleCheckUpdate = useCallback(() => {
    update();
    
    metricsService.recordMetric('user', 'sw_check_update', {
      source: 'monitor'
    });
  }, [update]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
    
    metricsService.recordMetric('user', 'sw_monitor_toggle', {
      expanded: !isExpanded
    });
  }, [isExpanded]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (): string => {
    if (error) return 'bg-red-500';
    if (updateAvailable) return 'bg-yellow-500';
    if (registration?.active) return 'bg-green-500';
    return 'bg-gray-500';
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          <h3 className="text-lg font-medium">Service Worker</h3>
          {registration?.active && (
            <span className="text-sm text-gray-500">
              v{process.env.APP_VERSION}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Atualizar estatísticas"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={handleToggleExpand}
            className="p-2 text-gray-500 hover:text-gray-700"
            title={isExpanded ? "Recolher" : "Expandir"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>
        </div>
      </div>

      {registration && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-gray-700">Status:</span>{' '}
            <span className="text-sm text-gray-500">
              {error ? 'Erro' : updateAvailable ? 'Atualização disponível' : registration.active ? 'Ativo' : 'Instalando'}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCheckUpdate}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Verificar atualização
            </button>
            {updateAvailable && (
              <button
                onClick={skipWaiting}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                Atualizar
              </button>
            )}
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-gray-500">Recursos em cache</p>
              <p className="text-xl font-semibold">{cacheStats.totalItems}</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-gray-500">Tamanho total</p>
              <p className="text-xl font-semibold">{formatBytes(cacheStats.totalSize)}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <p className="text-sm text-gray-500">Última atualização</p>
              <p className="text-xl font-semibold">
                {cacheStats.lastUpdated
                  ? new Intl.DateTimeFormat('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    }).format(cacheStats.lastUpdated)
                  : '-'}
              </p>
            </div>
          </div>

          {topResources.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Top Recursos (por tamanho)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tamanho
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topResources.map((resource, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {new URL(resource.url).pathname}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {resource.type.split('/')[1] || resource.type}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {formatBytes(resource.size)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border-t border-red-200 text-xs text-red-700">
          Erro: {error.message}
        </div>
      )}
    </div>
  );
}; 
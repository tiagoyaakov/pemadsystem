import { useEffect, useState, useCallback } from 'react';
import { FireIncident } from '@/lib/supabase';
import * as firmsService from '@/services/fires/firms.service';

interface UseFiresOptions {
  days?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseFiresReturn {
  fires: FireIncident[];
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  isOfflineData: boolean;
  refreshFires: () => Promise<void>;
  syncOfflineData: () => Promise<void>;
}

export function useFires({
  days = 1,
  autoRefresh = false,
  refreshInterval = 300000 // 5 minutos
}: UseFiresOptions = {}): UseFiresReturn {
  const [fires, setFires] = useState<FireIncident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOfflineData, setIsOfflineData] = useState<boolean>(false);

  // Função para buscar incêndios
  const fetchFires = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verifica o status online
      const isOnline = await firmsService.checkOnlineStatus();
      
      // Busca dados com fallback para offline
      const { fires: fetchedFires, isOfflineData: isOffline } = await firmsService.getFires(days);
      
      setFires(fetchedFires);
      setIsOfflineData(isOffline);
      setLastUpdated(new Date());
      
      // Se estiver online e configurado para buscar dados novos
      if (isOnline && autoRefresh) {
        try {
          // Busca dados novos em segundo plano
          const newFires = await firmsService.fetchAndUpdateFires(days);
          if (newFires && newFires.length > 0) {
            setFires(newFires);
            setIsOfflineData(false);
          }
        } catch (backgroundError) {
          console.warn('Erro ao buscar dados novos em segundo plano:', backgroundError);
          // Não atualiza o estado de erro para não interromper o fluxo principal
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Erro ao buscar dados de incêndios:', err);
    } finally {
      setLoading(false);
    }
  }, [days, autoRefresh]);

  // Função para atualizar manualmente os dados
  const refreshFires = useCallback(async () => {
    await fetchFires();
  }, [fetchFires]);

  // Função para sincronizar dados offline
  const syncOfflineData = useCallback(async () => {
    try {
      setLoading(true);
      await firmsService.syncFiresData(days);
      await fetchFires(); // Recarrega os dados após a sincronização
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Erro ao sincronizar dados offline:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFires, days]);

  // Efeito para buscar incêndios ao carregar o componente
  useEffect(() => {
    fetchFires();
  }, [fetchFires]);

  // Efeito para atualização automática
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchFires();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchFires]);

  // Adiciona listener para mudanças no estado de conexão
  useEffect(() => {
    const handleOnline = () => {
      console.log('Conexão reestabelecida, sincronizando dados...');
      syncOfflineData();
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncOfflineData]);

  return {
    fires,
    loading,
    error,
    lastUpdated,
    isOfflineData,
    refreshFires,
    syncOfflineData
  };
} 
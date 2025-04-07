import React, { useState, useEffect } from 'react';
import { FireOfflineService } from '../services/data';
import { WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface FireStatusProps {
  onSync?: () => void;
  className?: string;
}

type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

/**
 * Componente que exibe o status de sincronização dos dados de incêndio
 * e permite sincronização manual
 */
export const FireStatus: React.FC<FireStatusProps> = ({ onSync, className = '' }) => {
  const [status, setStatus] = useState<SyncStatus>('online');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [message, setMessage] = useState<string>('');
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Carregar status inicial
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Verificar se existem dados offline
        const hasData = await FireOfflineService.hasOfflineData();
        setHasOfflineData(hasData);
        
        // Carregar metadados
        const meta = await FireOfflineService.getMetadata();
        if (meta.lastSync > 0) {
          setLastSync(new Date(meta.lastSync));
        }
        
        // Detectar status da conexão
        setStatus(navigator.onLine ? 'online' : 'offline');
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        setStatus('error');
        setMessage('Erro ao verificar status de sincronização');
      }
    };

    checkStatus();
    
    // Adicionar listeners para mudanças de conectividade
    window.addEventListener('online', () => setStatus('online'));
    window.addEventListener('offline', () => setStatus('offline'));
    
    return () => {
      window.removeEventListener('online', () => setStatus('online'));
      window.removeEventListener('offline', () => setStatus('offline'));
    };
  }, []);

  // Formatar data da última sincronização
  const formatLastSync = (): string => {
    if (!lastSync) return 'Nunca sincronizado';
    
    // Se foi hoje, mostrar apenas a hora
    const today = new Date();
    const isToday = lastSync.getDate() === today.getDate() &&
                    lastSync.getMonth() === today.getMonth() &&
                    lastSync.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return `Hoje às ${lastSync.getHours().toString().padStart(2, '0')}:${lastSync.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Se foi esta semana, mostrar o dia da semana
    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diffDays = Math.floor((today.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${weekdays[lastSync.getDay()]} às ${lastSync.getHours().toString().padStart(2, '0')}:${lastSync.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Caso contrário, mostrar data completa
    return `${lastSync.getDate().toString().padStart(2, '0')}/${(lastSync.getMonth() + 1).toString().padStart(2, '0')}/${lastSync.getFullYear()} às ${lastSync.getHours().toString().padStart(2, '0')}:${lastSync.getMinutes().toString().padStart(2, '0')}`;
  };

  // Função para sincronização manual
  const handleSync = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      setStatus('syncing');
      setMessage('Sincronizando dados...');
      
      const result = await FireOfflineService.syncWithServer();
      
      if (result.success) {
        setStatus('online');
        setMessage(result.message);
        const meta = await FireOfflineService.getMetadata();
        setLastSync(new Date(meta.lastSync));
        
        // Chamar callback externo se fornecido
        if (onSync) onSync();
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    } catch (error) {
      console.error('Erro durante sincronização:', error);
      setStatus('error');
      setMessage(`Erro durante sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`flex flex-col rounded-md p-2 text-sm ${className}`}>
      <div className="flex items-center space-x-2">
        {status === 'online' && <CheckCircle className="w-4 h-4 text-green-500" />}
        {status === 'offline' && <WifiOff className="w-4 h-4 text-amber-500" />}
        {status === 'syncing' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
        {status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
        
        <span>
          {status === 'online' && 'Conectado'}
          {status === 'offline' && 'Offline'}
          {status === 'syncing' && 'Sincronizando...'}
          {status === 'error' && 'Erro de sincronização'}
        </span>
      </div>
      
      {lastSync && (
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          <span>Última sincronização: {formatLastSync()}</span>
        </div>
      )}
      
      {message && (
        <div className="mt-1 text-xs">
          {message}
        </div>
      )}
      
      {!isSyncing && (
        <button
          onClick={handleSync}
          disabled={isSyncing || (status === 'offline' && !hasOfflineData)}
          className={`
            mt-2 px-3 py-1 text-xs rounded flex items-center justify-center
            ${status === 'offline' && !hasOfflineData 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'}
          `}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Sincronizar agora
        </button>
      )}
    </div>
  );
}; 
import React from 'react';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { RefreshCw, AlertCircle, Cloud, CloudOff } from 'lucide-react';

interface SyncStatusProps {
  showDetails?: boolean;
  className?: string;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ showDetails = false, className = '' }) => {
  const { pendingCount, isLoading: _isLoading, lastSyncTime, syncProgress, syncErrors, forceSync } = useSyncStatus();
  const [isOnline, setIsOnline] = React.useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Monitorar status de conexão
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Formatar a data da última sincronização
  const formattedLastSync = React.useMemo(() => {
    if (!lastSyncTime) return 'Nunca';
    
    // Se for hoje, mostra apenas a hora
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const syncDate = new Date(lastSyncTime.getFullYear(), lastSyncTime.getMonth(), lastSyncTime.getDate());
    
    if (syncDate.getTime() === today.getTime()) {
      return `Hoje às ${lastSyncTime.getHours().toString().padStart(2, '0')}:${lastSyncTime.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Se for ontem
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (syncDate.getTime() === yesterday.getTime()) {
      return `Ontem às ${lastSyncTime.getHours().toString().padStart(2, '0')}:${lastSyncTime.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Caso contrário, mostra a data completa
    return `${lastSyncTime.getDate().toString().padStart(2, '0')}/${(lastSyncTime.getMonth() + 1).toString().padStart(2, '0')}/${lastSyncTime.getFullYear()} às ${lastSyncTime.getHours().toString().padStart(2, '0')}:${lastSyncTime.getMinutes().toString().padStart(2, '0')}`;
  }, [lastSyncTime]);

  // Manipulador de sincronização
  const handleSync = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await forceSync();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Versão simples (ícone com contador)
  if (!showDetails) {
    return (
      <button
        onClick={handleSync}
        disabled={!isOnline || isSyncing}
        className={`relative flex items-center justify-center px-2 py-1 rounded-full ${className} ${
          !isOnline ? 'bg-gray-200 text-gray-500' :
          pendingCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
        }`}
        title={`${pendingCount} itens pendentes de sincronização${lastSyncTime ? `. Última sincronização: ${formattedLastSync}` : ''}`}
      >
        {isOnline ? (
          isSyncing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Cloud className="w-4 h-4" />
          )
        ) : (
          <CloudOff className="w-4 h-4" />
        )}
        
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </button>
    );
  }

  // Versão detalhada
  return (
    <div className={`bg-white shadow rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Status de Sincronização</h3>
        <div className="flex items-center">
          {isOnline ? (
            <span className="flex items-center text-green-600 text-sm">
              <Cloud className="w-4 h-4 mr-1" /> Online
            </span>
          ) : (
            <span className="flex items-center text-gray-600 text-sm">
              <CloudOff className="w-4 h-4 mr-1" /> Offline
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Status atual */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`text-sm font-medium ${
            !isOnline ? 'text-gray-600' :
            isSyncing ? 'text-blue-600' :
            pendingCount > 0 ? 'text-amber-600' : 'text-green-600'
          }`}>
            {!isOnline 
              ? 'Offline - Sincronização indisponível' 
              : isSyncing 
                ? 'Sincronizando...' 
                : pendingCount > 0 
                  ? `${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}` 
                  : 'Tudo sincronizado'}
          </span>
        </div>
        
        {/* Última sincronização */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Última sincronização:</span>
          <span className="text-sm font-medium">{formattedLastSync}</span>
        </div>
        
        {/* Barra de progresso (se estiver sincronizando) */}
        {isSyncing && syncProgress && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.round((syncProgress.completed / syncProgress.total) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {syncProgress.completed} de {syncProgress.total} ({Math.round((syncProgress.completed / syncProgress.total) * 100)}%)
            </div>
          </div>
        )}
        
        {/* Erros de sincronização */}
        {syncErrors.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-md">
            <div className="flex items-center text-red-600 text-sm font-medium mb-1">
              <AlertCircle className="w-4 h-4 mr-1" /> Erros de sincronização
            </div>
            <ul className="text-xs text-red-700 space-y-1 ml-6 list-disc">
              {syncErrors.slice(0, 3).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
              {syncErrors.length > 3 && (
                <li>...e mais {syncErrors.length - 3} erro(s)</li>
              )}
            </ul>
          </div>
        )}
        
        {/* Botão de ação */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSync}
            disabled={!isOnline || isSyncing}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              !isOnline || isSyncing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncStatus; 
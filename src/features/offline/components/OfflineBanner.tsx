import React from 'react';
import { CloudOff, Info, RefreshCw } from 'lucide-react';
import { useOffline } from '../contexts/OfflineContext';

interface OfflineBannerProps {
  className?: string;
  showSyncButton?: boolean;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ 
  className = '', 
  showSyncButton = true 
}) => {
  const { 
    isOnline, 
    hasPendingChanges, 
    pendingChangesCount, 
    startSync, 
    syncStatus
  } = useOffline();

  // Se estiver online e não tiver mudanças pendentes, não mostrar o banner
  if (isOnline && !hasPendingChanges) return null;

  const isSyncing = syncStatus === 'syncing';

  return (
    <div className={`rounded-md p-4 mb-4 ${isOnline ? 'bg-amber-50' : 'bg-red-50'} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {isOnline ? (
            <Info className="h-5 w-5 text-amber-400" aria-hidden="true" />
          ) : (
            <CloudOff className="h-5 w-5 text-red-400" aria-hidden="true" />
          )}
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <p className={`text-sm ${isOnline ? 'text-amber-700' : 'text-red-700'}`}>
            {isOnline 
              ? `Você tem ${pendingChangesCount} alteração${pendingChangesCount !== 1 ? 'ões' : ''} pendente${pendingChangesCount !== 1 ? 's' : ''} para sincronizar.`
              : 'Você está trabalhando no modo offline. Suas alterações serão sincronizadas quando houver conexão.'}
          </p>
          {showSyncButton && isOnline && hasPendingChanges && (
            <div className="mt-3 md:mt-0 md:ml-6">
              <button
                type="button"
                onClick={() => void startSync()}
                disabled={isSyncing}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isSyncing 
                    ? 'bg-amber-300 cursor-not-allowed' 
                    : 'bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500'
                }`}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                    Sincronizar Agora
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner; 
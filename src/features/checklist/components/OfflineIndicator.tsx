import React from 'react';
import { WifiOff, Wifi, CloudSync } from 'lucide-react';

interface OfflineIndicatorProps {
  isOffline: boolean;
  syncing?: boolean;
  syncStatus?: {
    success?: boolean;
    syncedItems: number;
    errors: number;
    remainingItems: number;
  } | null;
  onSync?: () => void;
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOffline,
  syncing = false,
  syncStatus = null,
  onSync,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {isOffline ? (
        <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
          <WifiOff size={16} />
          <span>Offline</span>
        </div>
      ) : syncing ? (
        <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
          <CloudSync size={16} className="animate-spin" />
          <span>Sincronizando...</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
          <Wifi size={16} />
          <span>Online</span>
        </div>
      )}

      {!isOffline && !syncing && onSync && (
        <button
          onClick={onSync}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
          title="Sincronizar dados"
        >
          <CloudSync size={14} />
        </button>
      )}

      {syncStatus && syncStatus.syncedItems > 0 && (
        <div className="ml-2 text-xs">
          {syncStatus.success ? (
            <span className="text-green-600">
              {syncStatus.syncedItems} item(s) sincronizado(s)
            </span>
          ) : (
            <span className="text-amber-600">
              {syncStatus.syncedItems} sincronizado(s), {syncStatus.errors} erro(s)
              {syncStatus.remainingItems > 0 && `, ${syncStatus.remainingItems} pendente(s)`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator; 
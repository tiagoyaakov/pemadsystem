import { useState, useEffect } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'pemad-offline-db';
const PENDING_CHANGES_STORE = 'pendingChanges';
const SYNC_STATUS_STORE = 'syncStatus';

interface SyncStatusHook {
  pendingCount: number;
  syncErrors: string[];
  lastSyncTime: Date | null;
  forceSync: () => Promise<boolean>;
}

export const useSyncStatus = (): SyncStatusHook => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Se estiver no servidor, não executar
    if (typeof window === 'undefined') return undefined;
    
    const checkPendingChanges = async (): Promise<void> => {
      try {
        const db = await openDB(DB_NAME, 1);
        
        // Verificar contagem de alterações pendentes
        const tx = db.transaction(PENDING_CHANGES_STORE, 'readonly');
        const store = tx.objectStore(PENDING_CHANGES_STORE);
        const count = await store.count();
        setPendingCount(count);
        
        // Verificar última sincronização
        const statusTx = db.transaction(SYNC_STATUS_STORE, 'readonly');
        const statusStore = statusTx.objectStore(SYNC_STATUS_STORE);
        const lastSync = await statusStore.get('lastSync');
        
        if (lastSync?.timestamp) {
          setLastSyncTime(new Date(lastSync.timestamp));
        }
        
      } catch (error) {
        console.error('Erro ao verificar status de sincronização:', error);
      }
    };
    
    // Verificar inicialmente
    void checkPendingChanges();
    
    // Verificar a cada 1 minuto
    const interval = setInterval(() => {
      void checkPendingChanges();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const forceSync = async (): Promise<boolean> => {
    try {
      // Aqui seria implementada a sincronização efetiva
      // Esta é uma versão simplificada
      
      const db = await openDB(DB_NAME, 1);
      
      // Remover todas as alterações pendentes após sincronização bem-sucedida
      const tx = db.transaction(PENDING_CHANGES_STORE, 'readwrite');
      const store = tx.objectStore(PENDING_CHANGES_STORE);
      await store.clear();
      
      // Atualizar timestamp da última sincronização
      const statusTx = db.transaction(SYNC_STATUS_STORE, 'readwrite');
      const statusStore = statusTx.objectStore(SYNC_STATUS_STORE);
      const now = new Date();
      
      await statusStore.put({
        id: 'lastSync',
        timestamp: now.toISOString(),
      });
      
      setLastSyncTime(now);
      setPendingCount(0);
      setSyncErrors([]);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido durante sincronização';
      setSyncErrors(prev => [...prev, errorMessage]);
      console.error('Erro ao forçar sincronização:', error);
      return false;
    }
  };

  return {
    pendingCount,
    syncErrors,
    lastSyncTime,
    forceSync,
  };
}; 
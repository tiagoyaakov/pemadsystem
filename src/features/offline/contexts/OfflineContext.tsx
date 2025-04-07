import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface OfflineContextProps {
  isOnline: boolean;
  hasPendingChanges: boolean;
  pendingChangesCount: number;
  lastSyncTime: Date | null;
  syncStatus: 'idle' | 'syncing' | 'completed' | 'error';
  syncError: string | null;
  syncProgress: number;
  startSync: () => Promise<void>;
  checkPendingChanges: () => Promise<void>;
}

const defaultContext: OfflineContextProps = {
  isOnline: true,
  hasPendingChanges: false,
  pendingChangesCount: 0,
  lastSyncTime: null,
  syncStatus: 'idle',
  syncError: null,
  syncProgress: 0,
  startSync: async () => {},
  checkPendingChanges: async () => {},
};

const OfflineContext = createContext<OfflineContextProps>(defaultContext);

export const useOffline = (): OfflineContextProps => useContext(OfflineContext);

interface OfflineProviderProps {
  children: ReactNode;
}

// Nome do banco de dados IndexedDB para armazenamento offline
const DB_NAME = 'pemad-offline-db';
const DB_VERSION = 1;

// Nome das stores para diferentes tipos de dados
const PENDING_CHANGES_STORE = 'pendingChanges';
const SYNC_STATUS_STORE = 'syncStatus';

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false);
  const [pendingChangesCount, setPendingChangesCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [db, setDb] = useState<IDBPDatabase | null>(null);

  // Funções internas
  const checkPendingChangesInternal = async (database: IDBPDatabase): Promise<boolean> => {
    try {
      const tx = database.transaction(PENDING_CHANGES_STORE, 'readonly');
      const store = tx.objectStore(PENDING_CHANGES_STORE);
      
      const count = await store.count();
      const hasPending = count > 0;
      
      setHasPendingChanges(hasPending);
      setPendingChangesCount(count);
      
      return hasPending;
    } catch (error) {
      console.error('Erro ao verificar alterações pendentes:', error);
      return false;
    }
  };

  const updateLastSyncTimestamp = useCallback(async (): Promise<void> => {
    if (!db) return;
    
    const now = new Date();
    setLastSyncTime(now);
    
    try {
      const tx = db.transaction(SYNC_STATUS_STORE, 'readwrite');
      const store = tx.objectStore(SYNC_STATUS_STORE);
      await store.put({
        id: 'lastSync',
        timestamp: now.toISOString(),
      });
    } catch (error) {
      console.error('Erro ao atualizar timestamp de sincronização:', error);
    }
  }, [db]);

  // Funções públicas
  const checkPendingChanges = async (): Promise<void> => {
    if (db) {
      await checkPendingChangesInternal(db);
    }
  };

  const startSync = useCallback(async (): Promise<void> => {
    if (!isOnline || !db) {
      setSyncError('Não é possível sincronizar sem conexão com a internet');
      return;
    }

    try {
      setSyncStatus('syncing');
      setSyncProgress(0);
      setSyncError(null);

      // Obter todas as alterações pendentes
      const tx = db.transaction(PENDING_CHANGES_STORE, 'readonly');
      const store = tx.objectStore(PENDING_CHANGES_STORE);
      const pendingChanges = await store.getAll();
      
      if (pendingChanges.length === 0) {
        setSyncStatus('completed');
        setSyncProgress(100);
        
        // Atualizar o timestamp da última sincronização
        await updateLastSyncTimestamp();
        return;
      }

      // Simular processamento das alterações pendentes
      // Em um app real, aqui você enviaria as alterações para o servidor
      for (let i = 0; i < pendingChanges.length; i++) {
        const change = pendingChanges[i];
        
        // Simular atraso de rede (remover em produção)
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Processar a alteração com base no tipo
        switch (change.type) {
          case 'checklist':
            // Lógica para sincronizar checklists
            break;
          case 'material':
            // Lógica para sincronizar materiais
            break;
          default:
            console.warn(`Tipo de alteração desconhecido: ${change.type}`);
        }
        
        // Atualizar o progresso
        setSyncProgress(Math.round(((i + 1) / pendingChanges.length) * 100));
      }

      // Remover alterações sincronizadas
      const deleteTx = db.transaction(PENDING_CHANGES_STORE, 'readwrite');
      const deleteStore = deleteTx.objectStore(PENDING_CHANGES_STORE);
      await deleteStore.clear();
      
      // Atualizar estado
      setSyncStatus('completed');
      setHasPendingChanges(false);
      setPendingChangesCount(0);
      
      // Atualizar o timestamp da última sincronização
      await updateLastSyncTimestamp();
    } catch (error) {
      console.error('Erro durante a sincronização:', error);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'Erro desconhecido durante a sincronização');
    }
  }, [isOnline, db, updateLastSyncTimestamp]);

  // Inicializar o banco de dados
  useEffect(() => {
    const initDB = async (): Promise<void> => {
      if (typeof window === 'undefined') return;
      
      try {
        const database = await openDB(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // Criar store para mudanças pendentes
            if (!db.objectStoreNames.contains(PENDING_CHANGES_STORE)) {
              const pendingStore = db.createObjectStore(PENDING_CHANGES_STORE, {
                keyPath: 'id',
                autoIncrement: true,
              });
              pendingStore.createIndex('type', 'type');
              pendingStore.createIndex('createdAt', 'createdAt');
              pendingStore.createIndex('entityId', 'entityId');
            }

            // Criar store para status de sincronização
            if (!db.objectStoreNames.contains(SYNC_STATUS_STORE)) {
              db.createObjectStore(SYNC_STATUS_STORE, {
                keyPath: 'id',
              });
            }
          },
        });

        setDb(database);

        // Verificar se há um registro de última sincronização
        const syncStatusTx = database.transaction(SYNC_STATUS_STORE, 'readonly');
        const syncStatusStore = syncStatusTx.objectStore(SYNC_STATUS_STORE);
        const lastSync = await syncStatusStore.get('lastSync');
        
        if (lastSync?.timestamp) {
          setLastSyncTime(new Date(lastSync.timestamp));
        }

        await checkPendingChangesInternal(database);
      } catch (error) {
        console.error('Erro ao inicializar banco de dados offline:', error);
      }
    };

    initDB();

    // Cleanup
    return () => {
      if (db) {
        db.close();
      }
    };
  }, []);

  // Monitorar o estado de conectividade
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    
    const handleOnline = (): void => {
      setIsOnline(true);
      // Tentar sincronizar automaticamente quando voltar online
      if (hasPendingChanges) {
        void startSync();
      }
    };

    const handleOffline = (): void => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasPendingChanges, startSync]);

  // Verificar periodicamente se há alterações pendentes
  useEffect(() => {
    if (typeof window === 'undefined' || !db) return undefined;
    
    const checkChanges = (): void => {
      void checkPendingChangesInternal(db);
    };
    
    const intervalId = setInterval(checkChanges, 60000); // Verificar a cada minuto

    return () => clearInterval(intervalId);
  }, [db]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        hasPendingChanges,
        pendingChangesCount,
        lastSyncTime,
        syncStatus,
        syncError,
        syncProgress,
        startSync,
        checkPendingChanges,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}; 
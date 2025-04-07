import { openDB } from 'idb';

const DB_NAME = 'pemad-offline-db';
const DB_VERSION = 1;
const PENDING_CHANGES_STORE = 'pendingChanges';
const SYNC_STATUS_STORE = 'syncStatus';

interface PendingChange {
  id?: number;
  type: string;
  entityId: string;
  createdAt: string;
  data: unknown;
}

type SyncProgressCallback = (progress: { total: number; completed: number }) => void;
type SyncErrorCallback = (errors: string[]) => void;
type SyncSuccessCallback = () => void;

/**
 * Gerenciador de sincronização para operações offline
 */
class SyncManager {
  private isInitialized = false;
  private progressListeners: SyncProgressCallback[] = [];
  private errorListeners: SyncErrorCallback[] = [];
  private successListeners: SyncSuccessCallback[] = [];
  private isSyncing = false;

  /**
   * Inicializa o gerenciador de sincronização
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Inicializar o banco de dados
      await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Criar store para mudanças pendentes se não existir
          if (!db.objectStoreNames.contains(PENDING_CHANGES_STORE)) {
            const store = db.createObjectStore(PENDING_CHANGES_STORE, {
              keyPath: 'id',
              autoIncrement: true,
            });
            store.createIndex('type', 'type');
            store.createIndex('createdAt', 'createdAt');
            store.createIndex('entityId', 'entityId');
          }

          // Criar store para status de sincronização se não existir
          if (!db.objectStoreNames.contains(SYNC_STATUS_STORE)) {
            db.createObjectStore(SYNC_STATUS_STORE, {
              keyPath: 'id',
            });
          }
        },
      });

      this.isInitialized = true;
      console.log('SyncManager inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar SyncManager:', error);
      throw error;
    }
  }

  /**
   * Obtém a contagem de alterações pendentes
   */
  async getPendingCount(): Promise<number> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const tx = db.transaction(PENDING_CHANGES_STORE, 'readonly');
      const store = tx.objectStore(PENDING_CHANGES_STORE);
      return await store.count();
    } catch (error) {
      console.error('Erro ao obter contagem de alterações pendentes:', error);
      return 0;
    }
  }

  /**
   * Adiciona uma alteração pendente para posterior sincronização
   */
  async addPendingChange(change: Omit<PendingChange, 'id' | 'createdAt'>): Promise<number> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const tx = db.transaction(PENDING_CHANGES_STORE, 'readwrite');
      const store = tx.objectStore(PENDING_CHANGES_STORE);
      
      const id = await store.add({
        ...change,
        createdAt: new Date().toISOString(),
      });
      
      return id as number;
    } catch (error) {
      console.error('Erro ao adicionar alteração pendente:', error);
      throw error;
    }
  }

  /**
   * Tenta sincronizar todas as alterações pendentes
   */
  async trySync(): Promise<boolean> {
    if (this.isSyncing) {
      console.log('Sincronização já em andamento');
      return false;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Dispositivo offline, não é possível sincronizar');
      this.notifyError(['Dispositivo offline, não é possível sincronizar']);
      return false;
    }

    this.isSyncing = true;
    const errors: string[] = [];

    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const tx = db.transaction(PENDING_CHANGES_STORE, 'readonly');
      const store = tx.objectStore(PENDING_CHANGES_STORE);
      
      const pendingChanges = await store.getAll();
      
      if (pendingChanges.length === 0) {
        // Não há alterações pendentes
        await this.updateLastSyncTime();
        this.notifySuccess();
        this.isSyncing = false;
        return true;
      }

      // Notificar progresso inicial
      this.notifyProgress({ total: pendingChanges.length, completed: 0 });

      // Processar cada alteração pendente
      for (let i = 0; i < pendingChanges.length; i++) {
        const change = pendingChanges[i];
        
        try {
          // Aqui seria implementada a lógica real de sincronização com o servidor
          // Este é um exemplo simplificado que simula o processamento
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Remover a alteração após processamento bem-sucedido
          const deleteTx = db.transaction(PENDING_CHANGES_STORE, 'readwrite');
          const deleteStore = deleteTx.objectStore(PENDING_CHANGES_STORE);
          await deleteStore.delete(change.id as number);
        } catch (error) {
          const errorMessage = `Erro ao sincronizar alteração: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMessage);
          console.error(errorMessage);
        }
        
        // Atualizar progresso
        this.notifyProgress({ total: pendingChanges.length, completed: i + 1 });
      }

      // Atualizar timestamp da última sincronização
      await this.updateLastSyncTime();
      
      // Notificar erros se houver
      if (errors.length > 0) {
        this.notifyError(errors);
      } else {
        this.notifySuccess();
      }
      
      return errors.length === 0;
    } catch (error) {
      const errorMessage = `Erro durante sincronização: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMessage);
      console.error(errorMessage);
      this.notifyError(errors);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Atualiza o timestamp da última sincronização
   */
  private async updateLastSyncTime(): Promise<void> {
    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const tx = db.transaction(SYNC_STATUS_STORE, 'readwrite');
      const store = tx.objectStore(SYNC_STATUS_STORE);
      
      await store.put({
        id: 'lastSync',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erro ao atualizar timestamp de sincronização:', error);
    }
  }

  /**
   * Registra um callback para progresso de sincronização
   */
  onSyncProgress(callback: SyncProgressCallback): () => void {
    this.progressListeners.push(callback);
    return () => {
      this.progressListeners = this.progressListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Registra um callback para erros de sincronização
   */
  onSyncError(callback: SyncErrorCallback): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Registra um callback para sucesso de sincronização
   */
  onSyncSuccess(callback: SyncSuccessCallback): () => void {
    this.successListeners.push(callback);
    return () => {
      this.successListeners = this.successListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica todos os ouvintes sobre o progresso de sincronização
   */
  private notifyProgress(progress: { total: number; completed: number }): void {
    for (const listener of this.progressListeners) {
      listener(progress);
    }
  }

  /**
   * Notifica todos os ouvintes sobre erros de sincronização
   */
  private notifyError(errors: string[]): void {
    for (const listener of this.errorListeners) {
      listener(errors);
    }
  }

  /**
   * Notifica todos os ouvintes sobre sucesso de sincronização
   */
  private notifySuccess(): void {
    for (const listener of this.successListeners) {
      listener();
    }
  }
}

// Exporta uma única instância do gerenciador de sincronização
export const syncManager = new SyncManager(); 
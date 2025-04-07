import { FireIncident, Checklist, ChecklistItem, Material } from './supabase';

// Configuração do IndexedDB
const DB_NAME = 'pemad-material-check';
const DB_VERSION = 1;

// Definição de stores
export const STORES = {
  FIRES: 'fires',
  CHECKLISTS: 'checklists',
  CHECKLIST_ITEMS: 'checklist_items',
  MATERIALS: 'materials',
  SYNC_QUEUE: 'sync_queue'
};

// Interface para operações básicas do IndexedDB
interface IDBOperations<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  add(item: T): Promise<string>;
  update(id: string, item: T): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

// Função para inicializar o banco de dados
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject('IndexedDB não é suportado neste navegador');
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Erro ao abrir banco de dados:', event);
      reject('Erro ao abrir banco de dados');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Criar store para armazenamento de dados de incêndios
      if (!db.objectStoreNames.contains(STORES.FIRES)) {
        const firesStore = db.createObjectStore(STORES.FIRES, { keyPath: 'id' });
        firesStore.createIndex('by_date', 'acq_date', { unique: false });
        firesStore.createIndex('by_location', ['latitude', 'longitude'], { unique: false });
      }

      // Criar store para checklists
      if (!db.objectStoreNames.contains(STORES.CHECKLISTS)) {
        const checklistsStore = db.createObjectStore(STORES.CHECKLISTS, { keyPath: 'id' });
        checklistsStore.createIndex('by_date', 'data', { unique: false });
        checklistsStore.createIndex('by_user', 'user_id', { unique: false });
        checklistsStore.createIndex('by_status', 'status', { unique: false });
      }

      // Criar store para itens de checklist
      if (!db.objectStoreNames.contains(STORES.CHECKLIST_ITEMS)) {
        const checklistItemsStore = db.createObjectStore(STORES.CHECKLIST_ITEMS, { keyPath: 'id' });
        checklistItemsStore.createIndex('by_checklist', 'checklist_id', { unique: false });
        checklistItemsStore.createIndex('by_material', 'material_id', { unique: false });
      }

      // Criar store para materiais
      if (!db.objectStoreNames.contains(STORES.MATERIALS)) {
        const materialsStore = db.createObjectStore(STORES.MATERIALS, { keyPath: 'id' });
        materialsStore.createIndex('by_location', 'location_id', { unique: false });
        materialsStore.createIndex('by_status', 'status', { unique: false });
      }

      // Criar store para fila de sincronização
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        syncQueueStore.createIndex('by_store', 'store', { unique: false });
        syncQueueStore.createIndex('by_operation', 'operation', { unique: false });
      }
    };
  });
}

// Classe base para operações do IndexedDB
export class IndexedDBStore<T> implements IDBOperations<T> {
  protected storeName: string;

  constructor(storeName: string) {
    this.storeName = storeName;
  }

  private async getDB(): Promise<IDBDatabase> {
    return await initDB();
  }

  private getObjectStore(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
    const transaction = db.transaction(this.storeName, mode);
    return transaction.objectStore(this.storeName);
  }

  async getAll(): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
        db.close();
      };

      request.onerror = (event) => {
        console.error(`Erro ao buscar todos os registros de ${this.storeName}:`, event);
        reject(`Erro ao buscar registros de ${this.storeName}`);
        db.close();
      };
    });
  }

  async getById(id: string): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
        db.close();
      };

      request.onerror = (event) => {
        console.error(`Erro ao buscar registro ${id} de ${this.storeName}:`, event);
        reject(`Erro ao buscar registro ${id}`);
        db.close();
      };
    });
  }

  async add(item: T): Promise<string> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(item);

      request.onsuccess = () => {
        resolve(request.result as string);
        db.close();
      };

      request.onerror = (event) => {
        console.error(`Erro ao adicionar registro em ${this.storeName}:`, event);
        reject(`Erro ao adicionar registro`);
        db.close();
      };
    });
  }

  async update(id: string, item: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        resolve();
        db.close();
      };

      request.onerror = (event) => {
        console.error(`Erro ao atualizar registro ${id} em ${this.storeName}:`, event);
        reject(`Erro ao atualizar registro ${id}`);
        db.close();
      };
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
        db.close();
      };

      request.onerror = (event) => {
        console.error(`Erro ao excluir registro ${id} de ${this.storeName}:`, event);
        reject(`Erro ao excluir registro ${id}`);
        db.close();
      };
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
        db.close();
      };

      request.onerror = (event) => {
        console.error(`Erro ao limpar registros de ${this.storeName}:`, event);
        reject(`Erro ao limpar registros`);
        db.close();
      };
    });
  }

  // Métodos adicionais para consultas mais complexas
  async query(indexName: string, query: IDBKeyRange | any): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index(indexName);
      const request = index.getAll(query);

      request.onsuccess = () => {
        resolve(request.result);
        db.close();
      };

      request.onerror = (event) => {
        console.error(`Erro ao consultar registros em ${this.storeName}:`, event);
        reject(`Erro ao consultar registros`);
        db.close();
      };
    });
  }
}

// Fila de sincronização para operações offline
interface SyncQueueItem {
  id?: number;
  store: string;
  operation: 'add' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

export class SyncQueue {
  private store: IndexedDBStore<SyncQueueItem>;

  constructor() {
    this.store = new IndexedDBStore<SyncQueueItem>(STORES.SYNC_QUEUE);
  }

  async addToQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<number> {
    const queueItem: SyncQueueItem = {
      ...item,
      timestamp: Date.now(),
      retries: 0
    };
    return Number(await this.store.add(queueItem));
  }

  async getAll(): Promise<SyncQueueItem[]> {
    return this.store.getAll();
  }

  async remove(id: number): Promise<void> {
    return this.store.delete(String(id));
  }

  async updateRetries(id: number, retries: number): Promise<void> {
    const item = await this.store.getById(String(id));
    if (item) {
      item.retries = retries;
      await this.store.update(String(id), item);
    }
  }
}

// Implementação específica para FireIncidents
export class FireIncidentStore extends IndexedDBStore<FireIncident> {
  constructor() {
    super(STORES.FIRES);
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<FireIncident[]> {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    
    const range = IDBKeyRange.bound(start, end);
    return this.query('by_date', range);
  }

  async bulkAdd(items: FireIncident[]): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      let processedCount = 0;
      
      transaction.oncomplete = () => {
        resolve();
        db.close();
      };
      
      transaction.onerror = (event) => {
        console.error('Erro ao adicionar múltiplos registros:', event);
        reject('Erro ao adicionar múltiplos registros');
        db.close();
      };
      
      for (const item of items) {
        const request = store.put(item);
        request.onsuccess = () => {
          processedCount++;
          if (processedCount === items.length) {
            // Todos os itens foram processados
            console.log(`${processedCount} incêndios armazenados offline`);
          }
        };
      }
    });
  }
}

// Implementação específica para Checklists
export class ChecklistStore extends IndexedDBStore<Checklist> {
  constructor() {
    super(STORES.CHECKLISTS);
  }

  async getByDate(date: Date): Promise<Checklist[]> {
    const formattedDate = date.toISOString().split('T')[0];
    const range = IDBKeyRange.only(formattedDate);
    return this.query('by_date', range);
  }

  async getByStatus(status: string): Promise<Checklist[]> {
    const range = IDBKeyRange.only(status);
    return this.query('by_status', range);
  }

  async getByUser(userId: string): Promise<Checklist[]> {
    const range = IDBKeyRange.only(userId);
    return this.query('by_user', range);
  }
}

// Implementação específica para ChecklistItems
export class ChecklistItemStore extends IndexedDBStore<ChecklistItem> {
  constructor() {
    super(STORES.CHECKLIST_ITEMS);
  }

  async getByChecklist(checklistId: string): Promise<ChecklistItem[]> {
    const range = IDBKeyRange.only(checklistId);
    return this.query('by_checklist', range);
  }

  async getByMaterial(materialId: string): Promise<ChecklistItem[]> {
    const range = IDBKeyRange.only(materialId);
    return this.query('by_material', range);
  }
  
  async bulkAdd(items: ChecklistItem[]): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      let processedCount = 0;
      
      transaction.oncomplete = () => {
        resolve();
        db.close();
      };
      
      transaction.onerror = (event) => {
        console.error('Erro ao adicionar múltiplos itens de checklist:', event);
        reject('Erro ao adicionar múltiplos itens');
        db.close();
      };
      
      for (const item of items) {
        const request = store.put(item);
        request.onsuccess = () => {
          processedCount++;
          if (processedCount === items.length) {
            console.log(`${processedCount} itens de checklist armazenados offline`);
          }
        };
      }
    });
  }
}

// Implementação específica para Materials
export class MaterialStore extends IndexedDBStore<Material> {
  constructor() {
    super(STORES.MATERIALS);
  }

  async getByLocation(locationId: string): Promise<Material[]> {
    const range = IDBKeyRange.only(locationId);
    return this.query('by_location', range);
  }
  
  async getByStatus(status: string): Promise<Material[]> {
    const range = IDBKeyRange.only(status);
    return this.query('by_status', range);
  }
} 
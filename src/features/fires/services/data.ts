import { FireIncident } from '@/lib/supabase';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FireService } from './fire.service';

/**
 * Interface para o banco de dados IndexedDB
 */
interface FireDB extends DBSchema {
  'fires': {
    key: string;
    value: FireIncident;
    indexes: {
      'by-date': string;
      'by-coordinates': [number, number];
    };
  };
  'sync-queue': {
    key: string;
    value: {
      id: string;
      operation: 'add' | 'update' | 'delete';
      data: FireIncident;
      timestamp: number;
    };
  };
  'meta': {
    key: string;
    value: {
      id: string;
      lastSync: number;
      dataVersion: number;
    };
  };
}

/**
 * Interface para metadados do banco
 */
interface DatabaseMetadata {
  id: string;
  lastSync: number;
  dataVersion: number;
}

/**
 * Serviço para gerenciamento de dados offline de focos de incêndio
 */
export class FireOfflineService {
  private static DB_NAME = 'pemad-fires-db';
  private static DB_VERSION = 1;
  private static db: IDBPDatabase<FireDB> | null = null;

  /**
   * Inicializa o banco de dados IndexedDB
   */
  static async initDB(): Promise<IDBPDatabase<FireDB>> {
    if (this.db) return this.db;

    this.db = await openDB<FireDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db: IDBPDatabase<FireDB>) {
        // Store para focos de incêndio
        const firesStore = db.createObjectStore('fires', { 
          keyPath: 'id' 
        });
        firesStore.createIndex('by-date', 'acq_date');
        firesStore.createIndex('by-coordinates', ['latitude', 'longitude']);

        // Store para fila de sincronização
        db.createObjectStore('sync-queue', {
          keyPath: 'id'
        });

        // Store para metadados
        db.createObjectStore('meta', {
          keyPath: 'id'
        });

        // Adicionar registro de metadados inicial
        const metaStore = db.transaction('meta', 'readwrite').objectStore('meta');
        metaStore.add({
          id: 'metadata',
          lastSync: 0,
          dataVersion: 1
        });
      }
    });

    return this.db;
  }

  /**
   * Salva dados de incêndio no armazenamento local
   */
  static async saveFiresLocally(fires: FireIncident[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('fires', 'readwrite');

    for (const fire of fires) {
      await tx.store.put(fire);
    }

    await tx.done;
  }

  /**
   * Recupera dados de incêndio do armazenamento local
   */
  static async getLocalFires(
    startDate?: string,
    endDate?: string
  ): Promise<FireIncident[]> {
    const db = await this.initDB();
    
    if (!startDate && !endDate) {
      // Retornar todos os incêndios
      return db.getAll('fires');
    }

    // Usar índice por data para consulta mais eficiente
    const index = db.transaction('fires').store.index('by-date');
    let range;

    if (startDate && endDate) {
      range = IDBKeyRange.bound(startDate, endDate);
    } else if (startDate) {
      range = IDBKeyRange.lowerBound(startDate);
    } else if (endDate) {
      range = IDBKeyRange.upperBound(endDate);
    }

    return index.getAll(range);
  }

  /**
   * Busca dados da API e salva localmente
   */
  static async fetchAndSaveLocalFires(params: {
    startDate: string;
    endDate: string;
    minLatitude: number;
    minLongitude: number;
    maxLatitude: number;
    maxLongitude: number;
  }): Promise<FireIncident[]> {
    try {
      // Verificar conexão de rede
      if (!navigator.onLine) {
        throw new Error('Sem conexão com a internet');
      }

      // Buscar dados da API
      const fireData = await FireService.fetchFireIncidents(params);
      
      // Adicionar IDs para os incêndios (necessário para o IndexedDB)
      const fires = fireData.map(fire => {
        const id = `${fire.latitude}_${fire.longitude}_${fire.acq_date}_${fire.acq_time || ''}`;
        return {
          id,
          latitude: fire.latitude,
          longitude: fire.longitude,
          acq_date: fire.acq_date,
          acq_time: fire.acq_time,
          brightness: fire.brightness,
          scan: fire.scan,
          track: fire.track,
          satellite: fire.satellite,
          confidence: fire.confidence,
          version: fire.version,
          bright_t31: fire.bright_t31,
          frp: fire.frp,
          daynight: fire.daynight,
          created_at: new Date().toISOString()
        } as FireIncident;
      });

      // Salvar localmente
      await this.saveFiresLocally(fires);

      // Atualizar último timestamp de sincronização
      await this.updateMetadata({
        lastSync: Date.now()
      });

      return fires;
    } catch (error) {
      console.error('Erro ao buscar e salvar dados de incêndio:', error);
      
      // Se houver erro, tenta retornar dados do cache
      return this.getLocalFires(params.startDate, params.endDate);
    }
  }

  /**
   * Verifica se há dados disponíveis offline
   */
  static async hasOfflineData(): Promise<boolean> {
    const db = await this.initDB();
    const count = await db.count('fires');
    return count > 0;
  }

  /**
   * Atualiza metadados do banco
   */
  static async updateMetadata(data: Partial<Omit<DatabaseMetadata, 'id'>>): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction('meta', 'readwrite');
    const store = tx.objectStore('meta');

    // Obter metadata existente
    const meta = await store.get('metadata') || {
      id: 'metadata',
      lastSync: 0,
      dataVersion: 1
    };

    // Atualizar com novos dados
    await store.put({
      ...meta,
      ...data
    } as DatabaseMetadata);

    await tx.done;
  }

  /**
   * Obtém metadados do banco
   */
  static async getMetadata(): Promise<Omit<DatabaseMetadata, 'id'>> {
    const db = await this.initDB();
    const meta = await db.get('meta', 'metadata');
    
    return meta ? 
      { lastSync: meta.lastSync, dataVersion: meta.dataVersion } : 
      { lastSync: 0, dataVersion: 1 };
  }

  /**
   * Limpa todos os dados locais
   */
  static async clearAllData(): Promise<void> {
    const db = await this.initDB();
    
    const tx = db.transaction(['fires', 'sync-queue', 'meta'], 'readwrite');
    await tx.objectStore('fires').clear();
    await tx.objectStore('sync-queue').clear();
    
    // Resetar metadados
    await tx.objectStore('meta').put({
      id: 'metadata',
      lastSync: 0,
      dataVersion: 1
    } as DatabaseMetadata);
    
    await tx.done;
  }

  /**
   * Função para sincronizar dados offline com o servidor
   */
  static async syncWithServer(): Promise<{
    success: boolean;
    updated: number;
    message: string;
  }> {
    if (!navigator.onLine) {
      return {
        success: false,
        updated: 0,
        message: 'Sem conexão com a internet. Tente novamente mais tarde.'
      };
    }

    try {
      const db = await this.initDB();
      
      // Verificar se há entradas na fila de sincronização
      const syncQueue = await db.getAll('sync-queue');
      
      if (syncQueue.length === 0) {
        return {
          success: true,
          updated: 0,
          message: 'Não há alterações para sincronizar.'
        };
      }

      // Processar cada entrada na fila
      let processed = 0;
      
      for (const entry of syncQueue) {
        // Implementar lógica de sincronização conforme a operação
        // No caso dos focos de incêndio, geralmente só temos operações de adicionar
        if (entry.operation === 'add') {
          await FireService.saveFireIncidents([entry.data]);
          processed++;
        }
        
        // Remover da fila após processamento
        await db.delete('sync-queue', entry.id);
      }

      // Atualizar timestamp de sincronização
      await this.updateMetadata({
        lastSync: Date.now()
      });

      return {
        success: true,
        updated: processed,
        message: `${processed} registros sincronizados com sucesso.`
      };
    } catch (error) {
      console.error('Erro durante sincronização:', error);
      return {
        success: false,
        updated: 0,
        message: `Erro durante sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
} 
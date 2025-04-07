import { supabase } from '@/lib/supabase';
import { Checklist, ChecklistItem, Material } from '@/lib/supabase';
import { ChecklistStore, ChecklistItemStore, MaterialStore, SyncQueue } from '@/lib/indexedDB';
import { v4 as uuidv4 } from 'uuid';

export class ChecklistService {
  private static instance: ChecklistService;
  private checklistStore: ChecklistStore;
  private checklistItemStore: ChecklistItemStore;
  private materialStore: MaterialStore;
  private syncQueue: SyncQueue;
  private isOnline: boolean = true;

  private constructor() {
    this.checklistStore = new ChecklistStore();
    this.checklistItemStore = new ChecklistItemStore();
    this.materialStore = new MaterialStore();
    this.syncQueue = new SyncQueue();
    
    // Monitorar status de conexão
    window.addEventListener('online', this.handleOnlineStatus.bind(this));
    window.addEventListener('offline', this.handleOnlineStatus.bind(this));
    this.isOnline = navigator.onLine;
  }

  public static getInstance(): ChecklistService {
    if (!ChecklistService.instance) {
      ChecklistService.instance = new ChecklistService();
    }
    return ChecklistService.instance;
  }

  private handleOnlineStatus() {
    const wasOffline = !this.isOnline;
    this.isOnline = navigator.onLine;
    
    // Se voltou a ficar online, tenta sincronizar
    if (this.isOnline && wasOffline) {
      this.syncOfflineData();
    }
  }

  // Métodos para gerenciar Checklists
  
  public async getChecklists(userId?: string): Promise<Checklist[]> {
    try {
      if (this.isOnline) {
        let query = supabase.from('checklists').select('*');
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query.order('data', { ascending: false });
        
        if (error) throw error;
        
        // Armazenar no IndexedDB para uso offline
        if (data && data.length > 0) {
          await Promise.all(data.map(async (checklist) => {
            await this.checklistStore.update(checklist.id, checklist);
          }));
        }
        
        return data || [];
      } else {
        // Modo offline - buscar do IndexedDB
        let checklists = await this.checklistStore.getAll();
        
        if (userId) {
          checklists = checklists.filter(checklist => checklist.user_id === userId);
        }
        
        // Ordenar por data decrescente
        return checklists.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      }
    } catch (error) {
      console.error('Erro ao buscar checklists:', error);
      // Se falhar online, tenta recuperar do IndexedDB
      if (this.isOnline) {
        let checklists = await this.checklistStore.getAll();
        
        if (userId) {
          checklists = checklists.filter(checklist => checklist.user_id === userId);
        }
        
        return checklists.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      }
      return [];
    }
  }

  public async getChecklistById(id: string): Promise<Checklist | null> {
    try {
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('checklists')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        // Armazenar no IndexedDB
        if (data) {
          await this.checklistStore.update(data.id, data);
        }
        
        return data;
      } else {
        // Modo offline
        const checklist = await this.checklistStore.getById(id);
        return checklist || null;
      }
    } catch (error) {
      console.error(`Erro ao buscar checklist ${id}:`, error);
      // Se falhar online, tenta recuperar do IndexedDB
      if (this.isOnline) {
        return await this.checklistStore.getById(id) || null;
      }
      return null;
    }
  }

  public async createChecklist(checklist: Omit<Checklist, 'id'>): Promise<Checklist> {
    const newChecklist: Checklist = {
      id: uuidv4(),
      ...checklist,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('checklists')
          .insert(newChecklist)
          .select()
          .single();
        
        if (error) throw error;
        
        // Armazenar no IndexedDB
        if (data) {
          await this.checklistStore.update(data.id, data);
          return data;
        }
        
        return newChecklist;
      } else {
        // Modo offline - salvar no IndexedDB e na fila de sincronização
        await this.checklistStore.add(newChecklist);
        await this.syncQueue.addToQueue({
          store: 'checklists',
          operation: 'add',
          data: newChecklist
        });
        
        return newChecklist;
      }
    } catch (error) {
      console.error('Erro ao criar checklist:', error);
      // Se falhar online, salvar no IndexedDB e na fila de sincronização
      if (this.isOnline) {
        await this.checklistStore.add(newChecklist);
        await this.syncQueue.addToQueue({
          store: 'checklists',
          operation: 'add',
          data: newChecklist
        });
      }
      return newChecklist;
    }
  }

  public async updateChecklist(id: string, updates: Partial<Checklist>): Promise<Checklist | null> {
    try {
      const existingChecklist = await this.getChecklistById(id);
      if (!existingChecklist) return null;
      
      const updatedChecklist: Checklist = {
        ...existingChecklist,
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('checklists')
          .update(updatedChecklist)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        // Atualizar no IndexedDB
        if (data) {
          await this.checklistStore.update(data.id, data);
          return data;
        }
        
        return updatedChecklist;
      } else {
        // Modo offline
        await this.checklistStore.update(id, updatedChecklist);
        await this.syncQueue.addToQueue({
          store: 'checklists',
          operation: 'update',
          data: updatedChecklist
        });
        
        return updatedChecklist;
      }
    } catch (error) {
      console.error(`Erro ao atualizar checklist ${id}:`, error);
      // Se falhar online, salvar no IndexedDB e na fila
      if (this.isOnline) {
        const existingChecklist = await this.getChecklistById(id);
        if (!existingChecklist) return null;
        
        const updatedChecklist: Checklist = {
          ...existingChecklist,
          ...updates,
          updated_at: new Date().toISOString()
        };
        
        await this.checklistStore.update(id, updatedChecklist);
        await this.syncQueue.addToQueue({
          store: 'checklists',
          operation: 'update',
          data: updatedChecklist
        });
        
        return updatedChecklist;
      }
      return null;
    }
  }

  // Métodos para gerenciar itens de checklist
  
  public async getChecklistItems(checklistId: string): Promise<ChecklistItem[]> {
    try {
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('checklist_id', checklistId);
        
        if (error) throw error;
        
        // Armazenar no IndexedDB
        if (data && data.length > 0) {
          await this.checklistItemStore.bulkAdd(data);
        }
        
        return data || [];
      } else {
        // Modo offline
        return await this.checklistItemStore.getByChecklist(checklistId);
      }
    } catch (error) {
      console.error(`Erro ao buscar itens do checklist ${checklistId}:`, error);
      // Se falhar online, tenta recuperar do IndexedDB
      if (this.isOnline) {
        return await this.checklistItemStore.getByChecklist(checklistId);
      }
      return [];
    }
  }

  public async createChecklistItem(item: Omit<ChecklistItem, 'id'>): Promise<ChecklistItem> {
    const newItem: ChecklistItem = {
      id: uuidv4(),
      ...item,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('checklist_items')
          .insert(newItem)
          .select()
          .single();
        
        if (error) throw error;
        
        // Armazenar no IndexedDB
        if (data) {
          await this.checklistItemStore.update(data.id, data);
          
          // Atualizar porcentagem do checklist no frontend
          await this.updateChecklistProgress(newItem.checklist_id);
          
          return data;
        }
        
        return newItem;
      } else {
        // Modo offline
        await this.checklistItemStore.add(newItem);
        await this.syncQueue.addToQueue({
          store: 'checklist_items',
          operation: 'add',
          data: newItem
        });
        
        // Atualizar porcentagem do checklist no frontend
        await this.updateChecklistProgress(newItem.checklist_id);
        
        return newItem;
      }
    } catch (error) {
      console.error('Erro ao criar item de checklist:', error);
      // Se falhar online, salvar no IndexedDB e na fila
      if (this.isOnline) {
        await this.checklistItemStore.add(newItem);
        await this.syncQueue.addToQueue({
          store: 'checklist_items',
          operation: 'add',
          data: newItem
        });
      }
      return newItem;
    }
  }

  public async updateChecklistItem(id: string, updates: Partial<ChecklistItem>): Promise<ChecklistItem | null> {
    try {
      const { data: existingItem } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!existingItem) {
        const offlineItem = await this.checklistItemStore.getById(id);
        if (!offlineItem) return null;
      }
      
      const item = existingItem || await this.checklistItemStore.getById(id);
      
      const updatedItem: ChecklistItem = {
        ...item!,
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      if (this.isOnline) {
        const { data, error } = await supabase
          .from('checklist_items')
          .update(updatedItem)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        // Armazenar no IndexedDB
        if (data) {
          await this.checklistItemStore.update(data.id, data);
          
          // Atualizar porcentagem do checklist
          await this.updateChecklistProgress(data.checklist_id);
          
          return data;
        }
        
        return updatedItem;
      } else {
        // Modo offline
        await this.checklistItemStore.update(id, updatedItem);
        await this.syncQueue.addToQueue({
          store: 'checklist_items',
          operation: 'update',
          data: updatedItem
        });
        
        // Atualizar porcentagem do checklist
        await this.updateChecklistProgress(updatedItem.checklist_id);
        
        return updatedItem;
      }
    } catch (error) {
      console.error(`Erro ao atualizar item de checklist ${id}:`, error);
      return null;
    }
  }

  // Métodos para materiais
  
  public async getMaterials(locationId?: string): Promise<Material[]> {
    try {
      if (this.isOnline) {
        let query = supabase.from('materials').select('*');
        
        if (locationId) {
          query = query.eq('location_id', locationId);
        }
        
        const { data, error } = await query.order('nome');
        
        if (error) throw error;
        
        // Armazenar no IndexedDB
        if (data && data.length > 0) {
          for (const material of data) {
            await this.materialStore.update(material.id, material);
          }
        }
        
        return data || [];
      } else {
        // Modo offline
        let materials = await this.materialStore.getAll();
        
        if (locationId) {
          materials = materials.filter(material => material.location_id === locationId);
        }
        
        return materials.sort((a, b) => a.nome.localeCompare(b.nome));
      }
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      // Se falhar online, tenta recuperar do IndexedDB
      if (this.isOnline) {
        let materials = await this.materialStore.getAll();
        
        if (locationId) {
          materials = materials.filter(material => material.location_id === locationId);
        }
        
        return materials.sort((a, b) => a.nome.localeCompare(b.nome));
      }
      return [];
    }
  }

  // Método auxiliar para atualizar a porcentagem de conclusão do checklist
  private async updateChecklistProgress(checklistId: string): Promise<void> {
    try {
      const items = await this.getChecklistItems(checklistId);
      
      if (items.length === 0) return;
      
      const totalItems = items.length;
      const checkedItems = items.filter(item => item.conferido).length;
      const porcentagem = Math.round((checkedItems / totalItems) * 100);
      
      const status = porcentagem === 100 ? 'concluido' : porcentagem > 0 ? 'parcial' : 'pendente';
      
      await this.updateChecklist(checklistId, { 
        porcentagem, 
        status,
        data_conclusao: porcentagem === 100 ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error(`Erro ao atualizar progresso do checklist ${checklistId}:`, error);
    }
  }

  // Sincronização de dados offline
  public async syncOfflineData(): Promise<{
    success: boolean;
    syncedItems: number;
    errors: number;
    remainingItems: number;
  }> {
    if (!this.isOnline) {
      return {
        success: false,
        syncedItems: 0,
        errors: 0,
        remainingItems: 0
      };
    }
    
    try {
      const queueItems = await this.syncQueue.getAll();
      
      if (queueItems.length === 0) {
        return {
          success: true,
          syncedItems: 0,
          errors: 0,
          remainingItems: 0
        };
      }
      
      let syncedItems = 0;
      let errors = 0;
      
      for (const item of queueItems) {
        try {
          switch (item.store) {
            case 'checklists':
              await this.syncChecklistItem(item);
              break;
            case 'checklist_items':
              await this.syncChecklistItemItem(item);
              break;
            // Outros stores podem ser adicionados conforme necessário
          }
          
          // Remover da fila após sincronização bem-sucedida
          await this.syncQueue.remove(item.id!);
          syncedItems++;
        } catch (error) {
          console.error(`Erro ao sincronizar item ${item.id}:`, error);
          errors++;
          
          // Incrementar contagem de tentativas
          await this.syncQueue.updateRetries(item.id!, item.retries + 1);
        }
      }
      
      // Verificar itens restantes
      const remainingItems = (await this.syncQueue.getAll()).length;
      
      return {
        success: errors === 0,
        syncedItems,
        errors,
        remainingItems
      };
    } catch (error) {
      console.error('Erro ao sincronizar dados offline:', error);
      return {
        success: false,
        syncedItems: 0,
        errors: 1,
        remainingItems: (await this.syncQueue.getAll()).length
      };
    }
  }

  private async syncChecklistItem(item: any): Promise<void> {
    const { operation, data } = item;
    
    switch (operation) {
      case 'add':
        await supabase.from('checklists').insert(data);
        break;
      case 'update':
        await supabase.from('checklists').update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from('checklists').delete().eq('id', data.id);
        break;
    }
  }

  private async syncChecklistItemItem(item: any): Promise<void> {
    const { operation, data } = item;
    
    switch (operation) {
      case 'add':
        await supabase.from('checklist_items').insert(data);
        break;
      case 'update':
        await supabase.from('checklist_items').update(data).eq('id', data.id);
        break;
      case 'delete':
        await supabase.from('checklist_items').delete().eq('id', data.id);
        break;
    }
  }

  // Método para verificar status online/offline
  public isOffline(): boolean {
    return !this.isOnline;
  }
} 
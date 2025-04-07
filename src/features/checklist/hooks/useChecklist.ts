import { useState, useEffect, useCallback } from 'react';
import { Checklist, ChecklistItem, Material } from '@/lib/supabase';
import { ChecklistService } from '@/services/checklist/checklist.service';

interface ChecklistState {
  checklists: Checklist[];
  currentChecklist: Checklist | null;
  items: ChecklistItem[];
  materials: Material[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
  syncStatus: {
    success?: boolean;
    syncedItems: number;
    errors: number;
    remainingItems: number;
  } | null;
  isOffline: boolean;
}

export const useChecklist = (userId?: string) => {
  const [state, setState] = useState<ChecklistState>({
    checklists: [],
    currentChecklist: null,
    items: [],
    materials: [],
    loading: false,
    error: null,
    syncing: false,
    syncStatus: null,
    isOffline: false
  });

  const checklistService = ChecklistService.getInstance();

  // Verificar status offline
  const updateOfflineStatus = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOffline: checklistService.isOffline()
    }));
  }, [checklistService]);

  // Carregar checklists
  const loadChecklists = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const checklists = await checklistService.getChecklists(userId);
      setState(prev => ({
        ...prev,
        checklists,
        loading: false,
        isOffline: checklistService.isOffline()
      }));
    } catch (error) {
      console.error('Erro ao carregar checklists:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar checklists. Tente novamente.',
        isOffline: checklistService.isOffline()
      }));
    }
  }, [checklistService, userId]);

  // Carregar um checklist específico e seus itens
  const loadChecklist = useCallback(async (checklistId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const checklist = await checklistService.getChecklistById(checklistId);
      if (checklist) {
        const items = await checklistService.getChecklistItems(checklistId);

        setState(prev => ({
          ...prev,
          currentChecklist: checklist,
          items,
          loading: false,
          isOffline: checklistService.isOffline()
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Checklist não encontrado.',
          isOffline: checklistService.isOffline()
        }));
      }
    } catch (error) {
      console.error(`Erro ao carregar checklist ${checklistId}:`, error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar checklist. Tente novamente.',
        isOffline: checklistService.isOffline()
      }));
    }
  }, [checklistService]);

  // Carregar materiais por localização
  const loadMaterials = useCallback(async (locationId?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const materials = await checklistService.getMaterials(locationId);
      setState(prev => ({
        ...prev,
        materials,
        loading: false,
        isOffline: checklistService.isOffline()
      }));
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar materiais. Tente novamente.',
        isOffline: checklistService.isOffline()
      }));
    }
  }, [checklistService]);

  // Criar um novo checklist
  const createChecklist = useCallback(async (checklist: Omit<Checklist, 'id'>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const newChecklist = await checklistService.createChecklist(checklist);
      setState(prev => ({
        ...prev,
        checklists: [newChecklist, ...prev.checklists],
        currentChecklist: newChecklist,
        loading: false,
        isOffline: checklistService.isOffline()
      }));
      return newChecklist;
    } catch (error) {
      console.error('Erro ao criar checklist:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao criar checklist. Tente novamente.',
        isOffline: checklistService.isOffline()
      }));
      return null;
    }
  }, [checklistService]);

  // Atualizar um checklist
  const updateChecklist = useCallback(async (id: string, updates: Partial<Checklist>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const updatedChecklist = await checklistService.updateChecklist(id, updates);
      if (updatedChecklist) {
        setState(prev => ({
          ...prev,
          checklists: prev.checklists.map(c => 
            c.id === id ? updatedChecklist : c
          ),
          currentChecklist: prev.currentChecklist?.id === id 
            ? updatedChecklist 
            : prev.currentChecklist,
          loading: false,
          isOffline: checklistService.isOffline()
        }));
      }
      return updatedChecklist;
    } catch (error) {
      console.error(`Erro ao atualizar checklist ${id}:`, error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao atualizar checklist. Tente novamente.',
        isOffline: checklistService.isOffline()
      }));
      return null;
    }
  }, [checklistService]);

  // Criar um item de checklist
  const createChecklistItem = useCallback(async (item: Omit<ChecklistItem, 'id'>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const newItem = await checklistService.createChecklistItem(item);
      setState(prev => ({
        ...prev,
        items: [...prev.items, newItem],
        loading: false,
        isOffline: checklistService.isOffline()
      }));
      
      // Se o item pertence ao checklist atual, atualizar a porcentagem
      if (prev.currentChecklist && prev.currentChecklist.id === item.checklist_id) {
        const updatedChecklist = await checklistService.getChecklistById(item.checklist_id);
        if (updatedChecklist) {
          setState(prev => ({
            ...prev,
            currentChecklist: updatedChecklist,
            checklists: prev.checklists.map(c => 
              c.id === updatedChecklist.id ? updatedChecklist : c
            ),
            isOffline: checklistService.isOffline()
          }));
        }
      }
      
      return newItem;
    } catch (error) {
      console.error('Erro ao criar item de checklist:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao criar item de checklist. Tente novamente.',
        isOffline: checklistService.isOffline()
      }));
      return null;
    }
  }, [checklistService]);

  // Atualizar um item de checklist
  const updateChecklistItem = useCallback(async (id: string, updates: Partial<ChecklistItem>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const updatedItem = await checklistService.updateChecklistItem(id, updates);
      if (updatedItem) {
        setState(prev => ({
          ...prev,
          items: prev.items.map(i => i.id === id ? updatedItem : i),
          loading: false,
          isOffline: checklistService.isOffline()
        }));
        
        // Atualizar o checklist corrente se o item pertence a ele
        if (prev.currentChecklist && prev.currentChecklist.id === updatedItem.checklist_id) {
          const updatedChecklist = await checklistService.getChecklistById(updatedItem.checklist_id);
          if (updatedChecklist) {
            setState(prev => ({
              ...prev,
              currentChecklist: updatedChecklist,
              checklists: prev.checklists.map(c => 
                c.id === updatedChecklist.id ? updatedChecklist : c
              ),
              isOffline: checklistService.isOffline()
            }));
          }
        }
      }
      return updatedItem;
    } catch (error) {
      console.error(`Erro ao atualizar item de checklist ${id}:`, error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao atualizar item de checklist. Tente novamente.',
        isOffline: checklistService.isOffline()
      }));
      return null;
    }
  }, [checklistService]);

  // Função para marcar/desmarcar um item como conferido
  const toggleChecklistItem = useCallback(async (id: string, checked: boolean) => {
    return updateChecklistItem(id, { conferido: checked });
  }, [updateChecklistItem]);

  // Sincronizar dados offline
  const syncOfflineData = useCallback(async () => {
    if (checklistService.isOffline()) {
      setState(prev => ({
        ...prev,
        error: 'Não é possível sincronizar no modo offline.'
      }));
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      syncing: true, 
      error: null,
      syncStatus: null
    }));
    
    try {
      const result = await checklistService.syncOfflineData();
      setState(prev => ({ 
        ...prev, 
        syncing: false,
        syncStatus: result
      }));
      
      // Recarregar dados após sincronização
      if (result.success) {
        await loadChecklists();
        if (state.currentChecklist) {
          await loadChecklist(state.currentChecklist.id);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Erro durante a sincronização:', error);
      setState(prev => ({ 
        ...prev, 
        syncing: false,
        error: 'Erro ao sincronizar dados. Tente novamente.',
        syncStatus: {
          success: false,
          syncedItems: 0,
          errors: 1,
          remainingItems: 0
        }
      }));
      return null;
    }
  }, [checklistService, loadChecklists, loadChecklist, state.currentChecklist]);

  // Monitorar status online/offline
  useEffect(() => {
    const handleOnlineStatus = () => {
      updateOfflineStatus();
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Verificar status inicial
    updateOfflineStatus();
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [updateOfflineStatus]);

  return {
    checklists: state.checklists,
    currentChecklist: state.currentChecklist,
    items: state.items,
    materials: state.materials,
    loading: state.loading,
    error: state.error,
    syncing: state.syncing,
    syncStatus: state.syncStatus,
    isOffline: state.isOffline,
    
    // Métodos
    loadChecklists,
    loadChecklist,
    loadMaterials,
    createChecklist,
    updateChecklist,
    createChecklistItem,
    updateChecklistItem,
    toggleChecklistItem,
    syncOfflineData
  };
}; 
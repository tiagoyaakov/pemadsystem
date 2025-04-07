import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useChecklist } from '../hooks/useChecklist';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ChecklistItem, Material } from '@/lib/supabase';
import OfflineIndicator from '../components/OfflineIndicator';
import ChecklistItemForm from '../components/ChecklistItemForm';
import ExportButtons from '../components/ExportButtons';
import { 
  Check, 
  X, 
  Clock, 
  ArrowLeft, 
  CheckSquare,
  Square,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  Plus,
  Share2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ChecklistDetailPage: React.FC = () => {
  const router = useRouter();
  const { id: checklistId } = router.query;
  const { user } = useAuth();
  const {
    currentChecklist,
    items,
    materials,
    loading,
    error,
    isOffline,
    syncing,
    syncStatus,
    loadChecklist,
    loadMaterials,
    toggleChecklistItem,
    updateChecklistItem,
    createChecklistItem,
    syncOfflineData
  } = useChecklist();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'conferidos' | 'pendentes'>('todos');
  const [materialsMap, setMaterialsMap] = useState<Record<string, Material>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [showAddItemForm, setShowAddItemForm] = useState(false);

  // Carregar checklist quando o ID estiver disponível
  useEffect(() => {
    if (checklistId && typeof checklistId === 'string') {
      loadChecklist(checklistId);
    }
  }, [checklistId, loadChecklist]);

  // Carregar materiais quando o checklist estiver carregado
  useEffect(() => {
    if (currentChecklist?.location_id) {
      loadMaterials(currentChecklist.location_id);
    }
  }, [currentChecklist, loadMaterials]);

  // Criar um mapa de materiais para fácil acesso
  useEffect(() => {
    const map: Record<string, Material> = {};
    materials.forEach(material => {
      map[material.id] = material;
    });
    setMaterialsMap(map);
  }, [materials]);

  // Carregar observações dos itens para edição local
  useEffect(() => {
    const obs: Record<string, string> = {};
    items.forEach(item => {
      obs[item.id] = item.observacoes || '';
    });
    setObservacoes(obs);
  }, [items]);

  // Filtrar itens com base no termo de busca e status
  const filteredItems = items.filter(item => {
    const material = materialsMap[item.material_id];
    
    // Filtrar por texto de busca no nome ou código do material
    const matchesSearch = !searchTerm || 
      (material && (
        material.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
        material.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    // Filtrar por status (conferido/pendente)
    const matchesStatus = 
      filterStatus === 'todos' || 
      (filterStatus === 'conferidos' && item.conferido) || 
      (filterStatus === 'pendentes' && !item.conferido);
    
    return matchesSearch && matchesStatus;
  });

  // Ordenar itens: primeiro os não conferidos, depois por nome
  const sortedItems = [...filteredItems].sort((a, b) => {
    // Primeiro por status (não conferidos primeiro)
    if (a.conferido !== b.conferido) {
      return a.conferido ? 1 : -1;
    }
    
    // Depois por nome do material
    const materialA = materialsMap[a.material_id];
    const materialB = materialsMap[b.material_id];
    
    if (materialA && materialB) {
      return materialA.nome.localeCompare(materialB.nome);
    }
    
    return 0;
  });

  // Função para alternar estado conferido de um item
  const handleToggleItem = async (itemId: string, checked: boolean) => {
    setSaving(prev => ({ ...prev, [itemId]: true }));
    
    try {
      await toggleChecklistItem(itemId, checked);
    } catch (error) {
      console.error('Erro ao alternar status do item:', error);
    } finally {
      setSaving(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Função para salvar observações
  const handleSaveObservacoes = async (itemId: string) => {
    setSaving(prev => ({ ...prev, [itemId]: true }));
    
    try {
      await updateChecklistItem(itemId, { 
        observacoes: observacoes[itemId]
      });
    } catch (error) {
      console.error('Erro ao salvar observações:', error);
    } finally {
      setSaving(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Função para adicionar novo item ao checklist
  const handleAddItem = async (data: Omit<ChecklistItem, 'id'>) => {
    if (!checklistId || typeof checklistId !== 'string') return;
    
    try {
      await createChecklistItem({
        ...data,
        checklist_id: checklistId
      });
      setShowAddItemForm(false);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    }
  };

  // Estatísticas do checklist
  const stats = {
    total: items.length,
    conferidos: items.filter(item => item.conferido).length,
    pendentes: items.filter(item => !item.conferido).length,
    porcentagem: currentChecklist?.porcentagem || 0
  };

  // Renderizar status do checklist com cores
  const renderStatus = () => {
    if (!currentChecklist) return null;
    
    switch (currentChecklist.status) {
      case 'concluido':
        return (
          <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
            <Check size={18} className="mr-1" />
            <span className="font-medium">Concluído</span>
          </div>
        );
      case 'parcial':
        return (
          <div className="inline-flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
            <Clock size={18} className="mr-1" />
            <span className="font-medium">Parcial ({currentChecklist.porcentagem}%)</span>
          </div>
        );
      case 'pendente':
        return (
          <div className="inline-flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
            <AlertTriangle size={18} className="mr-1" />
            <span className="font-medium">Pendente</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
            {currentChecklist.status}
          </div>
        );
    }
  };

  // Buscar nome da localização
  const getLocationName = async (locationId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('checklist_locations')
        .select('nome')
        .eq('id', locationId)
        .single();
      
      if (error) throw error;
      return data?.nome || locationId;
    } catch (error) {
      console.error('Erro ao buscar nome da localização:', error);
      return locationId;
    }
  };

  // Buscar nome do setor
  const getSectorName = async (sectorId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('alas')
        .select('nome')
        .eq('id', sectorId)
        .single();
      
      if (error) throw error;
      return data?.nome || sectorId;
    } catch (error) {
      console.error('Erro ao buscar nome do setor:', error);
      return sectorId;
    }
  };

  // Estado para armazenar nomes de localização e setor
  const [locationName, setLocationName] = useState<string>('');
  const [sectorName, setSectorName] = useState<string>('');

  // Buscar nomes quando o checklist estiver carregado
  useEffect(() => {
    if (currentChecklist) {
      getLocationName(currentChecklist.location_id).then(setLocationName);
      getSectorName(currentChecklist.setor_id).then(setSectorName);
    }
  }, [currentChecklist]);

  // Renderizar ações do checklist
  const renderActions = () => {
    if (!currentChecklist) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
        <ExportButtons
          checklist={currentChecklist}
          items={items}
          materials={materialsMap}
          locationName={locationName}
          sectorName={sectorName}
        />

        {/* Botão de compartilhar (implementação futura) */}
        <button
          disabled
          className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-md text-sm opacity-50 cursor-not-allowed"
          title="Em breve"
        >
          <Share2 size={16} />
          <span>Compartilhar</span>
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !currentChecklist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-6">
          {error || 'Checklist não encontrado'}
        </div>
        <button 
          onClick={() => router.push('/checklists')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} className="mr-1" />
          Voltar para lista de checklists
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Cabeçalho com navegação e informações gerais */}
      <div className="mb-6">
        <button 
          onClick={() => router.push('/checklists')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft size={20} className="mr-1" />
          Voltar para lista de checklists
        </button>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Checklist: {new Date(currentChecklist.data).toLocaleDateString('pt-BR')}
            </h1>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Responsável:</span> {currentChecklist.responsavel}
            </p>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Localização:</span> {locationName}
            </p>
            <p className="text-gray-600 mb-3">
              <span className="font-medium">Setor:</span> {sectorName}
            </p>
          </div>
          
          <div className="flex flex-col md:items-end gap-2">
            {renderStatus()}
            <OfflineIndicator 
              isOffline={isOffline} 
              syncing={syncing} 
              syncStatus={syncStatus}
              onSync={syncOfflineData}
            />
            {renderActions()}
          </div>
        </div>
      </div>

      {/* Barra de progresso do checklist */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Progresso</h2>
          <div className="text-sm text-gray-600">
            {stats.conferidos} de {stats.total} itens conferidos
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full ${
              stats.porcentagem === 100
                ? 'bg-green-600'
                : stats.porcentagem > 50
                ? 'bg-blue-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${stats.porcentagem}%` }}
          ></div>
        </div>
        
        {currentChecklist.observacoes && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Observações gerais:</h3>
            <p className="text-gray-600 italic bg-gray-50 p-2 rounded">
              {currentChecklist.observacoes}
            </p>
          </div>
        )}
      </div>

      {/* Botão para adicionar novo item */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddItemForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          disabled={loading || syncing}
        >
          <Plus size={18} className="mr-1" />
          Adicionar Item
        </button>
      </div>

      {/* Formulário para adicionar novo item */}
      {showAddItemForm && (
        <div className="mb-6">
          <ChecklistItemForm
            checklistId={checklistId as string}
            materials={materials}
            onSubmit={handleAddItem}
            onCancel={() => setShowAddItemForm(false)}
            isOffline={isOffline}
          />
        </div>
      )}

      {/* Filtros e busca */}
      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar materiais..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <div className="relative">
                <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="todos">Todos os itens</option>
                  <option value="pendentes">Pendentes</option>
                  <option value="conferidos">Conferidos</option>
                </select>
                <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de itens do checklist */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {sortedItems.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum item encontrado</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'todos'
                ? 'Tente ajustar seus filtros de busca'
                : 'Este checklist não possui itens para conferência'}
            </p>
            {!searchTerm && filterStatus === 'todos' && (
              <button
                onClick={() => setShowAddItemForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md flex items-center mx-auto"
              >
                <Plus size={18} className="mr-1" />
                Adicionar primeiro item
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedItems.map((item) => {
              const material = materialsMap[item.material_id];
              
              return (
                <li 
                  key={item.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    item.conferido ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    {/* Checkbox */}
                    <div className="md:w-10 flex justify-center">
                      <button
                        onClick={() => handleToggleItem(item.id, !item.conferido)}
                        disabled={saving[item.id]}
                        className="text-gray-700 hover:text-blue-600 disabled:opacity-50"
                        aria-label={item.conferido ? "Marcar como não conferido" : "Marcar como conferido"}
                      >
                        {saving[item.id] ? (
                          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                        ) : item.conferido ? (
                          <CheckSquare size={24} className="text-green-600" />
                        ) : (
                          <Square size={24} />
                        )}
                      </button>
                    </div>
                    
                    {/* Informações do material */}
                    <div className="flex-1">
                      {material ? (
                        <>
                          <h3 className="font-medium text-gray-800">{material.nome}</h3>
                          <p className="text-gray-500 text-sm">Código: {material.codigo}</p>
                          {material.descricao && (
                            <p className="text-gray-600 text-sm mt-1">{material.descricao}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-red-500">Material não encontrado (ID: {item.material_id})</p>
                      )}
                      
                      {/* Campo de observações */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <textarea
                            value={observacoes[item.id] || ''}
                            onChange={(e) => setObservacoes(prev => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder="Observações sobre este item..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                          
                          {(observacoes[item.id] || '') !== (item.observacoes || '') && (
                            <button
                              onClick={() => handleSaveObservacoes(item.id)}
                              disabled={saving[item.id]}
                              className="bg-blue-500 hover:bg-blue-600 text-white h-10 px-3 rounded"
                            >
                              Salvar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className="md:w-24 flex justify-end">
                      {item.conferido ? (
                        <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          <Check size={12} className="mr-1" />
                          Conferido
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          <X size={12} className="mr-1" />
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChecklistDetailPage; 
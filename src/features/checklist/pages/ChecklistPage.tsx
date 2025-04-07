import React, { useEffect, useState } from 'react';
import { useChecklist } from '../hooks/useChecklist';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Checklist, Ala, Localizacao } from '@/lib/supabase';
import ChecklistForm from '../components/ChecklistForm';
import OfflineIndicator from '../components/OfflineIndicator';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Check, 
  Clock, 
  AlertCircle, 
  CloudSync,
  FileText,
  Search,
  ChevronDown,
  Filter
} from 'lucide-react';

const ChecklistPage: React.FC = () => {
  const { user } = useAuth();
  const {
    checklists,
    loading,
    error,
    isOffline,
    syncing,
    syncStatus,
    loadChecklists,
    createChecklist,
    syncOfflineData
  } = useChecklist(user?.id);

  const [showForm, setShowForm] = useState(false);
  const [alas, setAlas] = useState<Ala[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar checklists iniciais
  useEffect(() => {
    loadChecklists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Carregar dados de alas e localizações
  useEffect(() => {
    const loadMetadata = async () => {
      setLoadingMeta(true);
      try {
        // Buscar alas
        const { data: alasData, error: alasError } = await supabase
          .from('alas')
          .select('*')
          .order('nome');
        
        if (alasError) throw alasError;
        
        // Buscar localizações
        const { data: locData, error: locError } = await supabase
          .from('checklist_locations')
          .select('*')
          .order('nome');
        
        if (locError) throw locError;
        
        setAlas(alasData || []);
        setLocalizacoes(locData || []);
      } catch (error) {
        console.error('Erro ao carregar metadados:', error);
      } finally {
        setLoadingMeta(false);
      }
    };
    
    loadMetadata();
  }, []);

  // Filtrar checklists com base no status e termo de busca
  const filteredChecklists = checklists.filter(checklist => {
    const matchesStatus = !filterStatus || checklist.status === filterStatus;
    const matchesSearch = !searchTerm || 
      checklist.responsavel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checklist.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Handler para criar novo checklist
  const handleCreateChecklist = async (data: Omit<Checklist, 'id'>) => {
    await createChecklist(data);
    setShowForm(false);
  };

  // Renderizar status do checklist com ícone
  const renderStatus = (status: string) => {
    switch (status) {
      case 'concluido':
        return (
          <span className="flex items-center text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs">
            <Check size={14} className="mr-1" />
            Concluído
          </span>
        );
      case 'parcial':
        return (
          <span className="flex items-center text-amber-700 bg-amber-100 px-2 py-1 rounded-full text-xs">
            <Clock size={14} className="mr-1" />
            Parcial
          </span>
        );
      case 'pendente':
        return (
          <span className="flex items-center text-gray-700 bg-gray-100 px-2 py-1 rounded-full text-xs">
            <AlertCircle size={14} className="mr-1" />
            Pendente
          </span>
        );
      default:
        return (
          <span className="flex items-center text-gray-700 bg-gray-100 px-2 py-1 rounded-full text-xs">
            {status}
          </span>
        );
    }
  };

  // Buscar nome da localização
  const getLocationName = (locationId: string) => {
    const location = localizacoes.find(loc => loc.id === locationId);
    return location?.nome || locationId;
  };

  // Buscar nome do setor/ala
  const getSectorName = (sectorId: string) => {
    const ala = alas.find(a => a.id === sectorId);
    return ala?.nome || sectorId;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Checklists de Materiais</h1>
        <div className="flex items-center gap-2">
          <OfflineIndicator 
            isOffline={isOffline} 
            syncing={syncing} 
            syncStatus={syncStatus}
            onSync={syncOfflineData}
          />
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            disabled={loading || syncing}
          >
            <Plus size={18} className="mr-1" />
            Novo Checklist
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar checklists..."
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
                value={filterStatus || ''}
                onChange={(e) => setFilterStatus(e.target.value || null)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="parcial">Parcial</option>
                <option value="concluido">Concluído</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de novo checklist */}
      {showForm && (
        <div className="mb-6">
          <ChecklistForm
            onSubmit={handleCreateChecklist}
            onCancel={() => setShowForm(false)}
            localizacoes={localizacoes}
            alas={alas}
          />
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Lista de checklists */}
      {loading || loadingMeta ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredChecklists.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredChecklists.map((checklist) => (
            <div key={checklist.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <FileText size={20} className="text-blue-600 mr-2" />
                  <h3 className="font-semibold text-lg">
                    {new Date(checklist.data).toLocaleDateString('pt-BR')}
                  </h3>
                </div>
                {renderStatus(checklist.status)}
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Localização:</span>{' '}
                  <span className="font-medium">{getLocationName(checklist.location_id)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Setor:</span>{' '}
                  <span className="font-medium">{getSectorName(checklist.setor_id)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Responsável:</span>{' '}
                  <span className="font-medium">{checklist.responsavel}</span>
                </div>
                {checklist.observacoes && (
                  <div className="text-sm">
                    <span className="text-gray-500">Observações:</span>{' '}
                    <span className="italic">{checklist.observacoes}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      checklist.porcentagem === 100
                        ? 'bg-green-600'
                        : checklist.porcentagem > 50
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${checklist.porcentagem}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium">{checklist.porcentagem}%</span>
              </div>

              <div className="mt-4">
                <a
                  href={`/checklist/${checklist.id}`}
                  className="block w-full text-center py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
                >
                  Ver detalhes
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <h3 className="text-xl font-medium text-gray-600 mb-2">Nenhum checklist encontrado</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus 
              ? 'Tente ajustar seus filtros de busca'
              : 'Clique no botão "Novo Checklist" para começar'}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center"
          >
            <Plus size={18} className="mr-1" />
            Criar checklist
          </button>
        </div>
      )}
    </div>
  );
};

export default ChecklistPage; 
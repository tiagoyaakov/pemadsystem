import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import { Check, Clock, AlertTriangle } from 'lucide-react';
import { Checklist } from '@/lib/supabase';

interface ExtendedChecklist extends Checklist {
  location_name?: string;
  setor_name?: string;
}

const RecentChecklists: React.FC = () => {
  const [checklists, setChecklists] = useState<ExtendedChecklist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRecentChecklists = async () => {
      try {
        setLoading(true);
        
        // Buscar checklists recentes
        const { data, error: checklistError } = await supabase
          .from('checklists')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (checklistError) throw checklistError;
        
        if (!data || data.length === 0) {
          setChecklists([]);
          return;
        }

        // Array para armazenar checklists estendidos com nomes
        const extendedChecklists: ExtendedChecklist[] = [...data];
        
        // Buscar nomes das localizações
        const locationIds = [...new Set(data.map(c => c.location_id))];
        const { data: locations, error: locationError } = await supabase
          .from('checklist_locations')
          .select('id, nome')
          .in('id', locationIds);
        
        if (locationError) throw locationError;
        
        // Buscar nomes dos setores
        const sectorIds = [...new Set(data.map(c => c.setor_id))];
        const { data: sectors, error: sectorError } = await supabase
          .from('alas')
          .select('id, nome')
          .in('id', sectorIds);
        
        if (sectorError) throw sectorError;
        
        // Adicionar nomes às checklists
        extendedChecklists.forEach(checklist => {
          const location = locations?.find(l => l.id === checklist.location_id);
          const sector = sectors?.find(s => s.id === checklist.setor_id);
          
          checklist.location_name = location?.nome || 'Localização não encontrada';
          checklist.setor_name = sector?.nome || 'Setor não encontrado';
        });
        
        setChecklists(extendedChecklists);
      } catch (err) {
        console.error('Erro ao buscar checklists recentes:', err);
        setError('Não foi possível carregar os checklists recentes.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentChecklists();
  }, []);

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Check className="text-green-500" size={18} />;
      case 'parcial':
        return <Clock className="text-amber-500" size={18} />;
      case 'pendente':
        return <AlertTriangle className="text-red-500" size={18} />;
      default:
        return null;
    }
  };

  const handleRowClick = (id: string) => {
    router.push(`/checklist/${id}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Checklists Recentes</h2>
        </div>
        <div className="divide-y divide-gray-200 animate-pulse">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Checklists Recentes</h2>
        </div>
        <div className="p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Checklists Recentes</h2>
      </div>
      
      {checklists.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          Nenhum checklist encontrado.
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {checklists.map((checklist) => (
            <div 
              key={checklist.id}
              onClick={() => handleRowClick(checklist.id)}
              className="p-4 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-800">
                    Checklist: {new Date(checklist.data).toLocaleDateString('pt-BR')}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {checklist.location_name} - {checklist.setor_name}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Responsável: {checklist.responsavel}
                  </p>
                </div>
                <div className="flex items-center">
                  {renderStatusIcon(checklist.status)}
                  <span className="ml-1 text-sm text-gray-600">
                    {checklist.porcentagem}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="p-4 border-t">
        <button
          onClick={() => router.push('/checklists')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Ver todos os checklists
        </button>
      </div>
    </div>
  );
};

export default RecentChecklists; 
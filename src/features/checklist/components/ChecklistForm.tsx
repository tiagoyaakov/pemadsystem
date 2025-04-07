import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Database } from '@/types/supabase-types';
import { useChecklist } from '../hooks/useChecklist';
import OfflineIndicator from './OfflineIndicator';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Usar tipos gerados pelo Supabase
type ChecklistInsert = Database['public']['Tables']['checklists']['Insert'];
type ChecklistRow = Database['public']['Tables']['checklists']['Row'];
// Assumindo que Ala e Localizacao também vêm de supabase-types
type Ala = Database['public']['Tables']['alas']['Row']; 
// Verifique o nome real da tabela para localizacoes
type Localizacao = Database['public']['Tables']['checklist_locations']['Row']; 

interface ChecklistFormProps {
  initialData?: Partial<ChecklistRow>;
  onSubmit: (data: ChecklistInsert) => Promise<void>;
  onCancel: () => void;
  localizacoes: Localizacao[];
  alas: Ala[];
}

const ChecklistForm: React.FC<ChecklistFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  localizacoes,
  alas
}) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ChecklistInsert>();
  const [localLoading, setLocalLoading] = useState(false);
  const { user } = useAuth();
  const { isOffline } = useChecklist();
  
  const watchAlaId = watch('ala_id');
  
  // Filtrar localizações com base na ala selecionada
  const filteredLocalizacoes = watchAlaId
    ? localizacoes.filter(loc => loc.ala_id === watchAlaId)
    : localizacoes;

  useEffect(() => {
    if (initialData) {
      // Preencher o formulário com dados iniciais
      (Object.keys(initialData) as Array<keyof ChecklistRow>).forEach((key) => {
        const value = initialData[key];
        if (value !== undefined && value !== null && setValue && typeof setValue === 'function') {
          try {
            setValue(key as keyof ChecklistInsert, value as any);
          } catch (e) {
            console.warn(`Could not set value for key: ${key}`);
          }
        }
      });
    } else {
      // Valores padrão para novo checklist
      setValue('user_id', user?.id || '');
      setValue('data', new Date().toISOString().split('T')[0]);
      setValue('status', 'pendente');
      setValue('porcentagem', 0);
      setValue('finalizada', false);
    }
  }, [initialData, setValue, user]);

  const processSubmit = async (formData: ChecklistInsert) => {
    try {
      setLocalLoading(true);
      const dataToSubmit: ChecklistInsert = {
        ...formData,
        user_id: formData.user_id || user?.id || '',
        data: formData.data || new Date().toISOString().split('T')[0],
        ala_id: formData.ala_id || '',
        location_id: formData.location_id || '',
        status: formData.status || 'pendente',
        porcentagem: formData.porcentagem ?? 0,
        finalizada: formData.finalizada ?? false,
      };
      
      if (!dataToSubmit.ala_id) throw new Error("Ala é obrigatória.");
      if (!dataToSubmit.location_id) throw new Error("Localização é obrigatória.");
      if (!dataToSubmit.user_id) throw new Error("Usuário não identificado.");
      
      delete dataToSubmit.id;
      
      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {initialData?.id ? 'Editar Checklist' : 'Novo Checklist'}
        </h2>
        <OfflineIndicator isOffline={isOffline} />
      </div>
      
      <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data do Checklist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data
            </label>
            <input
              type="date"
              {...register('data', { required: 'Data é obrigatória' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.data && (
              <p className="mt-1 text-sm text-red-600">{errors.data.message}</p>
            )}
          </div>

          {/* Setor/Ala */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ala
            </label>
            <select
              {...register('ala_id', { required: 'Ala é obrigatória' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma ala</option>
              {alas.map((ala) => (
                <option key={ala.id} value={ala.id}>
                  {ala.nome}
                </option>
              ))}
            </select>
            {errors.ala_id && (
              <p className="mt-1 text-sm text-red-600">{errors.ala_id.message}</p>
            )}
          </div>

          {/* Localização */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localização
            </label>
            <select
              {...register('location_id', { required: 'Localização é obrigatória' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!watchAlaId}
            >
              <option value="">Selecione uma localização</option>
              {filteredLocalizacoes.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.nome}
                </option>
              ))}
            </select>
            {errors.location_id && (
              <p className="mt-1 text-sm text-red-600">{errors.location_id.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              {...register('observacoes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observações sobre a conferência (opcional)"
            ></textarea>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            disabled={localLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={localLoading}
          >
            {localLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </span>
            ) : (
              'Salvar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChecklistForm; 
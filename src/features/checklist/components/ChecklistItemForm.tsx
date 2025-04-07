import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ChecklistItem, Material } from '@/lib/supabase';

interface ChecklistItemFormProps {
  checklistId: string;
  materials: Material[];
  onSubmit: (data: Omit<ChecklistItem, 'id'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<ChecklistItem>;
  isOffline?: boolean;
}

const ChecklistItemForm: React.FC<ChecklistItemFormProps> = ({
  checklistId,
  materials,
  onSubmit,
  onCancel,
  initialData,
  isOffline = false
}) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<Omit<ChecklistItem, 'id'>>();
  const [loading, setLoading] = useState(false);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>(materials);
  const [searchTerm, setSearchTerm] = useState('');

  // Inicializar formulário
  useEffect(() => {
    if (initialData) {
      // Preencher o formulário com dados iniciais
      Object.entries(initialData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setValue(key as any, value);
        }
      });
    } else {
      // Valores padrão para novo item
      setValue('checklist_id', checklistId);
      setValue('conferido', false);
    }
  }, [initialData, setValue, checklistId]);

  // Filtrar materiais quando o termo de busca mudar
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMaterials(materials);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = materials.filter(
      material => 
        material.nome.toLowerCase().includes(term) || 
        material.codigo.toLowerCase().includes(term) ||
        (material.descricao && material.descricao.toLowerCase().includes(term))
    );
    
    setFilteredMaterials(filtered);
  }, [searchTerm, materials]);

  const handleFormSubmit = async (data: Omit<ChecklistItem, 'id'>) => {
    try {
      setLoading(true);
      await onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao salvar item de checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {initialData?.id ? 'Editar Item' : 'Adicionar Item ao Checklist'}
        </h2>
        {isOffline && (
          <span className="inline-flex items-center bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs">
            Modo Offline
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Campo de busca de materiais */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar Material
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite para buscar por nome ou código..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Seleção de material */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Material
          </label>
          <select
            {...register('material_id', { required: 'Material é obrigatório' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um material</option>
            {filteredMaterials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.nome} - {material.codigo}
              </option>
            ))}
          </select>
          {errors.material_id && (
            <p className="mt-1 text-sm text-red-600">{errors.material_id.message}</p>
          )}
          {filteredMaterials.length === 0 && (
            <p className="mt-1 text-sm text-amber-600">Nenhum material encontrado com esse termo de busca</p>
          )}
        </div>

        {/* Status (conferido) */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="conferido"
            {...register('conferido')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="conferido" className="ml-2 block text-sm text-gray-700">
            Material já conferido
          </label>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            {...register('observacoes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observações sobre este item (opcional)"
          ></textarea>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? (
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

        {/* Campo oculto para checklist_id */}
        <input type="hidden" {...register('checklist_id')} />
      </form>
    </div>
  );
};

export default ChecklistItemForm; 
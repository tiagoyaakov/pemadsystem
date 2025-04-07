import React from 'react';
import { Material } from '@/lib/supabase';
import { Shield, AlertTriangle, Wrench } from 'lucide-react';

interface MaterialDisplayProps {
  material: Material;
  compact?: boolean;
  showActions?: boolean;
}

const MaterialDisplay: React.FC<MaterialDisplayProps> = ({
  material,
  compact = false,
  showActions = false
}) => {
  // Renderizar status do material com ícone
  const renderStatus = () => {
    switch (material.status) {
      case 'ativo':
        return (
          <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            <Shield size={12} className="mr-1" />
            Ativo
          </span>
        );
      case 'inativo':
        return (
          <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
            <AlertTriangle size={12} className="mr-1" />
            Inativo
          </span>
        );
      case 'manutencao':
        return (
          <span className="inline-flex items-center bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
            <Wrench size={12} className="mr-1" />
            Manutenção
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
            {material.status}
          </span>
        );
    }
  };

  // Versão compacta (para listas densas)
  if (compact) {
    return (
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium text-gray-800">{material.nome}</h3>
          <p className="text-gray-500 text-xs">Código: {material.codigo}</p>
        </div>
        {renderStatus()}
      </div>
    );
  }

  // Versão completa (para visualização detalhada)
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-800 text-lg">{material.nome}</h3>
        {renderStatus()}
      </div>
      
      <div className="space-y-2">
        <p className="text-gray-600">
          <span className="font-medium">Código:</span> {material.codigo}
        </p>
        
        {material.descricao && (
          <p className="text-gray-600">
            <span className="font-medium">Descrição:</span> {material.descricao}
          </p>
        )}
        
        <p className="text-gray-600">
          <span className="font-medium">Localização:</span> {material.location_id}
        </p>
      </div>
      
      {showActions && (
        <div className="mt-4 flex space-x-2">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
            Editar
          </button>
          {material.status === 'ativo' && (
            <button className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm">
              Manutenção
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialDisplay; 
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import { Material } from '@/lib/supabase';
import { AlertTriangle } from 'lucide-react';

const LowStockMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchLowStockMaterials = async () => {
      try {
        setLoading(true);
        
        // Buscar materiais com estoque baixo
        // Nota: Isso requer que você tenha uma coluna 'quantidade' e 'quantidade_minima' no seu modelo Material
        const { data, error: materialsError } = await supabase
          .from('materials')
          .select('*')
          .lt('quantidade', 'quantidade_minima')
          .order('quantidade', { ascending: true })
          .limit(5);
        
        if (materialsError) throw materialsError;
        
        setMaterials(data || []);
      } catch (err) {
        console.error('Erro ao buscar materiais com estoque baixo:', err);
        setError('Não foi possível carregar os materiais com estoque baixo.');
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockMaterials();
  }, []);

  const handleMaterialClick = (id: string) => {
    router.push(`/dashboard/materiais/${id}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Materiais com Estoque Baixo</h2>
        </div>
        <div className="p-4 animate-pulse">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="mb-3">
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
          <h2 className="text-lg font-semibold text-gray-800">Materiais com Estoque Baixo</h2>
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
        <h2 className="text-lg font-semibold text-gray-800">Materiais com Estoque Baixo</h2>
      </div>
      
      {materials.length === 0 ? (
        <div className="p-8 text-center text-green-600">
          <p className="mb-2 font-medium">Todos os materiais estão em estoque adequado</p>
          <p className="text-sm text-gray-500">Nenhum material precisa de reposição no momento</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {materials.map((material) => (
            <div 
              key={material.id}
              onClick={() => handleMaterialClick(material.id)}
              className="p-4 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-800">{material.nome}</h3>
                  <p className="text-gray-500 text-sm">Código: {material.codigo}</p>
                </div>
                <div className="flex items-center bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                  <AlertTriangle className="mr-1" size={12} />
                  <span>
                    {material.quantidade} / {material.quantidade_minima}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {materials.length > 0 && (
        <div className="p-4 border-t">
          <button
            onClick={() => router.push('/dashboard/materiais?filter=baixo_estoque')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ver todos os materiais com estoque baixo
          </button>
        </div>
      )}
    </div>
  );
};

export default LowStockMaterials; 
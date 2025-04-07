import { FC } from 'react';
import { useFires } from '../hooks/useFires';

interface FireStatsProps {
  days?: number;
}

export const FireStats: FC<FireStatsProps> = ({ days = 3 }) => {
  const { fires, loading, error, isOfflineData } = useFires({ days });

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-gray-500">Carregando estatísticas de incêndios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg shadow border border-red-200">
        <p className="text-red-600">Erro ao carregar estatísticas: {error.message}</p>
      </div>
    );
  }

  // Calcular estatísticas
  const totalFires = fires.length;
  
  // Agrupar por nível de confiança
  const highConfidence = fires.filter(fire => 
    parseInt(fire.confidence.toString()) >= 80
  ).length;
  
  const mediumConfidence = fires.filter(fire => 
    parseInt(fire.confidence.toString()) >= 50 && 
    parseInt(fire.confidence.toString()) < 80
  ).length;
  
  const lowConfidence = fires.filter(fire => 
    parseInt(fire.confidence.toString()) < 50
  ).length;
  
  // Agrupar por período do dia
  const dayFires = fires.filter(fire => fire.daynight === 'D').length;
  const nightFires = fires.filter(fire => fire.daynight === 'N').length;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Estatísticas de Incêndios
        </h3>
        
        {isOfflineData && (
          <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded">
            Dados Offline
          </span>
        )}
      </div>
      
      {totalFires === 0 ? (
        <p className="text-gray-500">Nenhum incêndio detectado nos últimos {days} dias.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800 mb-1">Total de Incêndios</p>
              <p className="text-2xl font-bold text-blue-600">{totalFires}</p>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-md">
              <p className="text-sm text-orange-800 mb-1">Últimos {days} dias</p>
              <div className="flex justify-between">
                <div>
                  <span className="text-xs text-orange-600">Dia: </span>
                  <span className="font-semibold">{dayFires}</span>
                </div>
                <div>
                  <span className="text-xs text-orange-600">Noite: </span>
                  <span className="font-semibold">{nightFires}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Nível de Confiança</p>
            <div className="flex items-center mb-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(highConfidence / totalFires) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 ml-2">{highConfidence} alta</span>
            </div>
            
            <div className="flex items-center mb-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${(mediumConfidence / totalFires) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 ml-2">{mediumConfidence} média</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${(lowConfidence / totalFires) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 ml-2">{lowConfidence} baixa</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-500">
            Dados dos últimos {days} dias. {isOfflineData ? 'Usando cache offline.' : ''}
          </p>
        </>
      )}
    </div>
  );
}; 
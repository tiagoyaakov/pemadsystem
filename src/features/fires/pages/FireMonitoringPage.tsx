import React, { useState, useEffect } from 'react';
import { FireOfflineService } from '../services/data';
import { FireStatus } from '../components/FireStatus';
import FireMap from '../components/FireMap';
import { FireExportButtons } from '../components/ExportButtons';
import { MapPin, Calendar, Filter, RefreshCw, Save, Map, HelpCircle, Info } from 'lucide-react';
import { FireIncident } from '@/lib/supabase';

// Interface para os filtros de busca
interface FireFilters {
  startDate: string;
  endDate: string;
  minLatitude: number;
  minLongitude: number;
  maxLatitude: number;
  maxLongitude: number;
  regionName?: string;
}

/**
 * Página de monitoramento de focos de incêndio
 * Com suporte a dados offline
 */
export default function FireMonitoringPage() {
  // Estados para armazenar dados e estado da UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fires, setFires] = useState<FireIncident[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [showAvenzaHelp, setShowAvenzaHelp] = useState(false);
  
  // Estado para os filtros
  const [filters, setFilters] = useState<FireFilters>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias atrás
    endDate: new Date().toISOString().split('T')[0], // Hoje
    minLatitude: -23.5, // Valores default para o Brasil
    minLongitude: -47.5,
    maxLatitude: -21.5,
    maxLongitude: -45.5,
    regionName: 'Brasil Central'
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadFireData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função para carregar dados de incêndio
  const loadFireData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Tentar buscar dados atualizados se estiver online
      if (navigator.onLine) {
        const fireData = await FireOfflineService.fetchAndSaveLocalFires(filters);
        setFires(fireData);
      } else {
        // Se estiver offline, usar dados locais
        const fireData = await FireOfflineService.getLocalFires(
          filters.startDate,
          filters.endDate
        );
        setFires(fireData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de incêndio:', error);
      setError('Falha ao carregar dados de incêndio');
      
      // Tentar buscar dados do cache local em caso de erro
      try {
        const cachedData = await FireOfflineService.getLocalFires();
        if (cachedData.length > 0) {
          setFires(cachedData);
          setError('Usando dados em cache devido a erro de conexão');
        }
      } catch (cacheError) {
        console.error('Erro ao buscar cache:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Atualizar filtros
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFilters(prev => ({
      ...prev,
      [name]: name.includes('Latitude') || name.includes('Longitude') 
        ? parseFloat(value) 
        : value
    }));
  };

  // Aplicar filtros
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    loadFireData();
    setShowFilters(false);
  };

  // Calculando intervalos de confiança para coloração
  const getConfidenceColor = (confidence: number | string): string => {
    const confidenceValue = typeof confidence === 'string' 
      ? parseInt(confidence, 10) 
      : confidence;
    
    if (confidenceValue >= 80) return 'bg-green-100 text-green-800';
    if (confidenceValue >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Renderização condicional do mapa ou lista
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2">Carregando dados...</span>
        </div>
      );
    }

    if (error && fires.length === 0) {
      return (
        <div className="text-center p-4 bg-red-50 rounded-md text-red-700">
          <p className="font-medium">{error}</p>
          <button 
            onClick={loadFireData}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    if (fires.length === 0) {
      return (
        <div className="text-center p-4 bg-gray-50 rounded-md">
          <p className="text-gray-700">Nenhum foco de incêndio encontrado para o período e região selecionados.</p>
        </div>
      );
    }

    return (
      <div>
        {showMap ? (
          <FireMap
            fires={fires}
            height="600px"
          />
        ) : (
          <div className="mt-4">
            <h3 className="font-medium text-lg mb-2">Focos de Incêndio ({fires.length})</h3>
            <div className="overflow-auto max-h-96 border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coordenadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confiança
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satélite
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fires.map((fire) => {
                    const confidenceValue = typeof fire.confidence === 'string'
                      ? parseInt(fire.confidence, 10)
                      : fire.confidence;
                    
                    return (
                      <tr key={fire.id || `${fire.latitude}-${fire.longitude}-${fire.acq_date}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {typeof fire.acq_date === 'string' 
                              ? new Date(fire.acq_date).toLocaleDateString('pt-BR') 
                              : new Date(fire.acq_date).toLocaleDateString('pt-BR')}
                            {fire.acq_time ? 
                              ` ${fire.acq_time.substring(0, 2)}:${fire.acq_time.substring(2, 4)}` : 
                              ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-red-500" />
                            {fire.latitude.toFixed(4)}, {fire.longitude.toFixed(4)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(fire.confidence)}`}>
                            {typeof fire.confidence === 'string'
                              ? fire.confidence
                              : `${fire.confidence.toFixed(0)}%`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {fire.satellite || 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderização do formulário de filtros
  const renderFilters = () => {
    if (!showFilters) return null;
    
    return (
      <form 
        onSubmit={handleApplyFilters} 
        className="mt-4 p-4 bg-gray-50 rounded-md border space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Inicial</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Final</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nome da Região</label>
          <input
            type="text"
            name="regionName"
            value={filters.regionName || ''}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Ex: Brasil Central"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude Mínima</label>
            <input
              type="number"
              step="0.0001"
              name="minLatitude"
              value={filters.minLatitude}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude Máxima</label>
            <input
              type="number"
              step="0.0001"
              name="maxLatitude"
              value={filters.maxLatitude}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude Mínima</label>
            <input
              type="number"
              step="0.0001"
              name="minLongitude"
              value={filters.minLongitude}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude Máxima</label>
            <input
              type="number"
              step="0.0001"
              name="maxLongitude"
              value={filters.maxLongitude}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setShowFilters(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Aplicar Filtros
          </button>
        </div>
      </form>
    );
  };

  // Renderizar ajuda para Avenza Maps
  const renderAvenzaHelp = () => {
    if (!showAvenzaHelp) return null;
    
    return (
      <div className="my-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <Info className="text-blue-500 mt-1 mr-3 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-lg font-medium text-blue-800 mb-2">Como utilizar com Avenza Maps</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                Os focos de incêndio podem ser visualizados no aplicativo Avenza Maps, muito útil para operações em campo com ou sem conexão com a internet.
              </p>
              
              <ol className="list-decimal ml-5 space-y-1">
                <li>Exporte os dados no formato <strong>GeoJSON</strong> ou <strong>KML</strong> clicando nos botões acima</li>
                <li>Instale o aplicativo Avenza Maps no seu dispositivo móvel (disponível para Android e iOS)</li>
                <li>Importe o arquivo exportado para o Avenza Maps usando uma das seguintes opções:
                  <ul className="list-disc ml-5 mt-1">
                    <li>Envie o arquivo por email e abra-o com o Avenza Maps</li>
                    <li>Transfira via USB ou serviço de nuvem como Google Drive</li>
                    <li>Compartilhe diretamente da aplicação web para o dispositivo</li>
                  </ul>
                </li>
                <li>No Avenza Maps, os pontos de foco de incêndio aparecerão sobre o mapa base</li>
                <li>Você pode navegar offline e receber alertas de proximidade aos focos de incêndio</li>
              </ol>
              
              <p className="pt-2">
                <strong>Nota:</strong> O formato GeoJSON é mais leve e flexível, enquanto o KML oferece melhor estilização visual dos pontos de foco de incêndio.
              </p>
            </div>
            
            <button 
              onClick={() => setShowAvenzaHelp(false)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Monitoramento de Focos de Incêndio</h1>
          
          <div className="mt-4 md:mt-0">
            <FireStatus 
              className="mb-4 md:mb-0 p-3 bg-white border rounded-md shadow-sm"
              onSync={loadFireData}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-400 text-red-700">
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4 justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Ocultar Filtros' : 'Filtros'}
            </button>
            
            <button
              onClick={loadFireData}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            
            <button
              onClick={() => setShowMap(!showMap)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {showMap ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Ver Lista
                </>
              ) : (
                <>
                  <Map className="mr-2 h-4 w-4" />
                  Ver Mapa
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowAvenzaHelp(!showAvenzaHelp)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              {showAvenzaHelp ? 'Ocultar Ajuda' : 'Uso com Avenza Maps'}
            </button>
          </div>
          
          {/* Botões de exportação */}
          {fires.length > 0 && (
            <FireExportButtons
              fires={fires}
              filters={{
                startDate: filters.startDate,
                endDate: filters.endDate,
                regionName: filters.regionName
              }}
            />
          )}
        </div>
        
        {renderAvenzaHelp()}
        {renderFilters()}
        {renderContent()}
      </div>
    </div>
  );
} 
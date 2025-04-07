import React, { useState } from 'react';
import FireMap from '@/features/fires/components/FireMap';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/router';
import { Calendar, Search, ArrowLeft } from 'lucide-react';

export default function MapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias atrás
    endDate: new Date().toISOString().split('T')[0] // hoje
  });

  // Redirecionar para a página de login se não estiver autenticado
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Mostrar loading enquanto verifica autenticação
  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // O mapa será atualizado automaticamente pelos props
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft size={20} className="mr-1" />
          Voltar para o dashboard
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mapa de Focos de Incêndio</h1>
        <p className="text-gray-600 mb-6">
          Visualize e monitore focos de incêndio na região de interesse.
        </p>
      </div>

      {/* Filtros de data */}
      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Calendar size={16} className="text-gray-500 mr-1" />
                <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                  Data Inicial
                </label>
              </div>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Calendar size={16} className="text-gray-500 mr-1" />
                <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                  Data Final
                </label>
              </div>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="self-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <Search size={18} className="mr-1" />
                Buscar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mapa */}
      <div className="mb-6">
        <FireMap 
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          height="700px"
        />
      </div>

      {/* Legenda e informações */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sobre os Dados</h2>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Os dados de focos de incêndio são obtidos através do sistema FIRMS (Fire Information for Resource Management System) da NASA,
            que utiliza sensores de satélite para detectar anomalias térmicas na superfície terrestre.
          </p>
          
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Como interpretar:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Cada marcador representa um ponto onde foi detectada uma anomalia térmica.</li>
              <li>A confiança indica a probabilidade do ponto ser realmente um incêndio ativo.</li>
              <li>Pontos podem representar incêndios, queimadas controladas ou outras fontes de calor.</li>
              <li>A detecção noturna geralmente tem maior precisão devido ao contraste térmico.</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Limitações:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Nuvens podem obstruir a detecção de focos de incêndio.</li>
              <li>Incêndios muito pequenos ou de baixa intensidade podem não ser detectados.</li>
              <li>Algumas fontes de calor como atividades industriais podem ser erroneamente classificadas como incêndios.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
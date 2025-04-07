import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { FireMap } from '@/features/fires/components/FireMap';
import { FireStats } from '@/features/fires/components/FireStats';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import Head from 'next/head';

export default function FiresPage() {
  const { user, loading: authLoading } = useAuth();
  const [distance, setDistance] = useState(100);
  const [days, setDays] = useState(7);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cbmmg-gray-100">
        <div className="animate-pulse text-cbmmg-red">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Monitoramento de Incêndios - PEMAD Material Check</title>
      </Head>

      <main className="min-h-screen bg-cbmmg-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-cbmmg-gray-900">Monitoramento de Incêndios</h1>
            <p className="text-cbmmg-gray-600">
              Monitoramento em tempo real de incêndios próximos à base usando dados da NASA FIRMS
            </p>
          </div>

          <div className="mb-6">
            <div className="bg-white p-4 rounded shadow">
              <div className="flex flex-wrap items-center justify-between mb-4">
                <div className="space-y-1 mb-4 md:mb-0">
                  <h2 className="font-semibold text-lg">Configurações de visualização</h2>
                  <p className="text-sm text-gray-500">
                    Ajuste os parâmetros para visualizar os dados conforme necessário
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Raio de busca (km)
                    </label>
                    <select
                      value={distance}
                      onChange={(e) => setDistance(Number(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cbmmg-red focus:border-cbmmg-red sm:text-sm"
                    >
                      <option value={10}>10 km</option>
                      <option value={25}>25 km</option>
                      <option value={50}>50 km</option>
                      <option value={100}>100 km</option>
                      <option value={200}>200 km</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Período (dias)
                    </label>
                    <select
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cbmmg-red focus:border-cbmmg-red sm:text-sm"
                    >
                      <option value={1}>1 dia</option>
                      <option value={3}>3 dias</option>
                      <option value={7}>7 dias</option>
                      <option value={14}>14 dias</option>
                      <option value={30}>30 dias</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FireMap 
                height="600px" 
                width="100%" 
                maxDistance={distance}
                days={days}
              />
            </div>
            <div>
              <FireStats days={days} />
              
              {/* Informações adicionais */}
              <div className="mt-6 bg-white rounded shadow p-4">
                <h3 className="font-semibold mb-2">Sobre o monitoramento</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Este sistema utiliza dados da NASA FIRMS (Fire Information for Resource Management System) para monitorar incêndios ativos na região.
                </p>
                <h4 className="font-medium text-sm mb-1">Legenda:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                    Confiança baixa (&lt;60%)
                  </li>
                  <li className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
                    Confiança média (60-80%)
                  </li>
                  <li className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                    Confiança alta (&gt;80%)
                  </li>
                </ul>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="font-medium text-sm mb-1">Fontes de dados:</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>VIIRS (Visible Infrared Imaging Radiometer Suite)</li>
                    <li>MODIS (Moderate Resolution Imaging Spectroradiometer)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Seção somente para usuários com permissão de chefe ou superior */}
          <RoleGuard requiredRole="chefe">
            <div className="mt-8 bg-white rounded shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Ações administrativas</h2>
              <p className="mb-4 text-sm text-gray-600">
                Esta seção está disponível apenas para usuários com nível de acesso de chefe ou superior.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="p-4 border rounded shadow-sm hover:bg-cbmmg-gray-50 transition">
                  <h3 className="font-medium">Enviar alerta</h3>
                  <p className="text-sm text-gray-500">Notificar equipe sobre incêndios críticos</p>
                </button>
                
                <button className="p-4 border rounded shadow-sm hover:bg-cbmmg-gray-50 transition">
                  <h3 className="font-medium">Gerar relatório</h3>
                  <p className="text-sm text-gray-500">Exportar dados de incêndios para análise</p>
                </button>
                
                <button className="p-4 border rounded shadow-sm hover:bg-cbmmg-gray-50 transition">
                  <h3 className="font-medium">Configurar alertas</h3>
                  <p className="text-sm text-gray-500">Definir parâmetros para alertas automáticos</p>
                </button>
              </div>
            </div>
          </RoleGuard>
        </div>
      </main>
    </>
  );
} 
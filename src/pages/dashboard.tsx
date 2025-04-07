import React from 'react';
import DashboardStats from '@/features/dashboard/components/DashboardStats';
import RecentChecklists from '@/features/dashboard/components/RecentChecklists';
import LowStockMaterials from '@/features/dashboard/components/LowStockMaterials';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/router';
import { Gauge, ListChecks, Map, Bell } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">
          Bem-vindo, {user.nome || user.email}. Confira o status dos seus checklists.
        </p>
      </div>

      <div className="mb-10">
        <DashboardStats />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentChecklists />
          <LowStockMaterials />
        </div>

        <div className="space-y-6">
          {/* Links rápidos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Acesso Rápido</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/checklists')}
                className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex flex-col items-center text-center"
              >
                <ListChecks size={24} className="text-blue-600 mb-2" />
                <span className="text-sm text-gray-700">Checklists</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/materiais')}
                className="bg-green-50 hover:bg-green-100 p-4 rounded-lg flex flex-col items-center text-center"
              >
                <Gauge size={24} className="text-green-600 mb-2" />
                <span className="text-sm text-gray-700">Materiais</span>
              </button>
              <button
                onClick={() => router.push('/map')}
                className="bg-amber-50 hover:bg-amber-100 p-4 rounded-lg flex flex-col items-center text-center"
              >
                <Map size={24} className="text-amber-600 mb-2" />
                <span className="text-sm text-gray-700">Mapa</span>
              </button>
              <button
                onClick={() => router.push('/notificacoes')}
                className="bg-indigo-50 hover:bg-indigo-100 p-4 rounded-lg flex flex-col items-center text-center"
              >
                <Bell size={24} className="text-indigo-600 mb-2" />
                <span className="text-sm text-gray-700">Notificações</span>
              </button>
            </div>
          </div>

          {/* Informações do sistema */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Informações do Sistema</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Versão</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="text-green-600 font-medium">Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Último login</span>
                <span className="font-medium">
                  {user.last_login 
                    ? new Date(user.last_login).toLocaleString('pt-BR') 
                    : 'Não disponível'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Período ativo</span>
                <span className="font-medium">Indefinido</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
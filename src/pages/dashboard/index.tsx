import { useEffect } from 'react';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FireStats } from '@/features/fires/components/FireStats';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cbmmg-gray-100">
        <div className="animate-pulse text-cbmmg-red">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Evitar renderização desnecessária durante redirecionamento
  }

  return (
    <>
      <Head>
        <title>Dashboard - PEMAD Material Check</title>
      </Head>

      <main className="min-h-screen bg-cbmmg-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-cbmmg-gray-900">Dashboard</h1>
            <p className="text-cbmmg-gray-600">
              Bem-vindo, {user.nome_guerra || user.nome || 'Usuário'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Conferência de materiais</h2>
              <p className="text-gray-600 mb-4">
                Visualize e gerencie as conferências de materiais do PEMAD.
              </p>
              <div className="space-y-2">
                <Link href="/dashboard/checklists" className="block w-full">
                  <button className="w-full bg-cbmmg-red hover:bg-cbmmg-red-dark text-white py-2 px-4 rounded">
                    Ver conferências
                  </button>
                </Link>
                <Link href="/dashboard/checklists/new" className="block w-full">
                  <button className="w-full bg-white hover:bg-gray-50 text-cbmmg-red border border-cbmmg-red py-2 px-4 rounded">
                    Nova conferência
                  </button>
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Monitoramento de incêndios</h2>
              <p className="text-gray-600 mb-4">
                Acesse o mapa de monitoramento de incêndios via NASA FIRMS.
              </p>
              <Link href="/dashboard/fires" className="block w-full">
                <button className="w-full bg-cbmmg-red hover:bg-cbmmg-red-dark text-white py-2 px-4 rounded">
                  Ver mapa de incêndios
                </button>
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Relatórios</h2>
              <p className="text-gray-600 mb-4">
                Acesse relatórios e estatísticas do sistema.
              </p>
              <Link href="/dashboard/reports" className="block w-full">
                <button className="w-full bg-cbmmg-red hover:bg-cbmmg-red-dark text-white py-2 px-4 rounded">
                  Ver relatórios
                </button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 bg-cbmmg-red text-white">
                  <h2 className="font-semibold text-lg">Conferências recentes</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <p className="text-center py-8 text-gray-500">
                      Nenhuma conferência realizada recentemente.
                    </p>
                    {/* Aqui entraria a lista de conferências recentes quando implementado */}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 bg-cbmmg-red text-white">
                  <h2 className="font-semibold text-lg">Atividade recente</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <p className="text-center py-8 text-gray-500">
                      Nenhuma atividade registrada recentemente.
                    </p>
                    {/* Aqui entraria a lista de atividades recentes quando implementado */}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <FireStats days={3} showDetails={false} />
              
              <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 bg-cbmmg-red text-white">
                  <h2 className="font-semibold text-lg">Links rápidos</h2>
                </div>
                <div className="p-4">
                  <ul className="space-y-2">
                    <li>
                      <Link href="/dashboard/materials" className="text-cbmmg-red hover:underline">
                        Gerenciar materiais
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard/locations" className="text-cbmmg-red hover:underline">
                        Gerenciar locais
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard/profile" className="text-cbmmg-red hover:underline">
                        Meu perfil
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard/settings" className="text-cbmmg-red hover:underline">
                        Configurações
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 
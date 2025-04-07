import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import dynamic from 'next/dynamic';
import { Loader2, CloudOff, AlertTriangle, Database, ArrowLeft } from 'lucide-react';

// Componentes carregados dinamicamente (apenas do lado do cliente)
const SyncStatus = dynamic(
  () => import('@/features/offline/components/SyncStatus'),
  { ssr: false, loading: () => <div className="p-4"><Loader2 className="animate-spin h-6 w-6 text-gray-500" /></div> }
);

// Interfaces
interface PendingOperation {
  id: string;
  tableName: string;
  operation: 'insert' | 'update' | 'delete';
  timestamp: number;
  synced: boolean;
  error?: string;
  retries?: number;
  data: any;
}

// Página de sincronização
export default function SyncPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isLoadingOperations, setIsLoadingOperations] = useState(true);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Carregar operações pendentes da fila de sincronização
  useEffect(() => {
    async function loadPendingOperations() {
      try {
        setIsLoadingOperations(true);
        
        // Importação dinâmica para evitar erro com SSR
        const { syncManager } = await import('@/lib/syncManager');
        // O SyncManager não possui um método getPendingOperations, mas possui getPendingCount.
        // Para obter as operações em si, precisaríamos de um método como `getAllPendingChanges`.
        // Assumindo que queremos exibir os detalhes das operações, vamos simular a busca,
        // pois a classe atual não expõe essa funcionalidade diretamente.
        // Em um cenário real, a classe SyncManager precisaria ser atualizada.
        
        // Simulação:
        // const operations = await syncManager.getAllPendingChanges(); 
        const dbModule = await import('idb');
        const db = await dbModule.openDB('pemad-offline-db', 1);
        const operationsFromDB = await db.getAll('pendingChanges');
        
        // Mapear para o formato esperado pela UI (PendingOperation)
        const mappedOperations: PendingOperation[] = operationsFromDB.map((op: any) => ({
          id: String(op.id), // Converter ID para string
          tableName: op.type, // Usar 'type' como 'tableName'
          operation: op.operationType || 'update', // Tentar inferir ou usar padrão
          timestamp: new Date(op.createdAt).getTime(),
          synced: false, // Itens pendentes não estão sincronizados
          data: op.data
          // error e retries não estão diretamente disponíveis na estrutura de PendingChange
        }));
        
        setPendingOperations(mappedOperations);
      } catch (error) {
        console.error('Erro ao carregar operações pendentes:', error);
      } finally {
        setIsLoadingOperations(false);
      }
    }

    if (typeof window !== 'undefined') {
      loadPendingOperations();
    }
  }, []);

  // Formatar data de timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`;
  };

  // Obter classe de cor baseada na operação
  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'insert':
        return 'text-green-600';
      case 'update':
        return 'text-blue-600';
      case 'delete':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Obter texto da operação
  const getOperationText = (operation: string) => {
    switch (operation) {
      case 'insert':
        return 'Inserção';
      case 'update':
        return 'Atualização';
      case 'delete':
        return 'Exclusão';
      default:
        return operation;
    }
  };

  // Renderizar tabela de dados de uma operação
  const renderOperationData = (data: any) => {
    return (
      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full text-xs border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left">Campo</th>
              <th className="px-2 py-1 text-left">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(data).map(([key, value]) => (
              <tr key={key} className="hover:bg-gray-50">
                <td className="px-2 py-1 font-medium">{key}</td>
                <td className="px-2 py-1 truncate max-w-xs">
                  {typeof value === 'object' 
                    ? JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '') 
                    : String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout title="Sincronização - PEMAD Material Check">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Sincronização - PEMAD Material Check">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Status de Sincronização</h1>
        <button
          onClick={() => router.back()}
          className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </button>
      </div>

      {/* Status de conectividade */}
      {!isOnline && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
          <div className="flex items-center">
            <CloudOff className="h-6 w-6 text-amber-600 mr-3" />
            <div>
              <p className="font-medium text-amber-700">Você está offline</p>
              <p className="text-amber-600 text-sm">
                Suas alterações serão sincronizadas quando a conexão for restabelecida.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Componente de status de sincronização */}
      <div className="mb-6">
        <SyncStatus showDetails={true} className="w-full" />
      </div>

      {/* Lista de operações pendentes */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 flex items-center">
            <Database className="w-5 h-5 mr-2 text-gray-600" />
            Operações Pendentes de Sincronização
          </h3>
        </div>

        {isLoadingOperations ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : pendingOperations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Nenhuma operação pendente de sincronização.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingOperations.map((operation) => (
              <div key={operation.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <span className={`font-medium ${getOperationColor(operation.operation)}`}>
                        {getOperationText(operation.operation)}
                      </span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="text-gray-600">{operation.tableName}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Criado em: {formatDate(operation.timestamp)}
                    </p>
                  </div>
                  
                  {operation.error && (
                    <div className="flex items-center text-red-500 text-sm">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Erro: {operation.retries} tentativa(s)
                    </div>
                  )}
                </div>
                
                {/* Dados da operação */}
                {operation.data && renderOperationData(operation.data)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-lg mb-2">Sobre a Sincronização</h3>
          <p className="text-gray-600 text-sm">
            A sincronização permite que você trabalhe offline e, quando sua conexão for restabelecida, 
            todas as alterações serão enviadas automaticamente para o servidor.
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium text-lg mb-2">Dicas</h3>
          <ul className="text-gray-600 text-sm space-y-2 list-disc pl-5">
            <li>Aguarde a sincronização completa antes de fechar o aplicativo.</li>
            <li>Se houver erros persistentes, tente recarregar a aplicação.</li>
            <li>Verifique sua conexão com a internet se a sincronização não estiver funcionando.</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
} 
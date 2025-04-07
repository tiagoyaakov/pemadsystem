import React, { useEffect, useState } from 'react';
import { useOffline } from '@/features/offline/contexts/OfflineContext';
import { Wifi, WifiOff, RefreshCw, Database, CheckCircle2, AlertTriangle } from 'lucide-react';

const ConnectivityStatus: React.FC = () => {
  const { 
    isOnline, 
    hasPendingChanges, 
    pendingChangesCount,
    syncStatus,
    syncProgress,
    syncError,
    startSync,
    lastSyncTime
  } = useOffline();
  
  const [showDetails, setShowDetails] = useState(false);
  const [visible, setVisible] = useState(true);
  const [exitAnimation, setExitAnimation] = useState(false);

  // Efeito para esconder o indicador após 5 segundos se estiver online e não tiver alterações pendentes
  useEffect(() => {
    if (isOnline && !hasPendingChanges && syncStatus !== 'syncing') {
      const timer = setTimeout(() => {
        setExitAnimation(true);
        setTimeout(() => setVisible(false), 300); // Duração da animação
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setExitAnimation(false);
      setVisible(true);
    }
  }, [isOnline, hasPendingChanges, syncStatus]);

  // Se não for visível, não renderize nada
  if (!visible) return null;

  // Formatação da data da última sincronização
  const formatLastSync = () => {
    if (!lastSyncTime) return 'Nunca';
    
    // Se for hoje, mostrar apenas a hora
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const syncDate = new Date(lastSyncTime);
    
    if (syncDate >= today) {
      return `Hoje às ${syncDate.getHours().toString().padStart(2, '0')}:${syncDate.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Se for ontem
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (syncDate >= yesterday) {
      return `Ontem às ${syncDate.getHours().toString().padStart(2, '0')}:${syncDate.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Caso contrário, mostrar data completa
    return syncDate.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${exitAnimation ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
    >
      {/* Botão principal de status */}
      <button 
        onClick={() => setShowDetails(!showDetails)}
        className={`p-3 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isOnline 
            ? hasPendingChanges 
              ? 'bg-amber-500 hover:bg-amber-600' 
              : 'bg-emerald-500 hover:bg-emerald-600' 
            : 'bg-red-500 hover:bg-red-600'
        }`}
      >
        {isOnline ? (
          hasPendingChanges ? (
            <Database className="h-6 w-6 text-white" />
          ) : (
            <Wifi className="h-6 w-6 text-white" />
          )
        ) : (
          <WifiOff className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Painel de detalhes */}
      {showDetails && (
        <div className="absolute bottom-14 right-0 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Status de Conectividade</h3>
          </div>
          
          <div className="p-4 space-y-3">
            {/* Status de conexão */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Status:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {/* Alterações pendentes */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Alterações pendentes:</span>
              <span className="text-sm font-medium text-gray-900">{pendingChangesCount}</span>
            </div>
            
            {/* Última sincronização */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Última sincronização:</span>
              <span className="text-sm font-medium text-gray-900">{formatLastSync()}</span>
            </div>
            
            {/* Barra de progresso (visível apenas quando sincronizando) */}
            {syncStatus === 'syncing' && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${syncProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Sincronizando... {syncProgress}%</p>
              </div>
            )}
            
            {/* Mensagem de erro */}
            {syncError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <p className="ml-2 text-xs text-red-700">{syncError}</p>
                </div>
              </div>
            )}
            
            {/* Mensagem de sucesso */}
            {syncStatus === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <p className="ml-2 text-xs text-green-700">Sincronização concluída com sucesso</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Ações de rodapé */}
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
            {isOnline && hasPendingChanges && syncStatus !== 'syncing' && (
              <button 
                onClick={() => startSync()}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Sincronizar
              </button>
            )}
            <button 
              onClick={() => setShowDetails(false)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectivityStatus; 
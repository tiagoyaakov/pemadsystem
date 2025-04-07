import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI alternativa
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Você também pode registrar o erro em um serviço de relatório de erros
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
    this.setState({
      errorInfo
    });
    
    // Aqui você poderia enviar o erro para um serviço como Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // Apenas envia em produção, não em desenvolvimento
      // sendErrorToLoggingService(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Mostra o fallback padrão
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
            <div className="flex justify-center">
              <span className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-100">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </span>
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Ocorreu um erro inesperado</h2>
              <p className="mt-2 text-gray-600">
                Desculpe, algo deu errado ao processar sua solicitação.
              </p>
            </div>
            
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto text-sm text-red-600 font-mono">
                <p className="font-bold">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                    <pre className="mt-2 text-xs whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar a página
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </button>
                
                <Link
                  href="/"
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Início
                </Link>
              </div>
            </div>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              Se o problema persistir, entre em contato com o suporte técnico.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
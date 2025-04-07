import React from 'react';
import Link from 'next/link';
import { HomeIcon, AlarmClock, RefreshCw, AlertTriangle } from 'lucide-react';
import Head from 'next/head';

export default function Custom500() {
  return (
    <>
      <Head>
        <title>Erro do Servidor | PEMAD Material Check</title>
      </Head>
      
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="flex justify-center">
              <span className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-red-100">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </span>
            </div>
            
            <h1 className="mt-5 text-3xl font-bold text-gray-900">Erro do Servidor</h1>
            
            <div className="mt-2">
              <p className="text-gray-600">
                Ocorreu um erro interno no servidor ao processar sua solicitação.
              </p>
            </div>
          </div>
          
          <div className="mt-8 space-y-4">
            <Link 
              href="/"
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Voltar para o início
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </button>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center">
              <AlarmClock className="h-5 w-5 text-gray-400" />
              <p className="ml-2 text-sm text-gray-500">
                Nossos técnicos foram notificados e estão trabalhando para resolver o problema.
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Se o problema persistir, entre em contato com o suporte técnico.</p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} PEMAD Material Check</p>
        </div>
      </div>
    </>
  );
} 
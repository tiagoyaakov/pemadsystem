import React from 'react';
import Link from 'next/link';
import { HomeIcon, ArrowLeftIcon, RefreshCw } from 'lucide-react';
import Head from 'next/head';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Página não encontrada | PEMAD Material Check</title>
      </Head>
      
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-9xl font-bold text-red-500">404</h1>
            
            <div className="mt-4 relative">
              <div className="h-1 w-full bg-red-100 absolute top-1/2 transform -translate-y-1/2"></div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xl text-gray-500">Página não encontrada</span>
              </div>
            </div>
            
            <p className="mt-6 text-gray-600">
              Desculpe, não conseguimos encontrar a página que você está procurando.
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <Link 
              href="/"
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Voltar para o início
            </Link>
            
            <div className="flex space-x-4">
              <button
                onClick={() => window.history.back()}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Voltar
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Se o problema persistir, entre em contato com o suporte ou seu administrador.</p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} PEMAD Material Check</p>
        </div>
      </div>
    </>
  );
} 
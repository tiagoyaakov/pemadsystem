import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import dynamic from 'next/dynamic';

const ConnectivityStatus = dynamic(
  () => import('@/components/ConnectivityStatus'),
  { ssr: false }
);

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = 'PEMAD Material Check',
  description = 'Sistema de gestão de materiais e monitoramento de incêndios para bombeiros',
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        
        <footer className="bg-gray-800 text-white py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-2 md:mb-0">
                <p className="text-sm">
                  &copy; {new Date().getFullYear()} PEMAD Material Check - Todos os direitos reservados
                </p>
              </div>
              <div className="flex space-x-4">
                <a
                  href="/termos"
                  className="text-sm text-gray-300 hover:text-white"
                >
                  Termos de Uso
                </a>
                <a
                  href="/privacidade"
                  className="text-sm text-gray-300 hover:text-white"
                >
                  Política de Privacidade
                </a>
                <a
                  href="/ajuda"
                  className="text-sm text-gray-300 hover:text-white"
                >
                  Ajuda
                </a>
              </div>
            </div>
          </div>
        </footer>
        
        {/* Componente de status de conectividade */}
        <ConnectivityStatus />
      </div>
    </>
  );
};

export default Layout; 
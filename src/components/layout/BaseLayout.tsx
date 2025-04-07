import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { HiOutlineMenu } from 'react-icons/hi';

interface BaseLayoutProps {
  children: React.ReactNode;
}

export function BaseLayout({ children }: BaseLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cbmmg-gray-50">
      <Header />

      <div className="flex">
        {/* Sidebar para mobile */}
        <div
          className={`
            fixed inset-0 z-40 lg:hidden
            ${sidebarOpen ? 'block' : 'hidden'}
          `}
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Fechar sidebar</span>
                <HiOutlineMenu className="h-6 w-6 text-white" />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>

        {/* Sidebar para desktop */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex-1 flex flex-col min-h-0 border-r border-cbmmg-gray-200">
              <Sidebar />
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Botão de menu para mobile */}
      <div className="lg:hidden fixed bottom-4 right-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center justify-center h-12 w-12 rounded-full bg-cbmmg-red text-white shadow-lg hover:bg-cbmmg-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbmmg-red"
        >
          <HiOutlineMenu className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
} 
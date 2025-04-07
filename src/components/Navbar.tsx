import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, Home, Clipboard, Flame, LogOut, User } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import dynamic from 'next/dynamic';

// Importação dinâmica para o componente de status de sincronização
const SyncStatus = dynamic(
  () => import('@/features/offline/components/SyncStatus'),
  { ssr: false }
);

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  const navLinks = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/checklists', label: 'Checklists', icon: Clipboard },
    { path: '/fires', label: 'Incêndios', icon: Flame },
  ];

  return (
    <nav className="bg-red-500 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-8 w-auto"
                src="/logo.png"
                alt="PEMAD Material Check"
              />
              <span className="ml-2 text-white font-bold text-lg hidden sm:block">
                PEMAD Check
              </span>
            </Link>
          </div>

          {/* Links de navegação Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive(link.path)
                      ? 'bg-red-700 text-white'
                      : 'text-red-50 hover:bg-red-600'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Ações do usuário Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link href="/sync" title="Status de sincronização">
              <SyncStatus className="mr-2" />
            </Link>
            
            {user && (
              <>
                <Link
                  href="/profile"
                  className="px-3 py-2 rounded-md text-sm font-medium text-red-50 hover:bg-red-600 flex items-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-md text-sm font-medium text-red-50 hover:bg-red-600 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </button>
              </>
            )}
          </div>

          {/* Botão Mobile */}
          <div className="flex md:hidden items-center space-x-2">
            <Link href="/sync" title="Status de sincronização">
              <SyncStatus className="mr-2" />
            </Link>
            
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-red-50 hover:bg-red-600 focus:outline-none"
            >
              {isOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {isOpen && (
        <div className="md:hidden bg-red-500 pt-2 pb-3 space-y-1 px-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                  isActive(link.path)
                    ? 'bg-red-700 text-white'
                    : 'text-red-50 hover:bg-red-600'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-5 w-5 mr-2" />
                {link.label}
              </Link>
            );
          })}
          
          {user && (
            <>
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-red-50 hover:bg-red-600 flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <User className="h-5 w-5 mr-2" />
                Perfil
              </Link>
              <button
                onClick={() => {
                  handleSignOut();
                  setIsOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-50 hover:bg-red-600 flex items-center"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sair
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar; 
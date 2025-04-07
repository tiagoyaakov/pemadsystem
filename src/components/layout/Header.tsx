import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useRBAC } from '@/features/auth/hooks/useRBAC';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const { user, signOut } = useAuth();
  const { canManageUsers, canManageSettings } = useRBAC();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard">
                <Image
                  src="/logo-cbmmg.png"
                  alt="CBMMG Logo"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
              <span className="ml-3 text-xl font-semibold text-cbmmg-red">
                PEMAD Check
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="ml-3 relative">
              <div>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbmmg-red"
                >
                  <span className="sr-only">Abrir menu do usuário</span>
                  <div className="h-8 w-8 rounded-full bg-cbmmg-red text-white flex items-center justify-center">
                    {user?.nome_guerra?.[0] || user?.nome?.[0] || '?'}
                  </div>
                </button>
              </div>

              {isMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 text-sm text-cbmmg-gray-700">
                    <p className="font-medium">{user?.nome_guerra || user?.nome}</p>
                    <p className="text-xs">{user?.posto}</p>
                  </div>
                  
                  <div className="border-t border-gray-100">
                    <Link
                      href="/perfil"
                      className="block px-4 py-2 text-sm text-cbmmg-gray-700 hover:bg-gray-100"
                    >
                      Meu Perfil
                    </Link>

                    {canManageUsers() && (
                      <Link
                        href="/usuarios"
                        className="block px-4 py-2 text-sm text-cbmmg-gray-700 hover:bg-gray-100"
                      >
                        Gerenciar Usuários
                      </Link>
                    )}

                    {canManageSettings() && (
                      <Link
                        href="/configuracoes"
                        className="block px-4 py-2 text-sm text-cbmmg-gray-700 hover:bg-gray-100"
                      >
                        Configurações
                      </Link>
                    )}

                    <button
                      onClick={signOut}
                      className="block w-full text-left px-4 py-2 text-sm text-cbmmg-gray-700 hover:bg-gray-100"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 
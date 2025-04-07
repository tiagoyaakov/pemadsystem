import { useState } from 'react';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import Image from 'next/image';
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, error, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <>
      <Head>
        <title>Login - PEMAD Material Check</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-cbmmg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="flex flex-col items-center">
            <Image
              src="/logo-cbmmg.png"
              alt="Logo CBMMG"
              width={120}
              height={120}
              className="mb-4"
            />
            <h2 className="text-center text-3xl font-bold text-cbmmg-red">
              PEMAD Material Check
            </h2>
            <p className="mt-2 text-center text-sm text-cbmmg-gray-600">
              Sistema de Conferência de Materiais
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-cbmmg-gray-300 placeholder-cbmmg-gray-500 text-cbmmg-gray-900 rounded-t-md focus:outline-none focus:ring-cbmmg-red focus:border-cbmmg-red focus:z-10 sm:text-sm"
                  placeholder="Email"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-cbmmg-gray-300 placeholder-cbmmg-gray-500 text-cbmmg-gray-900 rounded-b-md focus:outline-none focus:ring-cbmmg-red focus:border-cbmmg-red focus:z-10 sm:text-sm"
                  placeholder="Senha"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-cbmmg-red hover:bg-cbmmg-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbmmg-red disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import Head from "next/head";
import dynamic from 'next/dynamic';
import { OfflineProvider } from '@/features/offline/contexts/OfflineContext';

// Importação dinâmica para o componente de status de conectividade
const ConnectivityStatus = dynamic(
  () => import('@/components/ConnectivityStatus'),
  { ssr: false } // Desabilita SSR para este componente
);

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== router.asPath) {
        setLoading(true);
      }
    };
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  // Registra o service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado com sucesso:', registration);
        })
        .catch((error) => {
          console.error('Falha ao registrar o Service Worker:', error);
        });
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>PEMAD Material Check</title>
      </Head>
      <ErrorBoundary>
        <AuthProvider>
          <OfflineProvider>
            {loading && <LoadingScreen />}
            <Component {...pageProps} />
            <ConnectivityStatus />
          </OfflineProvider>
        </AuthProvider>
      </ErrorBoundary>
    </>
  );
} 
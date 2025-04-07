import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true, // Usar minificador SWC para melhor performance
  images: {
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID + '.supabase.co', // Para imagens do Storage
      'firms.modaps.eosdis.nasa.gov' // Para imagens da NASA FIRMS se necessário
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60, // Cache de imagens por 60 segundos
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  experimental: {
    optimizeCss: true, // Otimização de CSS
    scrollRestoration: true, // Restauração de scroll para melhor UX
  },
  compress: true, // Habilitar compressão Gzip
  poweredByHeader: false, // Remover cabeçalho X-Powered-By por segurança
  productionBrowserSourceMaps: false, // Desabilitar source maps em produção
};

// Configuração do PWA
const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Configurações adicionais para PWA
  workboxOptions: {
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
    swDest: 'sw.js',
    navigationPreload: true,
    // Página offline personalizada
    navigateFallback: '/offline.html',
    navigateFallbackDenylist: [/\/api\//], // Não use a página offline para APIs
    // Estratégias de cache
    runtimeCaching: [
      // Cache para fontes Google
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60 // 1 ano
          }
        }
      },
      // Cache para arquivos de fontes
      {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-font-assets',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60 // 1 semana
          }
        }
      },
      // Cache para imagens estáticas
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-image-assets',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 dias
          }
        }
      },
      // Cache para imagens processadas pelo Next.js
      {
        urlPattern: /\/_next\/image\?url=.+$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-image',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60 // 24 horas
          }
        }
      },
      // Cache para arquivos de áudio
      {
        urlPattern: /\.(?:mp3|wav|ogg)$/i,
        handler: 'CacheFirst',
        options: {
          rangeRequests: true,
          cacheName: 'static-audio-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60 // 24 horas
          }
        }
      },
      // Cache para arquivos JavaScript
      {
        urlPattern: /\.(?:js)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-js-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60 // 24 horas
          }
        }
      },
      // Cache para arquivos CSS
      {
        urlPattern: /\.(?:css|less)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-style-assets',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60 // 24 horas
          }
        }
      },
      // Cache para dados do Next.js
      {
        urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-data',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60 // 24 horas
          }
        }
      },
      // Cache para endpoints de API (primeira tentativa na rede, depois cache)
      {
        urlPattern: /\/api\/.*$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'apis',
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 24 * 60 * 60 // 24 horas
          },
          networkTimeoutSeconds: 10 // Timeout em 10 segundos
        }
      },
      // Cache para endpoints específicos de incêndios (melhorar acesso offline)
      {
        urlPattern: /\/api\/fires\/.*$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'fires-api',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 3 * 24 * 60 * 60 // 3 dias
          }
        }
      },
      // Cache específico para checklists (melhorar acesso offline)
      {
        urlPattern: /\/api\/checklists\/.*$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'checklists-api',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 7 * 24 * 60 * 60 // 7 dias
          }
        }
      },
      // Cache para endpoints da NASA FIRMS (garantir acesso offline aos dados de incêndio)
      {
        urlPattern: /firms\.modaps\.eosdis\.nasa\.gov/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'nasa-firms-api',
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 24 * 60 * 60 // 24 horas
          }
        }
      },
      // Cache para o Supabase (específico para rotas públicas que podem funcionar offline)
      {
        urlPattern: new RegExp(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/.*`, 'i'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60 // 24 horas
          }
        }
      },
      // Cache genérico para outros recursos
      {
        urlPattern: /.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'others',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60 // 24 horas
          },
          networkTimeoutSeconds: 10
        }
      }
    ]
  }
})(nextConfig);

export default config;

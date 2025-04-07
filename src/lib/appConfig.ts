// Configurações da aplicação

/**
 * Versão da aplicação
 * Importante para controle de cache e IndexedDB
 */
export const APP_VERSION = '1.0.0';

/**
 * Nome da aplicação
 */
export const APP_NAME = 'PEMAD Material Check';

/**
 * Configurações do IndexedDB
 */
export const INDEXEDDB_CONFIG = {
  // Nome do banco de dados
  DATABASE_NAME: 'pemad-material-check',
  // Versão do banco de dados
  DATABASE_VERSION: 1,
  // Stores do banco de dados
  STORES: {
    // Store de checklists
    CHECKLISTS: 'checklists',
    // Store de materiais
    MATERIALS: 'materials',
    // Store de incêndios
    FIRES: 'fires',
    // Store de configurações
    SETTINGS: 'settings',
    // Store de sincronização
    SYNC_QUEUE: 'syncQueue',
  },
};

/**
 * Configurações gerais de cache
 */
export const CACHE_CONFIG = {
  // Tempo de expiração do cache de dados (em milissegundos)
  DEFAULT_EXPIRATION: 24 * 60 * 60 * 1000, // 1 dia
  // Tempo de expiração do cache de imagens (em milissegundos)
  IMAGES_EXPIRATION: 7 * 24 * 60 * 60 * 1000, // 7 dias
  // Tempo de expiração do cache de configurações (em milissegundos)
  SETTINGS_EXPIRATION: 30 * 24 * 60 * 60 * 1000, // 30 dias
};

/**
 * URLs da API
 */
export const API_URLS = {
  // URL base da API do Supabase
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  // URL da API da NASA FIRMS
  NASA_FIRMS_URL: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
  // Chave da API da NASA FIRMS
  NASA_FIRMS_KEY: process.env.NEXT_PUBLIC_NASA_FIRMS_API_KEY || '',
};

/**
 * Limites e configurações de paginação
 */
export const PAGINATION_CONFIG = {
  // Limite padrão de itens por página
  DEFAULT_LIMIT: 10,
  // Limite máximo de itens por página
  MAX_LIMIT: 100,
  // Limite de itens para pré-carregar em modo offline
  OFFLINE_PRELOAD_LIMIT: 50,
};

/**
 * Configurações de notificações
 */
export const NOTIFICATION_CONFIG = {
  // Tempo de duração das notificações em milissegundos
  DURATION: 5000,
  // Tipos de notificações
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  },
};

/**
 * Configurações do service worker
 */
export const SERVICE_WORKER_CONFIG = {
  // Habilitar o service worker
  ENABLED: process.env.NODE_ENV === 'production',
  // Intervalo de verificação de atualizações do service worker (em milissegundos)
  UPDATE_CHECK_INTERVAL: 60 * 60 * 1000, // 1 hora
  // Caminho do service worker
  PATH: '/sw.js',
}; 
import { createClient, SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { metricsService } from './metrics.service';
import { Database } from '../types/supabase-types';

// Variáveis de ambiente para conexão com o Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verificar se as variáveis de ambiente estão configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Variáveis de ambiente do Supabase não configuradas! Certifique-se de definir NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// Opções de configuração para o cliente Supabase
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'pemad-material-check'
    }
  }
};

// Criar o cliente Supabase com tipagem
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || '',
  supabaseKey || '',
  options
);

/**
 * Classe de serviço para interação com o Supabase
 * Fornece métodos auxiliares para operações comuns e tratamento de erros
 */
class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient<Database>;
  private isInitialized: boolean = false;

  private constructor() {
    this.client = supabase;
  }

  /**
   * Retorna a instância singleton do serviço
   */
  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Inicializa o serviço com configurações adicionais
   */
  public init(): void {
    if (this.isInitialized) return;

    try {
      // Configurar listeners de eventos de autenticação
      // Disable eslint rule for unused 'session' variable on the next line
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      this.client.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN') {
          metricsService.recordMetric('auth', 'signin', { success: true });
        } else if (event === 'SIGNED_OUT') {
          metricsService.recordMetric('auth', 'signout', { success: true });
        } else if (event === 'PASSWORD_RECOVERY') {
          metricsService.recordMetric('auth', 'password_recovery', { event });
        } else if (event === 'TOKEN_REFRESHED') {
          metricsService.recordMetric('auth', 'token_refreshed', { success: true });
        } else if (event === 'USER_UPDATED') {
          metricsService.recordMetric('auth', 'user_updated', { success: true });
        }
      });

      this.isInitialized = true;
      metricsService.recordMetric('supabase', 'init', { success: true });
    } catch (error) {
      metricsService.recordMetric('supabase', 'init', { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
      console.error('Erro ao inicializar o serviço Supabase:', error);
    }
  }

  /**
   * Função auxiliar para tratamento uniforme de erros do Supabase
   */
  public handleError(error: any, context: string): Error {
    const errorMessage = error?.message || 'Erro desconhecido';
    const errorCode = error?.code || 'UNKNOWN';
    const errorDetails = error?.details || '';
    
    // Registrar métricas do erro
    metricsService.recordMetric('supabase', 'error', {
      context,
      errorCode,
      errorMessage: errorMessage.substring(0, 100) // Limitar tamanho da mensagem
    });

    // Fazer log do erro
    console.error(`Erro Supabase (${context}):`, {
      code: errorCode,
      message: errorMessage,
      details: errorDetails
    });

    // Retornar um erro formatado
    return new Error(`Erro na operação ${context}: ${errorMessage}`);
  }

  /**
   * Verifica se a conexão com o Supabase está funcionando
   */
  public async testConnection(): Promise<boolean> {
    try {
      const start = performance.now();
      const { error } = await this.client.from('users').select('id').limit(1);
      const duration = performance.now() - start;
      
      // Registra informações de latência
      metricsService.recordMetric('supabase', 'latency', { 
        duration,
        success: !error
      });
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = "Table does not exist"
        throw error;
      }
      
      return true;
    } catch (error) {
      this.handleError(error, 'testConnection');
      return false;
    }
  }

  /**
   * Constrói um seletor de tabela com tratamento de erros integrado
   */
  public safeFrom<T>(tableName: string) {
    return {
      select: async (columns: string, options?: any) => {
        try {
          const response = await this.client.from(tableName).select(columns, options);
          if (response.error) throw response.error;
          return { data: response.data as T[], error: null };
        } catch (error) {
          return { data: null as unknown as T[], error: this.handleError(error, `${tableName}.select`) };
        }
      },
      insert: async (values: any, options?: any) => {
        try {
          const response = await this.client.from(tableName).insert(values, options);
          if (response.error) throw response.error;
          return { data: response.data as T[], error: null };
        } catch (error) {
          return { data: null as unknown as T[], error: this.handleError(error, `${tableName}.insert`) };
        }
      },
      update: async (values: any, options?: any) => {
        try {
          const response = await this.client.from(tableName).update(values, options);
          if (response.error) throw response.error;
          return { data: response.data as T[], error: null };
        } catch (error) {
          return { data: null as unknown as T[], error: this.handleError(error, `${tableName}.update`) };
        }
      },
      delete: async (options?: any) => {
        try {
          const response = await this.client.from(tableName).delete(options);
          if (response.error) throw response.error;
          return { data: response.data as T[], error: null };
        } catch (error) {
          return { data: null as unknown as T[], error: this.handleError(error, `${tableName}.delete`) };
        }
      },
      upsert: async (values: any, options?: any) => {
        try {
          const response = await this.client.from(tableName).upsert(values, options);
          if (response.error) throw response.error;
          return { data: response.data as T[], error: null };
        } catch (error) {
          return { data: null as unknown as T[], error: this.handleError(error, `${tableName}.upsert`) };
        }
      }
    };
  }
}

// Exportar a instância singleton
export const supabaseService = SupabaseService.getInstance();

// Inicializar o serviço automaticamente se estiver no navegador
if (typeof window !== 'undefined') {
  supabaseService.init();
} 
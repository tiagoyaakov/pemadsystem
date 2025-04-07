import { metricsService } from '../services/metrics.service';

// Tipos para configuração do New Relic
interface NewRelicConfig {
  licenseKey: string;
  applicationId: string;
  accountId: string;
  agentId: string;
  trustKey: string;
  agentEnabled: boolean;
  customAttributes: Record<string, any>;
  errorCollectionEnabled: boolean;
  distributedTracingEnabled: boolean;
}

// Tipos para alertas do New Relic
interface AlertConfig {
  metricName: string;
  thresholdType: 'above' | 'below';
  thresholdValue: number;
  durationMinutes: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  notifyChannels: string[];
}

/**
 * Classe para gerenciar a integração com New Relic
 */
class NewRelicIntegration {
  private isInitialized = false;
  private newrelicInstance: any = null;
  private config: Partial<NewRelicConfig> = {};
  private customAlerts: AlertConfig[] = [];

  /**
   * Inicializa a integração com New Relic
   * @param config Configuração do New Relic
   */
  public initialize(config: Partial<NewRelicConfig> = {}): void {
    if (this.isInitialized) {
      return;
    }

    try {
      // Verificar se estamos em ambiente de produção
      if (process.env.NODE_ENV !== 'production') {
        console.info('[New Relic] Integração desativada em ambiente de desenvolvimento');
        return;
      }

      // Verificar se o New Relic está disponível no escopo global
      if (typeof window !== 'undefined' && 'newrelic' in window) {
        this.newrelicInstance = (window as any).newrelic;
        this.config = {
          ...this.getDefaultConfig(),
          ...config
        };

        // Registrar evento de inicialização
        this.recordCustomEvent('Monitoring', 'NewRelicInitialized', {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        });

        // Configurar captura de erros não tratados
        this.setupErrorTracking();

        // Integrar com o serviço de métricas
        this.integrateWithMetricsService();

        console.info('[New Relic] Integração inicializada com sucesso');
        this.isInitialized = true;

        // Registrar métrica de inicialização
        metricsService.recordMetric('monitoring', 'new_relic_initialized', {
          success: true
        });
      } else {
        console.warn('[New Relic] Script não encontrado. Verificar instalação.');
        metricsService.recordMetric('error', 'new_relic_init_failed', {
          reason: 'script_not_found'
        });
      }
    } catch (error) {
      console.error('[New Relic] Erro ao inicializar:', error);
      metricsService.recordMetric('error', 'new_relic_init_failed', {
        reason: error instanceof Error ? error.message : 'unknown_error'
      });
    }
  }

  /**
   * Configura a captura de erros não tratados
   */
  private setupErrorTracking(): void {
    if (!this.newrelicInstance || !this.config.errorCollectionEnabled) {
      return;
    }

    // Capturar erros não tratados
    window.addEventListener('error', (event) => {
      this.recordError(event.error || new Error(event.message), {
        source: event.filename,
        line: event.lineno,
        column: event.colno
      });
    });

    // Capturar promessas rejeitadas não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));

      this.recordError(error, {
        type: 'unhandled_promise_rejection'
      });
    });
  }

  /**
   * Integrar com o serviço de métricas existente
   */
  private integrateWithMetricsService(): void {
    if (!this.newrelicInstance) {
      return;
    }

    // Extender o serviço de métricas para enviar dados para o New Relic
    const originalRecordMetric = metricsService.recordMetric;
    
    metricsService.recordMetric = (category, name, attributes = {}) => {
      // Chamar a implementação original
      originalRecordMetric(category, name, attributes);
      
      // Enviar também para o New Relic
      this.recordCustomEvent(category, name, attributes);
    };
  }

  /**
   * Registra um evento personalizado no New Relic
   * @param eventType Tipo do evento
   * @param eventName Nome do evento
   * @param attributes Atributos adicionais
   */
  public recordCustomEvent(eventType: string, eventName: string, attributes: Record<string, any> = {}): void {
    if (!this.newrelicInstance) {
      return;
    }

    try {
      // Adicionar atributos padrão
      const enhancedAttributes = {
        ...attributes,
        appVersion: process.env.APP_VERSION || 'unknown',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      };

      // Enviar evento para o New Relic
      this.newrelicInstance.addPageAction(eventType, {
        name: eventName,
        ...enhancedAttributes
      });
    } catch (error) {
      console.error('[New Relic] Erro ao registrar evento:', error);
    }
  }

  /**
   * Registra um erro no New Relic
   * @param error Erro a ser registrado
   * @param customAttributes Atributos personalizados
   */
  public recordError(error: Error, customAttributes: Record<string, any> = {}): void {
    if (!this.newrelicInstance) {
      return;
    }

    try {
      this.newrelicInstance.noticeError(error, {
        ...this.config.customAttributes,
        ...customAttributes
      });
    } catch (e) {
      console.error('[New Relic] Erro ao registrar erro:', e);
    }
  }

  /**
   * Configura alertas personalizados no New Relic
   * @param alerts Configurações de alertas
   */
  public configureAlerts(alerts: AlertConfig[]): void {
    this.customAlerts = alerts;
    
    // Em um sistema real, aqui usaríamos a API do New Relic para
    // configurar alertas programaticamente. Apenas registramos por agora.
    if (this.isInitialized) {
      console.info('[New Relic] Configurando alertas:', alerts);
      
      // Registrar métrica de configuração de alertas
      metricsService.recordMetric('monitoring', 'new_relic_alerts_configured', {
        alertCount: alerts.length
      });
    }
  }

  /**
   * Inicia uma transação personalizada no New Relic
   * @param name Nome da transação
   * @param group Grupo da transação (opcional)
   * @returns Objeto de transação ou null se não inicializado
   */
  public startTransaction(name: string, group?: string): any {
    if (!this.newrelicInstance) {
      return null;
    }

    try {
      return this.newrelicInstance.interaction();
    } catch (error) {
      console.error('[New Relic] Erro ao iniciar transação:', error);
      return null;
    }
  }

  /**
   * Obtém configuração padrão para o New Relic
   */
  private getDefaultConfig(): Partial<NewRelicConfig> {
    return {
      agentEnabled: true,
      errorCollectionEnabled: true,
      distributedTracingEnabled: true,
      customAttributes: {
        appName: 'PEMAD-Material-Check'
      }
    };
  }
}

// Exportar instância singleton
export const newRelicIntegration = new NewRelicIntegration();

// Função auxiliar para inicializar New Relic em componentes
export function useNewRelic(): { trackError: (error: Error, context?: Record<string, any>) => void } {
  return {
    trackError: (error: Error, context = {}) => {
      newRelicIntegration.recordError(error, context);
    }
  };
} 
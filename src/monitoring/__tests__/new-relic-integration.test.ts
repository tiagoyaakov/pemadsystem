import { newRelicIntegration, useNewRelic } from '../new-relic-integration';
import { metricsService } from '../../services/metrics.service';

// Mock do serviço de métricas
jest.mock('../../services/metrics.service', () => ({
  metricsService: {
    recordMetric: jest.fn()
  }
}));

describe('NewRelicIntegration', () => {
  const originalEnv = process.env;
  const originalConsole = { ...console };
  let mockNewRelic: any;

  beforeEach(() => {
    // Resetar mocks
    jest.clearAllMocks();
    
    // Mock para console
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    
    // Mock para window.newrelic
    mockNewRelic = {
      addPageAction: jest.fn(),
      noticeError: jest.fn(),
      interaction: jest.fn().mockReturnValue({ actionText: 'test', end: jest.fn() })
    };
    
    // Mock para window e process.env
    Object.defineProperty(window, 'newrelic', {
      value: mockNewRelic,
      writable: true,
      configurable: true
    });
    
    // Usar Object.defineProperty para configurar NODE_ENV
    Object.defineProperty(process, 'env', {
      value: {
        ...originalEnv,
        NODE_ENV: 'production',
        APP_VERSION: '1.0.0'
      }
    });
    
    // Resetar o estado da integração para cada teste
    Object.defineProperty(newRelicIntegration, 'isInitialized', {
      value: false,
      writable: true
    });
  });
  
  afterEach(() => {
    // Restaurar process.env
    Object.defineProperty(process, 'env', {
      value: originalEnv
    });
    
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    
    // Limpar mock do newrelic
    if ('newrelic' in window) {
      delete (window as any).newrelic;
    }
  });

  describe('initialize', () => {
    it('deve inicializar a integração com New Relic em produção', () => {
      newRelicIntegration.initialize();
      
      expect(mockNewRelic.addPageAction).toHaveBeenCalledWith(
        'Monitoring',
        expect.objectContaining({
          name: 'NewRelicInitialized'
        })
      );
      
      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'monitoring',
        'new_relic_initialized',
        { success: true }
      );
      
      expect(console.info).toHaveBeenCalledWith(
        '[New Relic] Integração inicializada com sucesso'
      );
    });
    
    it('não deve inicializar em ambiente de desenvolvimento', () => {
      // Configurar NODE_ENV como development
      Object.defineProperty(process, 'env', {
        value: {
          ...originalEnv,
          NODE_ENV: 'development',
          APP_VERSION: '1.0.0'
        }
      });
      
      newRelicIntegration.initialize();
      
      expect(mockNewRelic.addPageAction).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalledWith(
        '[New Relic] Integração desativada em ambiente de desenvolvimento'
      );
    });
    
    it('deve exibir aviso se o New Relic não estiver disponível', () => {
      delete (window as any).newrelic;
      
      newRelicIntegration.initialize();
      
      expect(console.warn).toHaveBeenCalledWith(
        '[New Relic] Script não encontrado. Verificar instalação.'
      );
      
      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'error',
        'new_relic_init_failed',
        { reason: 'script_not_found' }
      );
    });
    
    it('não deve inicializar mais de uma vez', () => {
      // Primeira inicialização
      newRelicIntegration.initialize();
      expect(mockNewRelic.addPageAction).toHaveBeenCalledTimes(1);
      
      // Segunda inicialização não deve fazer nada
      newRelicIntegration.initialize();
      expect(mockNewRelic.addPageAction).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('recordError', () => {
    it('deve registrar erros no New Relic', () => {
      newRelicIntegration.initialize();
      
      const error = new Error('Teste de erro');
      const customAttributes = { component: 'TesteComponent' };
      
      newRelicIntegration.recordError(error, customAttributes);
      
      expect(mockNewRelic.noticeError).toHaveBeenCalledWith(
        error,
        expect.objectContaining(customAttributes)
      );
    });
    
    it('não deve falhar se New Relic não estiver inicializado', () => {
      delete (window as any).newrelic;
      
      const error = new Error('Teste de erro');
      
      // Não deve lançar exceção
      expect(() => {
        newRelicIntegration.recordError(error);
      }).not.toThrow();
    });
  });
  
  describe('recordCustomEvent', () => {
    it('deve registrar eventos personalizados no New Relic', () => {
      newRelicIntegration.initialize();
      
      newRelicIntegration.recordCustomEvent('User', 'Login', { userId: '123' });
      
      expect(mockNewRelic.addPageAction).toHaveBeenCalledWith(
        'User',
        expect.objectContaining({
          name: 'Login',
          userId: '123',
          appVersion: '1.0.0',
          environment: 'production'
        })
      );
    });
  });
  
  describe('configureAlerts', () => {
    it('deve configurar alertas e registrar uma métrica', () => {
      newRelicIntegration.initialize();
      
      const alerts = [
        {
          metricName: 'error_rate',
          thresholdType: 'above' as const,
          thresholdValue: 5,
          durationMinutes: 5,
          priority: 'high' as const,
          notifyChannels: ['email', 'slack']
        }
      ];
      
      newRelicIntegration.configureAlerts(alerts);
      
      expect(metricsService.recordMetric).toHaveBeenCalledWith(
        'monitoring',
        'new_relic_alerts_configured',
        { alertCount: 1 }
      );
    });
  });
  
  describe('startTransaction', () => {
    it('deve iniciar uma transação no New Relic', () => {
      newRelicIntegration.initialize();
      
      const transaction = newRelicIntegration.startTransaction('PageView', 'Navigation');
      
      expect(mockNewRelic.interaction).toHaveBeenCalled();
      expect(transaction).toEqual(expect.objectContaining({
        actionText: 'test'
      }));
    });
    
    it('deve retornar null se New Relic não estiver inicializado', () => {
      delete (window as any).newrelic;
      
      const transaction = newRelicIntegration.startTransaction('PageView');
      
      expect(transaction).toBeNull();
    });
  });
  
  describe('useNewRelic', () => {
    it('deve fornecer hook para rastreamento de erros', () => {
      newRelicIntegration.initialize();
      
      const { trackError } = useNewRelic();
      const error = new Error('Teste de erro');
      
      trackError(error, { component: 'TestComponent' });
      
      expect(mockNewRelic.noticeError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ component: 'TestComponent' })
      );
    });
  });
  
  describe('integrateWithMetricsService', () => {
    it('deve integrar com o serviço de métricas existente', () => {
      // Armazenar a função original
      const originalRecordMetric = metricsService.recordMetric;
      
      // Inicializar a integração
      newRelicIntegration.initialize();
      
      // Verificar se a função foi substituída
      expect(metricsService.recordMetric).not.toBe(originalRecordMetric);
      
      // Tentar registrar uma métrica
      metricsService.recordMetric('user', 'click', { buttonId: 'submit' });
      
      // Verificar se o evento foi enviado para o New Relic
      expect(mockNewRelic.addPageAction).toHaveBeenCalledWith(
        'user',
        expect.objectContaining({
          name: 'click',
          buttonId: 'submit'
        })
      );
    });
  });
}); 
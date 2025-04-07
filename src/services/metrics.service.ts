import { METRICS_CONFIG } from '../../config/metrics.config';
import newrelic from 'newrelic';
import { alertService } from './alert.service';

interface MetricEvent {
  name: string;
  attributes: Record<string, any>;
  timestamp: number;
}

class MetricsService {
  private static instance: MetricsService;
  private metricsBuffer: MetricEvent[] = [];
  private collectionInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    this.setupCollection();
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  private setupCollection(): void {
    if (this.isInitialized) return;

    try {
      const { interval } = METRICS_CONFIG.collection;

      this.collectionInterval = setInterval(() => {
        this.flushMetrics();
      }, interval);

      // Limpar intervalo quando o processo for encerrado
      process.on('beforeExit', () => {
        if (this.collectionInterval) {
          clearInterval(this.collectionInterval);
        }
        this.flushMetrics();
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to setup metrics collection:', error);
    }
  }

  public cleanup(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    this.flushMetrics();
    this.isInitialized = false;
  }

  private shouldSample(): boolean {
    const { enabled, rate } = METRICS_CONFIG.collection.sampling;
    return !enabled || Math.random() < rate;
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metrics = [...this.metricsBuffer];
      this.metricsBuffer = [];

      await Promise.all(metrics.map(metric => {
        return new Promise<void>((resolve) => {
          try {
            (newrelic as any).recordCustomEvent(metric.name, {
              ...metric.attributes,
              timestamp: metric.timestamp
            });
            resolve();
          } catch (error) {
            console.error(`Failed to record metric ${metric.name}:`, error);
            resolve();
          }
        });
      }));
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Restaurar métricas ao buffer em caso de falha
      this.metricsBuffer = [...this.metricsBuffer];
    }
  }

  // Métricas de usuário
  public recordUserInteraction(componentName: string, eventType: string, duration: number): void {
    if (!this.shouldSample()) return;

    this.recordMetric('user', 'interaction', {
      componentName,
      eventType,
      duration
    });

    // Alertar se a interação for muito lenta
    if (duration > METRICS_CONFIG.alerts.thresholds.latency.warning) {
      alertService.sendAlert({
        type: duration > METRICS_CONFIG.alerts.thresholds.latency.critical ? 'critical' : 'warning',
        metric: 'interaction_latency',
        value: duration,
        threshold: METRICS_CONFIG.alerts.thresholds.latency.warning,
        component: componentName,
        details: { eventType }
      });
    }
  }

  public recordFormError(formName: string, fieldName: string, errorType: string, value: string): void {
    this.recordMetric('user', 'form_error', {
      formName,
      fieldName,
      errorType,
      value
    });

    // Alertar se houver muitos erros do mesmo tipo
    this.checkErrorThreshold(formName, fieldName, errorType);
  }

  public recordNavigation(fromPath: string, toPath: string, duration: number): void {
    if (!this.shouldSample()) return;

    this.recordMetric('user', 'navigation', {
      fromPath,
      toPath,
      duration
    });

    // Alertar se a navegação for muito lenta
    if (duration > METRICS_CONFIG.alerts.thresholds.latency.warning) {
      alertService.sendAlert({
        type: duration > METRICS_CONFIG.alerts.thresholds.latency.critical ? 'critical' : 'warning',
        metric: 'navigation_latency',
        value: duration,
        threshold: METRICS_CONFIG.alerts.thresholds.latency.warning,
        details: { fromPath, toPath }
      });
    }
  }

  // Métricas de recursos
  public recordComponentLoad(componentName: string, loadTime: number, dependencies: string[]): void {
    if (!this.shouldSample()) return;

    this.recordMetric('resource', 'component_load', {
      componentName,
      loadTime,
      dependencies: dependencies.join(',')
    });

    // Alertar se o carregamento for muito lento
    if (loadTime > 1000) { // 1 segundo
      alertService.sendAlert({
        type: loadTime > 3000 ? 'critical' : 'warning',
        metric: 'component_load_time',
        value: loadTime,
        threshold: 1000,
        component: componentName,
        details: { dependencies: dependencies.length }
      });
    }
  }

  public recordApiCall(endpoint: string, method: string, duration: number, status: number): void {
    this.recordMetric('resource', 'api_call', {
      endpoint,
      method,
      duration,
      status
    });

    // Alertar se a chamada falhar ou for muito lenta
    if (status >= 400 || duration > METRICS_CONFIG.alerts.thresholds.latency.warning) {
      alertService.sendAlert({
        type: status >= 500 || duration > METRICS_CONFIG.alerts.thresholds.latency.critical ? 'critical' : 'warning',
        metric: 'api_call',
        value: duration,
        threshold: METRICS_CONFIG.alerts.thresholds.latency.warning,
        details: { endpoint, method, status }
      });
    }
  }

  public recordCacheEfficiency(resource: string, hitRate: number, size: number): void {
    if (!this.shouldSample()) return;

    this.recordMetric('resource', 'cache_hit', {
      resource,
      hitRate,
      size
    });

    // Alertar se a taxa de hit for muito baixa
    if (hitRate < 0.5) { // Menos de 50% de hit rate
      alertService.sendAlert({
        type: hitRate < 0.3 ? 'critical' : 'warning',
        metric: 'cache_efficiency',
        value: hitRate,
        threshold: 0.5,
        details: { resource, size }
      });
    }
  }

  // Métricas de negócio
  public recordConversion(funnel: string, step: string, success: boolean): void {
    this.recordMetric('business', 'conversion', {
      funnel,
      step,
      success
    });

    // Alertar se a taxa de conversão for muito baixa
    if (!success) {
      this.checkConversionRate(funnel, step);
    }
  }

  public recordEngagement(feature: string, duration: number, interactions: number): void {
    if (!this.shouldSample()) return;

    this.recordMetric('business', 'engagement', {
      feature,
      duration,
      interactions,
      interactionsPerMinute: duration > 0 ? (interactions * 60000) / duration : 0
    });

    // Alertar se o engajamento for muito baixo
    if (duration > 0 && interactions === 0) {
      alertService.sendAlert({
        type: 'warning',
        metric: 'zero_engagement',
        value: 0,
        threshold: 1,
        details: { feature, duration }
      });
    }
  }

  // Métricas de infraestrutura
  public recordMemoryUsage(heap: number, allocated: number, used: number): void {
    this.recordMetric('infrastructure', 'memory_usage', {
      heap,
      allocated,
      used,
      usagePercentage: (used / allocated) * 100
    });

    this.checkMemoryThresholds(used / allocated);
  }

  public recordCPUUsage(user: number, system: number, idle: number): void {
    const total = user + system + idle;
    const usage = (user + system) / total;

    this.recordMetric('infrastructure', 'cpu_usage', {
      user: (user / total) * 100,
      system: (system / total) * 100,
      idle: (idle / total) * 100,
      usage: usage * 100
    });

    this.checkCPUThresholds(usage);
  }

  public recordNetworkUsage(sent: number, received: number, latency: number): void {
    this.recordMetric('infrastructure', 'network_usage', {
      sent,
      received,
      latency,
      totalTransfer: sent + received
    });

    this.checkLatencyThresholds(latency);
  }

  public recordMetric(category: string, name: string, attributes: Record<string, any>): void {
    try {
      const event: MetricEvent = {
        name: `${category}_${name}`,
        attributes: {
          category,
          ...attributes
        },
        timestamp: Date.now()
      };

      this.metricsBuffer.push(event);

      if (this.metricsBuffer.length >= METRICS_CONFIG.collection.bufferSize) {
        this.flushMetrics();
      }
    } catch (error) {
      console.error(`Failed to record metric ${category}.${name}:`, error);
    }
  }

  private checkMemoryThresholds(usage: number): void {
    const { warning, critical } = METRICS_CONFIG.alerts.thresholds.memory;

    if (usage >= critical || usage >= warning) {
      alertService.sendAlert({
        type: usage >= critical ? 'critical' : 'warning',
        metric: 'memory_usage',
        value: usage * 100, // Converter para porcentagem
        threshold: usage >= critical ? critical * 100 : warning * 100
      });
    }
  }

  private checkCPUThresholds(usage: number): void {
    const { warning, critical } = METRICS_CONFIG.alerts.thresholds.cpu;

    if (usage >= critical || usage >= warning) {
      alertService.sendAlert({
        type: usage >= critical ? 'critical' : 'warning',
        metric: 'cpu_usage',
        value: usage * 100, // Converter para porcentagem
        threshold: usage >= critical ? critical * 100 : warning * 100
      });
    }
  }

  private checkLatencyThresholds(latency: number): void {
    const { warning, critical } = METRICS_CONFIG.alerts.thresholds.latency;

    if (latency >= critical || latency >= warning) {
      alertService.sendAlert({
        type: latency >= critical ? 'critical' : 'warning',
        metric: 'network_latency',
        value: latency,
        threshold: latency >= critical ? critical : warning
      });
    }
  }

  private errorCounts: Map<string, number> = new Map();
  private lastErrorCheck: number = Date.now();

  private checkErrorThreshold(formName: string, fieldName: string, errorType: string): void {
    const key = `${formName}-${fieldName}-${errorType}`;
    const count = (this.errorCounts.get(key) || 0) + 1;
    this.errorCounts.set(key, count);

    const now = Date.now();
    if (now - this.lastErrorCheck > 300000) { // 5 minutos
      this.errorCounts.clear();
      this.lastErrorCheck = now;
    } else if (count > 10) { // Mais de 10 erros em 5 minutos
      alertService.sendAlert({
        type: count > 20 ? 'critical' : 'warning',
        metric: 'form_errors',
        value: count,
        threshold: 10,
        component: formName,
        details: { fieldName, errorType }
      });
    }
  }

  private conversionCounts: Map<string, { success: number; total: number }> = new Map();
  private lastConversionCheck: number = Date.now();

  private checkConversionRate(funnel: string, step: string): void {
    const key = `${funnel}-${step}`;
    const counts = this.conversionCounts.get(key) || { success: 0, total: 0 };
    counts.total++;
    this.conversionCounts.set(key, counts);

    const now = Date.now();
    if (now - this.lastConversionCheck > 3600000) { // 1 hora
      this.conversionCounts.clear();
      this.lastConversionCheck = now;
    } else if (counts.total >= 100) { // Pelo menos 100 tentativas
      const rate = counts.success / counts.total;
      if (rate < 0.5) { // Menos de 50% de conversão
        alertService.sendAlert({
          type: rate < 0.3 ? 'critical' : 'warning',
          metric: 'conversion_rate',
          value: rate * 100, // Converter para porcentagem
          threshold: 50, // 50%
          details: { funnel, step, total: counts.total }
        });
      }
    }
  }
}

export const metricsService = MetricsService.getInstance(); 
import { METRICS_CONFIG } from '../../config/metrics.config';

interface AlertMessage {
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  component?: string;
  details?: Record<string, any>;
}

class AlertService {
  private static instance: AlertService;
  private alertBuffer: Map<string, AlertMessage[]> = new Map();
  private lastAlertTime: Map<string, number> = new Map();

  private constructor() {
    this.setupAlertAggregation();
  }

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  private setupAlertAggregation(): void {
    const { window } = METRICS_CONFIG.alerts.aggregation;

    setInterval(() => {
      this.processAlertBuffer();
    }, window);
  }

  public async sendAlert(message: AlertMessage): Promise<void> {
    const key = `${message.type}-${message.metric}`;
    
    // Verificar throttling
    const lastAlert = this.lastAlertTime.get(key) || 0;
    const now = Date.now();
    
    if (now - lastAlert < METRICS_CONFIG.alerts.aggregation.window) {
      // Adicionar ao buffer para agregação
      if (!this.alertBuffer.has(key)) {
        this.alertBuffer.set(key, []);
      }
      this.alertBuffer.get(key)?.push(message);
      return;
    }

    await this.sendSlackMessage(this.formatAlertMessage(message));
    this.lastAlertTime.set(key, now);
  }

  private async processAlertBuffer(): Promise<void> {
    for (const [key, alerts] of this.alertBuffer.entries()) {
      if (alerts.length >= METRICS_CONFIG.alerts.aggregation.minOccurrences) {
        const aggregatedMessage = this.aggregateAlerts(key, alerts);
        await this.sendSlackMessage(aggregatedMessage);
      }
      this.alertBuffer.delete(key);
    }
  }

  private aggregateAlerts(key: string, alerts: AlertMessage[]): string {
    const [type, metric] = key.split('-');
    const count = alerts.length;
    const avgValue = alerts.reduce((sum, alert) => sum + alert.value, 0) / count;
    
    return `
🔔 *Alerta Agregado: ${type.toUpperCase()}*
• Métrica: ${metric}
• Ocorrências: ${count}
• Valor Médio: ${avgValue.toFixed(2)}
• Threshold: ${alerts[0].threshold}
• Período: Últimos ${METRICS_CONFIG.alerts.aggregation.window / 1000 / 60} minutos
${this.formatAggregatedDetails(alerts)}
    `.trim();
  }

  private formatAlertMessage(alert: AlertMessage): string {
    const emoji = alert.type === 'critical' ? '🚨' : '⚠️';
    
    return `
${emoji} *Alerta de Performance: ${alert.type.toUpperCase()}*
• Métrica: ${alert.metric}
• Valor Atual: ${alert.value.toFixed(2)}
• Threshold: ${alert.threshold}
${alert.component ? `• Componente: ${alert.component}` : ''}
${this.formatDetails(alert.details)}
    `.trim();
  }

  private formatDetails(details?: Record<string, any>): string {
    if (!details) return '';

    return Object.entries(details)
      .map(([key, value]) => `• ${key}: ${value}`)
      .join('\n');
  }

  private formatAggregatedDetails(alerts: AlertMessage[]): string {
    const components = new Set(alerts.map(a => a.component).filter(Boolean));
    if (components.size === 0) return '';

    return `\nComponentes Afetados:\n${Array.from(components).map(c => `• ${c}`).join('\n')}`;
  }

  private async sendSlackMessage(message: string): Promise<void> {
    if (!process.env.SLACK_WEBHOOK_URL) {
      console.warn('SLACK_WEBHOOK_URL não configurada');
      return;
    }

    try {
      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: message })
      });

      if (!response.ok) {
        throw new Error(`Falha ao enviar alerta para o Slack: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao enviar alerta para o Slack:', error);
    }
  }
}

export const alertService = AlertService.getInstance(); 
export const PERFORMANCE_CONFIG = {
  // Thresholds para métricas principais
  thresholds: {
    performance: 0.8,
    accessibility: 0.9,
    'best-practices': 0.9,
    seo: 0.9,
    pwa: 0.7
  },

  // Thresholds para métricas específicas (em milissegundos)
  metricThresholds: {
    'first-contentful-paint': 2000,
    'largest-contentful-paint': 2500,
    'first-input-delay': 100,
    'cumulative-layout-shift': 0.1,
    'total-blocking-time': 300,
    'speed-index': 3000
  },

  // Configurações de alerta
  alerts: {
    // Porcentagem de queda que dispara alerta
    regressionThreshold: 5,
    
    // Número de dias para análise de tendência
    trendDays: 7,
    
    // Canais de notificação (implementar conforme necessário)
    channels: ['console', 'slack']
  },

  // Configurações de teste
  test: {
    // URL base para testes
    baseUrl: 'http://localhost:3000',
    
    // Configurações do Chrome
    chrome: {
      port: 9222,
      flags: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    },
    
    // Configurações do Lighthouse
    lighthouse: {
      onlyCategories: [
        'performance',
        'accessibility',
        'best-practices',
        'seo',
        'pwa'
      ],
      skipAudits: [
        'screenshot-thumbnails',
        'final-screenshot'
      ]
    }
  },

  // Configurações de relatório
  report: {
    // Diretório para salvar relatórios
    outputDir: './performance-reports',
    
    // Formato do nome do arquivo
    filePattern: 'performance-report-{timestamp}',
    
    // Formatos de saída
    formats: ['html', 'json'],
    
    // Retenção de histórico (em dias)
    retention: 30
  }
}; 
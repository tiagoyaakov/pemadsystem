export const METRICS_CONFIG = {
  // Métricas de usuário
  userMetrics: {
    // Tempo de interação
    interactionTiming: {
      name: 'UserInteraction',
      attributes: ['componentName', 'eventType', 'duration']
    },
    
    // Erros de formulário
    formErrors: {
      name: 'FormValidation',
      attributes: ['formName', 'fieldName', 'errorType', 'value']
    },
    
    // Navegação
    navigation: {
      name: 'Navigation',
      attributes: ['fromPath', 'toPath', 'duration']
    }
  },

  // Métricas de recursos
  resourceMetrics: {
    // Carregamento de componentes
    componentLoad: {
      name: 'ComponentLoad',
      attributes: ['componentName', 'loadTime', 'dependencies']
    },
    
    // Chamadas de API
    apiCalls: {
      name: 'APICall',
      attributes: ['endpoint', 'method', 'duration', 'status']
    },
    
    // Cache
    cacheEfficiency: {
      name: 'CacheHit',
      attributes: ['resource', 'hitRate', 'size']
    }
  },

  // Métricas de negócio
  businessMetrics: {
    // Conversão
    conversion: {
      name: 'Conversion',
      attributes: ['funnel', 'step', 'success']
    },
    
    // Engajamento
    engagement: {
      name: 'Engagement',
      attributes: ['feature', 'duration', 'interactions']
    }
  },

  // Métricas de infraestrutura
  infrastructureMetrics: {
    // Memória
    memory: {
      name: 'MemoryUsage',
      attributes: ['heap', 'allocated', 'used']
    },
    
    // CPU
    cpu: {
      name: 'CPUUsage',
      attributes: ['user', 'system', 'idle']
    },
    
    // Rede
    network: {
      name: 'NetworkUsage',
      attributes: ['sent', 'received', 'latency']
    }
  },

  // Configurações de coleta
  collection: {
    // Intervalo de coleta em ms
    interval: 60000,
    
    // Tamanho do buffer
    bufferSize: 1000,
    
    // Estratégia de amostragem
    sampling: {
      enabled: true,
      rate: 0.1 // 10% das requisições
    }
  },

  // Configurações de alerta
  alerts: {
    // Thresholds para alertas
    thresholds: {
      memory: {
        warning: 0.7, // 70% de uso
        critical: 0.9 // 90% de uso
      },
      cpu: {
        warning: 0.6,
        critical: 0.8
      },
      latency: {
        warning: 1000, // 1s
        critical: 3000 // 3s
      }
    },
    
    // Canais de notificação
    channels: ['slack', 'email'],
    
    // Agregação de alertas
    aggregation: {
      window: 300000, // 5 minutos
      minOccurrences: 3
    }
  }
}; 
'use strict';

/**
 * Configuração do New Relic para monitoramento de performance
 */
exports.config = {
  app_name: ['pemad-material-check-next'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info',
    enabled: true
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  },
  transaction_events: {
    attributes: {
      include: [
        'http.statusCode',
        'http.method',
        'http.url',
        'error.message',
        'error.class',
        'error.stack'
      ]
    }
  },
  distributed_tracing: {
    enabled: true
  },
  transaction_tracer: {
    enabled: true,
    record_sql: 'obfuscated',
    explain_threshold: 500,
    transaction_threshold: 100
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [404]
  },
  browser_monitoring: {
    enabled: true
  },
  custom_insights_events: {
    enabled: true,
    max_samples_stored: 10000
  },
  slow_sql: {
    enabled: true
  },
  cross_application_tracer: {
    enabled: true
  }
}; 
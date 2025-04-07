# Documentação de Testes do Sistema PEMAD

Este documento descreve a estrutura e estratégia de testes implementadas no sistema de gestão PEMAD, com foco especial no monitoramento de desempenho e experiência do usuário.

## Visão Geral

A estratégia de testes do PEMAD é baseada em três pilares principais:

1. **Testes Unitários**: Validam o comportamento isolado de componentes e serviços
2. **Testes de Performance**: Verificam aspectos de desempenho e eficiência
3. **Testes E2E (End-to-End)**: Simulam fluxos completos do usuário

Esta abordagem garante alta qualidade, desempenho consistente e confiabilidade do sistema, especialmente em ambientes de campo com conectividade limitada.

## Estrutura de Diretórios

```
pemad-material-check-next/
├── cypress/                      # Testes E2E com Cypress
│   ├── e2e/                      # Cenários de teste E2E
│   ├── support/                  # Utilitários e comandos personalizados
│   └── tsconfig.json             # Configuração TypeScript para Cypress
├── src/
│   ├── components/
│   │   └── __tests__/            # Testes unitários de componentes
│   ├── hooks/
│   │   └── __tests__/            # Testes unitários de hooks
│   ├── services/
│   │   └── __tests__/            # Testes unitários e de performance de serviços
│   └── types/                    # Definições de tipo para testes
├── .github/
│   └── workflows/                # Configurações de CI/CD
│       └── test.yml              # Pipeline de testes automatizados
└── cypress.config.ts             # Configuração do Cypress
```

## Testes Unitários

### Localização
- `src/components/__tests__/`
- `src/hooks/__tests__/`
- `src/services/__tests__/`

### Tecnologias
- Jest
- Testing Library
- Mock Service Worker

### Execução
```bash
# Executar todos os testes unitários
npm test

# Executar com watch mode (desenvolvimento)
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

### Exemplos Implementados
- Testes do componente `ServiceWorkerUpdater`
- Testes do hook `useServiceWorker`
- Testes do serviço de métricas
- Testes do serviço RUM (Real User Monitoring)

## Testes de Performance

### Localização
- `src/services/__tests__/service-worker-performance.test.ts`

### Métricas Avaliadas
- Tempo de registro do Service Worker
- Eficiência do cache de recursos
- Overhead de requisições fetch
- Uso de memória
- Comparativo de carregamento via rede vs. cache

### Execução
```bash
npm run test:perf
```

## Testes E2E

### Localização
- `cypress/e2e/`

### Tecnologias
- Cypress
- TypeScript

### Cenários Principais
- Registro e ativação do Service Worker
- Cache de recursos críticos
- Notificação de atualizações disponíveis
- Funcionamento offline
- Preload de recursos baseado em prioridade

### Execução
```bash
# Abrir interface gráfica do Cypress
npm run cypress:open

# Executar testes E2E em modo headless
npm run cypress:run

# Executar com servidor local
npm run test:e2e
```

## Integração Contínua

Os testes são executados automaticamente através do GitHub Actions:

- A cada push para os branches `main` e `develop`
- A cada Pull Request para os branches `main` e `develop`

O pipeline `.github/workflows/test.yml` executa:
1. Testes unitários com relatório de cobertura
2. Testes de performance
3. Testes E2E com Cypress

## Monitoramento de Cobertura

A cobertura de código é monitorada através do Codecov:

- **Meta de cobertura**: 80%
- **Áreas críticas**: 90% para serviços de métricas e RUM

## Boas Práticas

### Para Testes Unitários:
- Teste uma única responsabilidade por caso de teste
- Use mocks para dependências externas
- Foque em comportamento, não em implementação
- Teste casos de erro e borda

### Para Testes E2E:
- Foque em fluxos críticos do usuário
- Mantenha testes independentes
- Use dados de teste consistentes
- Minimize acoplamento com a implementação

## Benefícios para o PEMAD

1. **Confiabilidade**: Detecção precoce de problemas
2. **Resiliência**: Garantia de funcionamento em ambientes instáveis
3. **Performance**: Monitoramento contínuo de métricas de desempenho
4. **Manutenção**: Prevenção contra regressões durante atualizações

## Próximos Passos

1. **Testes de acessibilidade** para garantir que o sistema seja utilizável por todos
2. **Testes de carga** para simular uso intensivo do sistema
3. **Integração com ferramentas de monitoramento** em produção 

## Testes de Acessibilidade

### Localização
- `src/tests/accessibility/a11y.test.tsx`

### Tecnologias
- jest-axe
- @testing-library/react
- @axe-core/react

### Aspectos Verificados
- Contraste de cores
- Navegabilidade por teclado
- Textos alternativos
- Estrutura semântica
- Acessibilidade ARIA

### Execução
```bash
# Executar testes de acessibilidade
npm test -- src/tests/accessibility
```

## Testes de Carga

### Localização
- `load-tests/service-worker-load.js`

### Tecnologias
- k6

### Cenários de Teste
- **Uso Normal**: Simula usuários navegando normalmente pelo sistema (ramping até 50 usuários)
- **Alta Carga**: Simula períodos de uso intensivo (100 requisições por segundo)
- **Conexão Intermitente**: Simula ambientes com conectividade instável (alternância entre online/offline)

### Métricas Avaliadas
- Tempo de ativação do Service Worker
- Taxa de acerto do cache (cache hit rate)
- Taxa de sucesso de requisições offline
- Tempo de resposta de requisições

### Execução
```bash
# Instalar k6
npm install -g k6

# Executar teste de carga
k6 run load-tests/service-worker-load.js

# Executar cenário específico
k6 run --tag scenario=high_load load-tests/service-worker-load.js
```

## Monitoramento em Produção

### Localização
- `src/monitoring/new-relic-integration.ts`

### Tecnologias
- New Relic Browser
- @newrelic/next

### Recursos Implementados
- Rastreamento automático de erros
- Monitoramento de performance do Service Worker
- Alertas configuráveis para métricas críticas
- Integração com o serviço de métricas existente

### Configuração
Para configurar o monitoramento em produção, adicione no `_app.tsx`:

```typescript
import { newRelicIntegration } from '../monitoring/new-relic-integration';

// Inicializar New Relic em produção
if (process.env.NODE_ENV === 'production') {
  newRelicIntegration.initialize({
    // Configurações específicas se necessário
  });
  
  // Configurar alertas para métricas críticas
  newRelicIntegration.configureAlerts([
    {
      metricName: 'error_rate',
      thresholdType: 'above',
      thresholdValue: 5,
      durationMinutes: 5,
      priority: 'high',
      notifyChannels: ['email', 'slack']
    }
  ]);
}
```

### Testes de Integração
- `src/monitoring/__tests__/new-relic-integration.test.ts` 
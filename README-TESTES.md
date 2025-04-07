# Guia Prático de Testes para Desenvolvedores - Sistema PEMAD

Este guia prático ajudará você a executar, criar e manter testes no sistema PEMAD.

## Índice

1. [Primeiros Passos](#primeiros-passos)
2. [Executando Testes](#executando-testes)
3. [Escrevendo Novos Testes](#escrevendo-novos-testes)
4. [Depurando Testes](#depurando-testes)
5. [Integração Contínua](#integração-contínua)
6. [FAQ](#faq)

## Primeiros Passos

Antes de começar, certifique-se de ter todas as dependências instaladas:

```bash
# Instalar dependências do projeto
npm install

# Instalar dependências globais necessárias
npm install -g cypress
```

## Executando Testes

### Testes Unitários

```bash
# Executar todos os testes unitários
npm test

# Executar testes de um arquivo específico
npm test -- src/services/__tests__/metrics.service.test.ts

# Executar em modo watch (desenvolvimento)
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

### Testes de Performance

```bash
# Executar todos os testes de performance
npm run test:perf
```

### Testes E2E

```bash
# Abrir Cypress em modo interativo
npm run cypress:open

# Executar todos os testes E2E em modo headless
npm run cypress:run

# Executar um teste específico
npx cypress run --spec "cypress/e2e/service-worker.cy.ts"

# Executar com servidor local (inicia o servidor antes dos testes)
npm run test:e2e
```

### Testes de Acessibilidade

```bash
# Executar testes de acessibilidade
npm test -- src/tests/accessibility

# Executar com configurações específicas de regras axe
npm test -- src/tests/accessibility --testPathIgnorePatterns=node_modules
```

### Testes de Carga

```bash
# Instalar k6 (necessário apenas na primeira vez)
npm install -g k6

# Executar teste de carga padrão
k6 run load-tests/service-worker-load.js

# Executar cenário específico
k6 run --tag scenario=high_load load-tests/service-worker-load.js

# Executar teste de carga com limite de tempo
k6 run --duration 30s load-tests/service-worker-load.js

# Salvar relatório em JSON
k6 run --out json=result.json load-tests/service-worker-load.js
```

### Executar Todos os Testes

```bash
# Executa testes unitários, de performance e E2E
npm run test:all
```

## Escrevendo Novos Testes

### Testes Unitários

Crie seus testes em arquivos `.test.ts` ou `.test.tsx` dentro da pasta `__tests__` correspondente ao componente ou serviço que está testando:

```typescript
// src/components/__tests__/MeuComponente.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MeuComponente } from '../MeuComponente';

describe('MeuComponente', () => {
  it('deve renderizar corretamente', () => {
    render(<MeuComponente />);
    expect(screen.getByText('Texto esperado')).toBeInTheDocument();
  });
});
```

### Testes E2E

Crie seus testes em arquivos `.cy.ts` dentro da pasta `cypress/e2e/`:

```typescript
// cypress/e2e/meu-fluxo.cy.ts
describe('Meu Fluxo', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve completar o fluxo corretamente', () => {
    cy.get('[data-testid="meu-botao"]').click();
    cy.contains('Resultado esperado').should('be.visible');
  });
});
```

## Depurando Testes

### Testes Unitários

```typescript
// Adicione .only para executar apenas este teste
it.only('deve fazer algo específico', () => {
  // ...
});

// Adicione .debug() para ver o DOM renderizado
it('deve renderizar corretamente', () => {
  render(<MeuComponente />);
  screen.debug();
});

// Use console.log para depurar variáveis
it('deve calcular corretamente', () => {
  const result = calcularAlgo(5);
  console.log('Resultado:', result);
  expect(result).toBe(10);
});
```

### Testes E2E

```typescript
// Pause a execução para inspeção manual
it('deve completar o fluxo', () => {
  cy.get('button').click();
  cy.pause(); // Pausa aqui para inspeção
  cy.contains('Resultado').should('be.visible');
});

// Use cy.log para depurar
it('deve mostrar dados', () => {
  cy.intercept('GET', '/api/dados').as('getDados');
  cy.get('button').click();
  cy.wait('@getDados').then(interception => {
    cy.log('Resposta da API:', interception.response.body);
  });
});
```

## Integração Contínua

Os testes são executados automaticamente no GitHub Actions:

- Quando você cria um Pull Request para `main` ou `develop`
- Quando você faz push para `main` ou `develop`

Verifique o status dos testes em `.github/workflows/test.yml`.

### Executando Localmente a Pipeline de CI

```bash
# Instalar act (executor local de GitHub Actions)
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Executar a pipeline de testes
act -j test
```

## FAQ

### Os testes estão lentos. Como posso melhorar o desempenho?

- **Testes Unitários**: Use `jest --runInBand` para executar em série em vez de paralelo
- **Testes E2E**: Use `cypress run --config video=false` para desabilitar gravação de vídeo

### Como simular diferentes condições de rede nos testes E2E?

Use o comando personalizado do Cypress:

```typescript
cy.setNetworkCondition('slow-3g'); // Simula 3G lento
```

Opções disponíveis: `online`, `offline`, `slow-3g`, `fast-3g`, `3g`, `4g`.

### Como testar componentes que usam o hook `useServiceWorker`?

Sempre mock o hook em seus testes:

```typescript
jest.mock('../../hooks/useServiceWorker', () => ({
  useServiceWorker: jest.fn().mockReturnValue({
    registration: { active: { state: 'activated' } },
    updateAvailable: false,
    error: null,
    update: jest.fn(),
    skipWaiting: jest.fn()
  })
}));
```

### Como posso testar a experiência offline?

Nos testes E2E:

```typescript
it('deve funcionar offline', () => {
  // Primeiro carregue a página online
  cy.visit('/');
  
  // Aguarde o Service Worker ser ativado
  cy.waitForServiceWorkerActivation();
  
  // Simule modo offline
  cy.setNetworkCondition('offline');
  
  // Recarregue a página
  cy.reload();
  
  // Verifique se os recursos críticos ainda estão disponíveis
  cy.get('h1').should('be.visible');
  cy.get('button').should('be.enabled');
});
```

### Como testar a acessibilidade de novos componentes?

Use o jest-axe nos seus testes:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

// Estender as expectativas do Jest
expect.extend(toHaveNoViolations);

it('não deve ter violações de acessibilidade', async () => {
  const { container } = render(<MeuComponente />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Como executar testes de carga localmente com dados mais realistas?

Crie um arquivo de ambiente para o k6:

```javascript
// environment.js
export default {
  baseUrl: 'http://localhost:3000',
  apiEndpoint: 'http://localhost:3000/api',
  userCount: 50,
  testDuration: '2m'
};
```

E use-o nos seus testes:

```bash
k6 run --env-file=./environment.js load-tests/service-worker-load.js
```

### Como monitorar o desempenho em produção?

Use a integração com New Relic:

```typescript
import { useNewRelic } from '../monitoring/new-relic-integration';

function MinhaFuncao() {
  const { trackError } = useNewRelic();
  
  try {
    // Seu código aqui
  } catch (error) {
    trackError(error, { 
      component: 'MinhaFuncao',
      operation: 'processarDados'
    });
  }
}
```

## Recursos Adicionais

- [Documentação completa de testes](./docs/TESTES.md)
- [Documentação do Jest](https://jestjs.io/docs/getting-started)
- [Documentação do Cypress](https://docs.cypress.io/guides/overview/why-cypress)
- [Guia de Testing Library](https://testing-library.com/docs/) 
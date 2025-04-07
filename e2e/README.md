# Testes End-to-End (E2E)

Este diretório contém os testes end-to-end do projeto, implementados usando Playwright.

## Estrutura

```
e2e/
  ├── form.spec.ts     # Testes dos componentes de formulário
  ├── performance.spec.ts # Testes de performance
  └── README.md        # Esta documentação
```

## Configuração

O projeto está configurado para executar testes em múltiplos navegadores:
- Chromium
- Firefox

### Configurações Principais

```typescript
{
  baseURL: 'http://localhost:3000',
  trace: 'on-first-retry',    // Grava trace apenas em caso de falha e retry
  screenshot: 'only-on-failure' // Captura screenshots apenas em falhas
}
```

## Scripts Disponíveis

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar testes com interface visual
npm run test:e2e:ui

# Executar testes em modo debug
npm run test:e2e:debug

# Visualizar relatório de testes
npm run test:e2e:report
```

## Casos de Teste

### Formulário (`form.spec.ts`)

1. **Preenchimento Completo**
   - Preenche todos os campos
   - Valida valores inseridos
   - Submete o formulário

2. **Validação de Campos**
   - Testa mensagens de erro para campos obrigatórios
   - Valida formato de campos específicos (email, etc)

3. **Navegação por Teclado**
   - Verifica ordem de tabulação
   - Testa acessibilidade via teclado

4. **Responsividade**
   - Testa em diferentes resoluções:
     - Desktop (1920x1080)
     - Tablet (768x1024)
     - Mobile (375x667)

5. **Estados de Loading**
   - Simula chamadas de API
   - Verifica estados de carregamento
   - Testa feedback visual

6. **Comportamento Dinâmico**
   - Testa campos condicionais
   - Valida mudanças de interface baseadas em seleções

7. **Persistência de Dados**
   - Verifica persistência após reload
   - Testa restauração de estado

8. **Upload de Arquivos**
   - Testa upload de documentos
   - Valida feedback visual

## Boas Práticas

1. **Seletores**
   - Priorizar seletores por role e label
   - Evitar seletores por CSS/XPath
   - Usar data-testid apenas quando necessário

2. **Assertions**
   - Ser específico nas validações
   - Verificar estados visuais e de dados
   - Validar acessibilidade

3. **Organização**
   - Agrupar testes relacionados
   - Usar hooks para setup comum
   - Manter testes independentes

4. **Performance**
   - Executar em paralelo quando possível
   - Minimizar operações desnecessárias
   - Reutilizar estado quando apropriado

## CI/CD

Os testes E2E são executados no GitHub Actions:
- Após os testes unitários
- Em ambiente Ubuntu
- Com Node.js 18.x
- Em múltiplos navegadores

### Artefatos

Os seguintes artefatos são gerados e armazenados:
- Relatórios de teste
- Screenshots de falhas
- Traces de execução

## Troubleshooting

### Problemas Comuns

1. **Testes Instáveis**
   - Aumentar timeouts
   - Adicionar waits explícitos
   - Verificar condições de corrida

2. **Falhas de Seletor**
   - Verificar mudanças na UI
   - Confirmar labels e roles
   - Usar seletores mais robustos

3. **Problemas de Performance**
   - Reduzir operações custosas
   - Otimizar setup/teardown
   - Paralelizar quando possível

### Debug

Para debugar testes:
1. Use `npm run test:e2e:debug`
2. Adicione `await page.pause()` no código
3. Use a UI do Playwright para inspeção
4. Verifique os traces gerados

## Testes de Performance

### Métricas Monitoradas

1. **Core Web Vitals**
   - Largest Contentful Paint (LCP) < 2.5s
   - First Input Delay (FID) < 100ms
   - Cumulative Layout Shift (CLS) < 0.1

2. **Métricas Adicionais**
   - First Contentful Paint (FCP) < 2s
   - Time to Interactive (TTI) < 3.5s
   - Total Blocking Time (TBT) < 300ms

### Thresholds de Performance

```typescript
{
  performance: 0.8,    // Score mínimo de performance
  accessibility: 0.9,  // Score mínimo de acessibilidade
  'best-practices': 0.9, // Score mínimo de boas práticas
  seo: 0.9,           // Score mínimo de SEO
  pwa: 0.7            // Score mínimo de PWA
}
```

### Tipos de Testes

1. **Auditoria Lighthouse**
   - Análise completa de performance
   - Geração de relatório HTML
   - Validação de métricas principais

2. **Teste de Carga**
   - Simulação de conexão 3G
   - Medição de tempo de carregamento
   - Análise de timing dos componentes

3. **Teste de Concorrência**
   - Simulação de múltiplos usuários
   - Medição de tempos de resposta
   - Validação de performance sob carga

### Relatórios

Os relatórios de performance são gerados em:
- `lighthouse-report.html`: Relatório detalhado do Lighthouse
- Artefatos do GitHub Actions: Screenshots e traces

### Debug de Performance

1. **Análise de Relatórios**
   - Revisar relatório Lighthouse
   - Identificar gargalos de performance
   - Analisar métricas específicas

2. **Otimização**
   - Implementar melhorias sugeridas
   - Reduzir tempo de carregamento
   - Otimizar recursos

3. **Monitoramento**
   - Acompanhar tendências
   - Identificar regressões
   - Manter thresholds atualizados

## Contribuindo

Ao adicionar novos testes:

1. Seguir o padrão existente
2. Documentar casos complexos
3. Validar em todos os navegadores
4. Verificar performance
5. Atualizar esta documentação 
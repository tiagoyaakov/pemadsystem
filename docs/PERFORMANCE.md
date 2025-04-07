# Monitoramento de Performance

Este documento descreve o sistema de monitoramento de performance implementado no projeto.

## Visão Geral

O sistema de monitoramento de performance consiste em:
- Testes automatizados de performance
- Coleta e análise de métricas
- Geração de relatórios
- Sistema de alertas
- Histórico e tendências

## Métricas Monitoradas

### Core Web Vitals

1. **Largest Contentful Paint (LCP)**
   - Limite: 2.5s
   - Mede o tempo de renderização do maior elemento visível

2. **First Input Delay (FID)**
   - Limite: 100ms
   - Mede o tempo de resposta ao primeiro input do usuário

3. **Cumulative Layout Shift (CLS)**
   - Limite: 0.1
   - Mede a estabilidade visual da página

### Métricas Adicionais

1. **First Contentful Paint (FCP)**
   - Limite: 2s
   - Primeira renderização de conteúdo

2. **Time to Interactive (TTI)**
   - Limite: 3.5s
   - Tempo até a página se tornar interativa

3. **Total Blocking Time (TBT)**
   - Limite: 300ms
   - Tempo total de bloqueio do thread principal

4. **Speed Index**
   - Limite: 3s
   - Índice de velocidade de carregamento

## Thresholds e Alertas

### Scores Mínimos

```typescript
{
  performance: 0.8,    // 80%
  accessibility: 0.9,  // 90%
  'best-practices': 0.9, // 90%
  seo: 0.9,           // 90%
  pwa: 0.7            // 70%
}
```

### Sistema de Alertas

- Regressão > 5% em qualquer métrica
- Tendência negativa por 7 dias consecutivos
- Violação de thresholds críticos

## Scripts Disponíveis

```bash
# Executar auditoria de performance
npm run monitor:performance

# Monitoramento contínuo
npm run monitor:performance:watch

# Visualizar último relatório
npm run monitor:performance:report

# Limpar relatórios antigos
npm run monitor:performance:cleanup
```

## Relatórios

### Localização
- HTML: `./performance-reports/performance-report-{timestamp}.html`
- JSON: `./performance-reports/performance-report-{timestamp}.json`
- Métricas: `./performance-metrics.json`
- Histórico: `./performance-history.json`

### Retenção
- Relatórios são mantidos por 30 dias
- Limpeza automática via `monitor:performance:cleanup`

## CI/CD

### GitHub Actions

O workflow inclui:
1. Testes de performance após testes E2E
2. Verificação de regressões
3. Upload de relatórios como artefatos
4. Alertas em caso de falha

### Artefatos Gerados

- Relatório Lighthouse
- Screenshots de falhas
- Histórico de métricas
- Logs de execução

## Troubleshooting

### Problemas Comuns

1. **Falsos Positivos**
   - Verificar carga do servidor
   - Confirmar estabilidade da rede
   - Validar ambiente de teste

2. **Regressões Inesperadas**
   - Revisar mudanças recentes
   - Verificar dependências
   - Analisar logs do servidor

3. **Timeouts**
   - Aumentar limites de tempo
   - Verificar recursos bloqueantes
   - Otimizar carregamento inicial

## Boas Práticas

1. **Monitoramento Regular**
   - Executar testes diariamente
   - Revisar tendências semanalmente
   - Atualizar thresholds conforme necessário

2. **Otimização Contínua**
   - Identificar gargalos
   - Implementar melhorias incrementais
   - Medir impacto das mudanças

3. **Manutenção**
   - Limpar relatórios antigos
   - Atualizar dependências
   - Revisar configurações

## Próximos Passos

1. **Melhorias Planejadas**
   - Integração com APM
   - Dashboards em tempo real
   - Alertas via Slack/Email

2. **Otimizações**
   - Paralelização de testes
   - Cache de recursos
   - Compressão de assets

3. **Monitoramento**
   - Métricas de usuários reais
   - Análise de campo
   - Segmentação por dispositivo/região

## APM (Application Performance Monitoring)

### New Relic Integration

O projeto utiliza o New Relic para monitoramento em tempo real:

1. **Configuração**
   - Arquivo: `newrelic.js`
   - Variáveis de ambiente necessárias:
     ```bash
     NEW_RELIC_LICENSE_KEY=your_license_key
     NEW_RELIC_APP_NAME=pemad-material-check-next
     ```

2. **Métricas Coletadas**

   a. **Métricas de Usuário**
   - Tempo de interação com componentes
   - Erros de formulário
   - Navegação entre páginas

   b. **Métricas de Recursos**
   - Tempo de carregamento de componentes
   - Chamadas de API
   - Eficiência de cache

   c. **Métricas de Negócio**
   - Conversão
   - Engajamento
   - Uso de features

   d. **Métricas de Infraestrutura**
   - Uso de memória
   - Uso de CPU
   - Uso de rede

3. **Coleta de Dados**
   - Intervalo: 60 segundos
   - Buffer: 1000 eventos
   - Amostragem: 10% das requisições

4. **Alertas**
   
   a. **Thresholds**
   - Memória: 70% (warning), 90% (critical)
   - CPU: 60% (warning), 80% (critical)
   - Latência: 1s (warning), 3s (critical)

   b. **Agregação**
   - Janela: 5 minutos
   - Mínimo de ocorrências: 3

### Uso no Código

1. **Hook useMetrics**
   ```typescript
   const { trackInteraction, trackFormError, trackNavigation } = useMetrics({
     componentName: 'MyComponent',
     dependencies: ['dep1', 'dep2'],
     trackInteractions: true,
     trackEngagement: true
   });
   ```

2. **Tracking de Interações**
   ```typescript
   const interaction = trackInteraction('click');
   // ... código da interação ...
   interaction.end();
   ```

3. **Tracking de Erros**
   ```typescript
   trackFormError('email', 'invalid', 'test@test');
   ```

4. **Tracking de Navegação**
   ```typescript
   const navigation = trackNavigation('/next-page');
   // ... navegação ...
   navigation.end();
   ```

### Dashboard

O New Relic fornece dashboards para:
1. Visão geral da aplicação
2. Performance de frontend
3. Performance de backend
4. Erros e exceções
5. Métricas de usuário
6. Métricas de infraestrutura

### Troubleshooting

1. **Coleta de Dados**
   - Verificar configuração do New Relic
   - Validar chave de licença
   - Confirmar conexão com APM

2. **Alertas**
   - Revisar thresholds
   - Verificar canais de notificação
   - Ajustar agregação

3. **Performance**
   - Analisar transações lentas
   - Identificar gargalos
   - Otimizar código problemático

### Boas Práticas

1. **Instrumentação**
   - Instrumentar pontos críticos
   - Usar amostragem adequada
   - Manter métricas relevantes

2. **Alertas**
   - Definir thresholds realistas
   - Evitar falsos positivos
   - Manter equipe informada

3. **Manutenção**
   - Revisar dashboards regularmente
   - Atualizar configurações
   - Limpar dados antigos

## Otimizações Implementadas

### 1. Carregamento de Imagens
- Componente `Image` otimizado com lazy loading
- Monitoramento de métricas de carregamento
- Suporte a imagens prioritárias
- Métricas detalhadas de performance

### 2. Sistema de Cache
- Cache inteligente com política LRU
- Monitoramento de hit rate
- Limpeza automática baseada em tamanho/idade
- Métricas de eficiência

### 3. Monitoramento de Queries
- Hook `useQueryMetrics` para tracking de performance
- Detecção de queries lentas
- Métricas por tipo de operação
- Análise de rows/second

### 4. Sistema de Alertas
- Integração com Slack
- Agregação inteligente de alertas
- Thresholds configuráveis
- Diferentes níveis de severidade

## Uso dos Componentes

### Image Component
```typescript
import { Image } from '@/components/common/Image';

// Uso básico
<Image src="/path/to/image.jpg" alt="Description" />

// Com lazy loading desativado
<Image src="/path/to/image.jpg" alt="Description" lazy={false} />

// Imagem prioritária
<Image src="/path/to/image.jpg" alt="Description" priority={true} />
```

### Cache Service
```typescript
import { cacheService } from '@/services/cache.service';

// Criar cache
cacheService.createCache({
  name: 'userCache',
  maxSize: 5 * 1024 * 1024, // 5MB
  maxAge: 3600000 // 1 hora
});

// Usar cache
const data = await cacheService.get('userCache', 'userId');
cacheService.set('userCache', 'userId', userData);
```

### Query Metrics
```typescript
import { useQueryMetrics } from '@/hooks/useQueryMetrics';

function UserList() {
  const { startQuery, endQuery, recordError } = useQueryMetrics({
    queryName: 'fetchUsers',
    queryType: 'select',
    tableName: 'users'
  });

  const fetchUsers = async () => {
    startQuery();
    try {
      const users = await db.select().from('users');
      endQuery(users.length);
      return users;
    } catch (error) {
      recordError(error);
      throw error;
    }
  };
}
```

### Alertas
```typescript
import { alertService } from '@/services/alert.service';

// Enviar alerta
await alertService.sendAlert({
  type: 'warning',
  metric: 'api_latency',
  value: 1500,
  threshold: 1000,
  component: 'UserAPI',
  details: { endpoint: '/users', method: 'GET' }
});
```

## Configuração do Slack

1. **Webhook URL**
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
   ```

2. **Canais de Alerta**
   - `#performance-alerts`: Alertas críticos
   - `#performance-warnings`: Alertas de warning
   - `#performance-metrics`: Métricas diárias

## Monitoramento em Tempo Real

### Métricas Disponíveis

1. **Performance de Imagens**
   - Tempo de carregamento
   - Tamanho do arquivo
   - Taxa de compressão
   - Falhas de carregamento

2. **Cache**
   - Hit rate por recurso
   - Uso de memória
   - Idade média dos itens
   - Taxa de evicção

3. **Queries**
   - Tempo de execução
   - Linhas processadas
   - Taxa de erro
   - Queries lentas

4. **Alertas**
   - Latência alta
   - Erros frequentes
   - Uso excessivo de recursos
   - Baixa taxa de conversão

## Boas Práticas

### Imagens
1. Use `lazy={true}` para imagens abaixo da dobra
2. Defina `priority={true}` para imagens críticas
3. Forneça dimensões sempre que possível
4. Utilize formatos otimizados (WebP, AVIF)

### Cache
1. Defina limites apropriados de tamanho
2. Monitore a taxa de hit/miss
3. Ajuste a política de expiração
4. Implemente warm-up quando necessário

### Queries
1. Monitore queries frequentes
2. Estabeleça baselines de performance
3. Otimize baseado em métricas
4. Use índices apropriadamente

### Alertas
1. Configure thresholds realistas
2. Agrupe alertas relacionados
3. Defina níveis apropriados de severidade
4. Mantenha documentação atualizada

## Real User Monitoring (RUM)

O sistema de RUM coleta métricas em tempo real sobre a experiência dos usuários, incluindo:

### Métricas de Usuário
- **Informações do Dispositivo**: tipo de dispositivo, navegador, sistema operacional
- **Conexão**: tipo de rede, velocidade de download, latência
- **Viewport**: dimensões da tela

### Métricas de Performance
- **Web Vitals**:
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - First Input Delay (FID)
  - Cumulative Layout Shift (CLS)
- **Navegação**: tempo de carregamento, TTFB, interatividade do DOM
- **Recursos**: tempo de carregamento, tamanho e tipo de recursos

### Métricas de Erro
- **JavaScript**: mensagens de erro, stack traces, localização
- **Recursos**: falhas no carregamento de imagens, scripts, etc.

### Métricas de Interação
- **Eventos**: cliques, submissões de formulário, inputs
- **Caminho do Elemento**: seletores CSS para identificação precisa
- **Duração**: tempo gasto em cada interação

### Uso

```typescript
// Inicializar o RUM
import { rumService } from '@/services/rum.service';

// No componente App ou página principal
useEffect(() => {
  rumService.init();
}, []);
```

### Configuração

O RUM está integrado com o New Relic para visualização e análise das métricas. As métricas são:

1. **Agregadas**: por região, dispositivo, navegador
2. **Amostradas**: configurável via `METRICS_CONFIG.collection.sampling`
3. **Bufferizadas**: enviadas em lote para reduzir requisições

### Alertas

O sistema gera alertas automáticos para:

- Tempos de carregamento elevados
- Erros de JavaScript frequentes
- Falhas em recursos críticos
- Problemas de performance do usuário

### Dashboard

Visualize as métricas no New Relic:

1. **Performance do Usuário**: Web Vitals, tempos de carregamento
2. **Erros**: taxa de erro, principais problemas
3. **Recursos**: performance de assets, cache hits
4. **Interações**: padrões de uso, problemas de UX

### Próximos Passos

1. **Segmentação**: adicionar segmentação por perfil de usuário
2. **Machine Learning**: identificar anomalias e padrões
3. **Automação**: auto-healing baseado em métricas
4. **Correlação**: análise cruzada entre métricas 
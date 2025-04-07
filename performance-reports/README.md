# Relatórios de Performance

Este diretório contém os relatórios gerados pelo sistema de monitoramento de performance.

## Estrutura

```
performance-reports/
  ├── performance-report-{timestamp}.html  # Relatório Lighthouse em HTML
  ├── performance-report-{timestamp}.json  # Dados brutos do relatório
  ├── .gitignore                         # Configuração do Git
  └── README.md                          # Esta documentação
```

## Retenção

- Os relatórios são mantidos por 30 dias
- A limpeza automática é executada via `npm run monitor:performance:cleanup`
- Apenas o `.gitignore` e este README são versionados

## Visualização

Para visualizar o relatório mais recente:
```bash
npm run monitor:performance:report
```

## Análise

Os relatórios incluem:
- Métricas de performance
- Screenshots de problemas
- Recomendações de otimização
- Histórico de tendências

## Integração

Os relatórios são:
1. Gerados automaticamente no CI/CD
2. Armazenados como artefatos do GitHub Actions
3. Analisados para detecção de regressões
4. Utilizados para alertas de performance 
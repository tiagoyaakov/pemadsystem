# Guia de Deploy na Vercel

Este documento contém as instruções para fazer deploy do PEMAD Material Check na plataforma Vercel.

## Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. CLI da Vercel instalada (opcional, para deploy via linha de comando)
   ```
   npm install -g vercel
   ```
3. Projeto do Supabase configurado e funcionando
4. Chave de API da NASA FIRMS 

## Verificação Pré-Deploy

Execute o script de verificação pré-deploy para garantir que tudo está pronto:

```bash
npm run pre-deploy-check
```

Este script verifica:
- Arquivos necessários para o PWA
- Configuração do Vercel
- Variáveis de ambiente
- Dependências e scripts
- Build de teste
- Linting
- Tamanho do bundle

## Deploy Automatizado

Para fazer deploy automaticamente usando nossa configuração:

```bash
# Para ambiente de produção
npm run deploy

# Para criar um preview (ambiente de teste)
npm run deploy:preview
```

## Deploy Manual pela Interface da Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "New Project"
3. Importe o repositório do GitHub
4. Configure as variáveis de ambiente:

   | Nome | Valor | Descrição |
   |------|-------|-----------|
   | NEXT_PUBLIC_SUPABASE_URL | https://xxxx.supabase.co | URL do seu projeto Supabase |
   | NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJxxxxx | Chave anônima do Supabase |
   | NEXT_PUBLIC_SUPABASE_PROJECT_ID | xxxx | ID do projeto Supabase |
   | NEXT_PUBLIC_NASA_FIRMS_API_KEY | xxxxx | Chave da API NASA FIRMS |
   | EVOLUTION_API_URL | https://xxxxx | URL da Evolution API (se aplicável) |
   | EVOLUTION_API_KEY | xxxxx | Chave da Evolution API (se aplicável) |
   | EVOLUTION_API_INSTANCE | xxxxx | Instância da Evolution API (se aplicável) |

5. Em "Build and Output Settings", mantenha as configurações padrão
6. Clique em "Deploy"

## Personalização de Domínio (Opcional)

1. Após o deploy, vá para a aba "Domains"
2. Adicione seu domínio personalizado
3. Siga as instruções para configurar os registros DNS

## Monitoramento e Logs

1. Após o deploy, vá para a aba "Analytics" para monitorar o desempenho
2. Use a aba "Logs" para visualizar os logs do projeto

## Resolução de Problemas

### Falha no Build

- Verifique se todas as dependências estão instaladas corretamente
- Verifique se o arquivo `vercel.json` está configurado corretamente
- Consulte os logs de build para identificar o problema

### Problemas com Variáveis de Ambiente

- Verifique se todas as variáveis de ambiente necessárias estão configuradas
- Verifique se as variáveis de ambiente estão sendo acessadas corretamente no código

### Problemas com PWA

- Verifique se o service worker está sendo registrado corretamente
- Verifique se o manifesto está configurado corretamente
- Use ferramentas como Lighthouse para diagnosticar problemas com o PWA

## Dicas e Boas Práticas

- Sempre use o ambiente de preview antes de fazer deploy em produção
- Configure alertas para monitorar o desempenho e erros
- Use o recurso de proteção de branches para evitar deploys acidentais
- Considere configurar um pipeline de CI/CD para automatizar testes antes do deploy

## Contato e Suporte

Para suporte técnico relacionado ao deploy, entre em contato com a equipe de desenvolvimento. 
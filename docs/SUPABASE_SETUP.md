# Configuração do Banco de Dados Supabase

Este documento contém as instruções necessárias para configurar o banco de dados Supabase para o projeto PEMAD Material Check.

## Pré-requisitos

- Uma conta no [Supabase](https://supabase.com/)
- Permissões para criar e gerenciar projetos

## Criando um Projeto no Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.io/)
2. Clique em "New Project"
3. Preencha as informações do projeto:
   - Nome: `pemad-material-check` (ou outro nome de sua escolha)
   - Database Password: Crie uma senha forte
   - Region: Escolha a região mais próxima de seus usuários (preferencialmente na América do Sul)
4. Clique em "Create New Project"
5. Aguarde a conclusão da inicialização do projeto (pode levar alguns minutos)

## Configuração do Esquema do Banco de Dados

Há duas maneiras de configurar o esquema do banco de dados:

### Opção 1: Executar os Scripts SQL no Editor SQL

1. No dashboard do seu projeto, acesse a seção "SQL Editor"
2. Copie o conteúdo do arquivo `src/migrations/initial_schema.sql`
3. Cole no editor SQL e execute o script
4. Aguarde a conclusão da execução
5. Se desejar adicionar dados de exemplo, repita o processo com o arquivo `src/migrations/sample_data.sql`

### Opção 2: Utilizar o cliente da linha de comando Supabase

1. Instale a CLI do Supabase seguindo as [instruções oficiais](https://supabase.com/docs/guides/cli)
2. Faça login na sua conta: `supabase login`
3. Inicie o projeto: `supabase init`
4. Copie os arquivos SQL para a pasta de migrações:
   ```bash
   mkdir -p supabase/migrations
   cp src/migrations/initial_schema.sql supabase/migrations/20230101000000_initial_schema.sql
   cp src/migrations/sample_data.sql supabase/migrations/20230101000001_sample_data.sql
   ```
5. Execute as migrações: `supabase db push`

## Configurando Autenticação

1. No dashboard do Supabase, vá para a seção "Authentication" > "Settings"
2. Em "Email Auth", certifique-se de que "Enable Email Signup" está habilitado
3. Configure as opções de acordo com suas necessidades:
   - Disable email confirmations (opcional, para facilitar o desenvolvimento)
   - Customize as templates de e-mail se necessário

## Configurando Storage

1. No dashboard do Supabase, vá para a seção "Storage"
2. Crie três buckets:
   - `avatars` - para armazenar fotos de perfil dos usuários
   - `materiais` - para armazenar fotos dos materiais
   - `incidentes` - para armazenar imagens relacionadas a incidentes

3. Configure as permissões para cada bucket (exemplo para o bucket `materiais`):
   ```sql
   CREATE POLICY "Materiais acessíveis a todos" ON storage.objects
     FOR SELECT USING (bucket_id = 'materiais');

   CREATE POLICY "Inserções de materiais para usuários autenticados" ON storage.objects
     FOR INSERT WITH CHECK (
       bucket_id = 'materiais' AND
       auth.role() = 'authenticated'
     );

   CREATE POLICY "Atualizações de materiais pelo proprietário" ON storage.objects
     FOR UPDATE USING (
       bucket_id = 'materiais' AND
       auth.uid() = owner
     );
   ```

## Configuração das Variáveis de Ambiente

Após configurar o projeto, você precisará configurar as variáveis de ambiente no seu aplicativo:

1. No dashboard do Supabase, vá para "Settings" > "API"
2. Copie a URL do projeto e a chave anônima
3. Crie ou atualize o arquivo `.env.local` na raiz do projeto com:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

## Verificando a Configuração

Para verificar se a configuração foi concluída com sucesso:

1. Execute o seguinte comando no SQL Editor:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

2. Você deverá ver uma lista de tabelas incluindo:
   - users
   - alas
   - checklist_locations
   - materials
   - checklists
   - checklist_items
   - alteracoes_materiais
   - fire_incidents
   - notificacoes

## Manutenção do Banco de Dados

### Backups

O Supabase realiza backups automáticos diários, mas você também pode:

1. Exportar dados manualmente: No SQL Editor, execute:
   ```sql
   COPY (SELECT * FROM sua_tabela) TO STDOUT WITH CSV HEADER;
   ```

2. Ou utilize o CLI do Supabase para fazer backups:
   ```bash
   supabase db dump -f backup.sql
   ```

### Monitoramento

1. Utilize o Dashboard do Supabase para monitorar:
   - Utilização de recursos
   - Número de requisições
   - Performance do banco de dados

2. Configure alertas em "Settings" > "Database" > "Database Health"

## Resolução de Problemas

Se encontrar problemas durante a configuração:

1. Verifique os logs no dashboard do Supabase ("Logs" > "Database Logs")
2. Certifique-se de que todas as extensões necessárias estão habilitadas
3. Verifique se há conflitos de políticas RLS (Row Level Security)
4. Verifique as permissões do usuário que está executando as consultas

Para suporte adicional, consulte a [documentação oficial do Supabase](https://supabase.com/docs) ou acesse o [fórum da comunidade](https://github.com/supabase/supabase/discussions). 
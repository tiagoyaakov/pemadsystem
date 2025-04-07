# Gerenciamento de Migrações no Supabase

Este documento apresenta as melhores práticas para gerenciar atualizações e migrações no banco de dados Supabase do projeto PEMAD Material Check.

## Conceitos Básicos

Migrações de banco de dados são arquivos que contêm instruções SQL para modificar a estrutura do banco de dados de forma controlada. Elas permitem:

- Rastrear mudanças no esquema do banco de dados
- Aplicar essas mudanças de forma consistente em diferentes ambientes
- Fazer rollback de mudanças se necessário
- Colaborar em equipe sem conflitos de mudanças no banco

## Organização das Migrações

No projeto PEMAD Material Check, as migrações são organizadas da seguinte forma:

```
src/
└── migrations/
    ├── initial_schema.sql        # Esquema inicial do banco de dados
    ├── sample_data.sql           # Dados de exemplo para desenvolvimento
    └── updates/
        ├── 20230401_add_field_X.sql
        ├── 20230415_create_table_Y.sql
        └── ...
```

## Criando uma Nova Migração

### Convenções de Nomenclatura

- Use o formato: `YYYYMMDD_descricao_breve.sql`
- A data (YYYYMMDD) deve ser a data prevista para aplicação
- A descrição deve ser clara e indicar o propósito da migração

### Estrutura de uma Migração

Cada arquivo de migração deve:

1. Começar com um comentário descrevendo o propósito da migração
2. Incluir instruções para verificar se a migração já foi aplicada
3. Incluir instruções para rollback se necessário

Exemplo:

```sql
-- Migração: Adicionar campo de coordenadas geográficas à tabela de location
-- Data: 2023-04-15

-- Verificar se a migração já foi aplicada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'checklist_locations'
        AND column_name = 'geolocation'
    ) THEN
        -- Adicionar campo de geolocalização
        ALTER TABLE checklist_locations
        ADD COLUMN geolocation POINT;
        
        -- Adicionar índice espacial
        CREATE INDEX idx_checklist_locations_geolocation
        ON checklist_locations USING GIST (geolocation);
        
        RAISE NOTICE 'Migração aplicada: Adicionado campo geolocation à tabela checklist_locations';
    ELSE
        RAISE NOTICE 'Migração já aplicada anteriormente';
    END IF;
END $$;

-- Para rollback, execute:
/*
ALTER TABLE checklist_locations DROP COLUMN IF EXISTS geolocation;
DROP INDEX IF EXISTS idx_checklist_locations_geolocation;
*/
```

## Aplicando Migrações

### Ambiente de Desenvolvimento

1. Conecte-se ao banco de dados usando o SQL Editor do Supabase
2. Abra o arquivo de migração
3. Execute o script SQL
4. Verifique se as alterações foram aplicadas corretamente

### Ambiente de Produção

Antes de aplicar uma migração em produção:

1. Teste a migração no ambiente de desenvolvimento
2. Faça backup do banco de dados atual
3. Aplique a migração durante períodos de baixa utilização
4. Tenha um plano de rollback pronto

## Rastreamento de Migrações

Para facilitar o rastreamento das migrações aplicadas, criamos uma tabela de controle:

```sql
-- Criar tabela de controle de migrações se ainda não existir
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    applied_by TEXT,
    status TEXT CHECK (status IN ('success', 'failed', 'reverted')) DEFAULT 'success',
    details TEXT
);
```

Cada migração deve registrar sua execução nesta tabela:

```sql
-- Registrar a migração na tabela de histórico
INSERT INTO migration_history (migration_name, applied_by, details)
VALUES ('20230415_add_geolocation', current_user, 'Adicionado campo de geolocalização à tabela checklist_locations');
```

## Migrações Complexas

### Migrações com Dados

Quando uma migração envolve transformação de dados existentes:

1. Faça uma estimativa do tempo de execução com base no volume de dados
2. Considere criar uma tabela temporária para evitar bloqueios prolongados
3. Utilize transações para garantir a consistência dos dados

Exemplo:

```sql
BEGIN;

-- Criar tabela temporária
CREATE TEMP TABLE temp_materials AS
SELECT * FROM materials WHERE 1=0;

-- Copiar dados com transformação
INSERT INTO temp_materials
SELECT
    id,
    nome,
    codigo,
    foto_url,
    quantidade_esperada,
    location_id,
    created_at,
    updated_at,
    is_active,
    COALESCE(categoria, 'Sem categoria') as categoria, -- Transformação: valores nulos para 'Sem categoria'
    unidade_medida,
    posicao,
    prateleira,
    prioridade
FROM materials;

-- Limpar tabela original
TRUNCATE materials;

-- Restaurar dados transformados
INSERT INTO materials SELECT * FROM temp_materials;

-- Limpar
DROP TABLE temp_materials;

COMMIT;
```

### Migrações com Dependências

Para migrações com dependências entre tabelas:

1. Identifique todas as dependências (chaves estrangeiras, triggers, views)
2. Planeje a ordem correta das alterações
3. Desative temporariamente restrições se necessário

## Práticas Recomendadas

1. **Uma Alteração por Migração**: Cada migração deve ter um único propósito
2. **Idempotência**: Migrações devem ser idempotentes (podem ser executadas várias vezes sem efeitos colaterais)
3. **Transações**: Use transações para garantir que migrações sejam atômicas
4. **Testes**: Teste as migrações em ambiente de desenvolvimento antes de produção
5. **Documentação**: Documente claramente o propósito e os efeitos de cada migração
6. **Rollback**: Sempre inclua instruções de rollback

## Rollback de Migrações

Em caso de necessidade de reverter uma migração:

1. Use o script de rollback comentado no final do arquivo de migração
2. Registre o rollback na tabela de histórico:

```sql
UPDATE migration_history
SET status = 'reverted', details = details || ' - Revertido em ' || CURRENT_TIMESTAMP
WHERE migration_name = '20230415_add_geolocation';
```

## Adaptações para Supabase

### Restrições do Supabase

Lembre-se de que o Supabase pode ter algumas limitações:

1. Acesso limitado a superuser/funções de administrador
2. Alguns comandos podem ser restritos
3. RLS (Row Level Security) pode afetar migrações

### Uso de APIs para Migração

Em alguns casos, pode ser preferível usar as APIs do Supabase para migrações ao invés de SQL direto:

```javascript
// Exemplo de migração via API JavaScript
import { supabase } from '../services/supabase';

async function migrateMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select('id, categoria');
  
  if (error) throw error;
  
  // Atualizar registros em lote
  for (const material of data) {
    if (!material.categoria) {
      await supabase
        .from('materials')
        .update({ categoria: 'Sem categoria' })
        .eq('id', material.id);
    }
  }
  
  console.log('Migração concluída');
}
```

## Integração com CI/CD

Para automatizar migrações em um pipeline CI/CD:

1. Adicione os scripts de migração ao repositório
2. Configure jobs para aplicar migrações no deploy
3. Configure verificações de validação de SQL
4. Adicione notificações para falhas de migração

## Referências

- [Documentação oficial do Supabase](https://supabase.com/docs)
- [Estratégias de migração para PostgreSQL](https://www.postgresql.org/docs/current/migration.html)
- [Ferramenta de migração pgAdmin](https://www.pgadmin.org/docs/pgadmin4/development/schema_diff.html) 
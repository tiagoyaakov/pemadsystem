-- PEMAD Material Check - Migração Inicial
-- Execute este script no SQL Editor do Supabase

-- Habilitar a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  nome_guerra TEXT NOT NULL,
  posto TEXT NOT NULL,
  telefone TEXT,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operador',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'ativo'
);

-- Comentários para documentação das colunas
COMMENT ON TABLE users IS 'Usuários do sistema PEMAD Material Check';
COMMENT ON COLUMN users.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN users.nome_guerra IS 'Nome de guerra do militar';
COMMENT ON COLUMN users.posto IS 'Posto ou graduação do militar';
COMMENT ON COLUMN users.role IS 'Função do usuário: admin, supervisor ou operador';
COMMENT ON COLUMN users.status IS 'Status do usuário: ativo, inativo ou pendente';

-- 2. Criar tabela de alas
CREATE TABLE IF NOT EXISTS alas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE alas IS 'Alas ou setores da organização';

-- 3. Criar tabela de localizações de checklist
CREATE TABLE IF NOT EXISTS checklist_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  ala_id UUID REFERENCES alas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  ordem INTEGER DEFAULT 0
);

COMMENT ON TABLE checklist_locations IS 'Localizações específicas dentro das alas para checklist';

-- 4. Criar tabela de materiais
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL,
  foto_url TEXT,
  quantidade_esperada INTEGER NOT NULL,
  location_id UUID NOT NULL REFERENCES checklist_locations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  categoria TEXT,
  unidade_medida TEXT,
  posicao INTEGER,
  prateleira TEXT,
  prioridade TEXT DEFAULT 'media'
);

COMMENT ON TABLE materials IS 'Materiais a serem verificados nos checklists';
COMMENT ON COLUMN materials.prioridade IS 'Prioridade do material: baixa, media, alta ou critica';

-- 5. Criar tabela de checklists
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  location_id UUID NOT NULL REFERENCES checklist_locations(id),
  data DATE NOT NULL,
  porcentagem NUMERIC(5,2) DEFAULT 0,
  finalizada BOOLEAN DEFAULT FALSE,
  ala_id UUID NOT NULL REFERENCES alas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  supervisor_id UUID REFERENCES users(id),
  data_finalizacao TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pendente',
  observacoes TEXT,
  turno TEXT NOT NULL DEFAULT 'manha'
);

COMMENT ON TABLE checklists IS 'Registro principal dos checklists realizados';
COMMENT ON COLUMN checklists.status IS 'Status do checklist: pendente, em_andamento, concluido, revisao, aprovado';
COMMENT ON COLUMN checklists.turno IS 'Turno do checklist: manha, tarde ou noite';

-- 6. Criar tabela de itens de checklist
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id),
  conferido BOOLEAN DEFAULT FALSE,
  quantidade_real INTEGER,
  comentario TEXT,
  has_alteration BOOLEAN DEFAULT FALSE,
  from_previous_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pendente',
  foto_url TEXT,
  verificado_por UUID REFERENCES users(id)
);

COMMENT ON TABLE checklist_items IS 'Itens individuais de cada checklist';
COMMENT ON COLUMN checklist_items.status IS 'Status do item: pendente, conferido, alterado, nao_encontrado';

-- 7. Criar tabela de alterações de materiais
CREATE TABLE IF NOT EXISTS alteracoes_materiais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL REFERENCES users(id),
  tipo TEXT NOT NULL,
  quantidade_anterior INTEGER,
  quantidade_nova INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  foto_url TEXT
);

COMMENT ON TABLE alteracoes_materiais IS 'Registro de alterações nos materiais';
COMMENT ON COLUMN alteracoes_materiais.tipo IS 'Tipo da alteração: quantidade, estado, posicao, comentario';

-- 8. Criar tabela de incêndios
CREATE TABLE IF NOT EXISTS fire_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acq_date DATE NOT NULL,
  latitude NUMERIC(10,6) NOT NULL,
  longitude NUMERIC(10,6) NOT NULL,
  brightness NUMERIC(10,2) NOT NULL,
  confidence INTEGER NOT NULL,
  frp NUMERIC(10,2) NOT NULL,
  daynight TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  distance_to_base NUMERIC(10,2),
  risk_level TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verificacao_timestamp TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE fire_incidents IS 'Registro de incidentes de incêndio próximos à base';
COMMENT ON COLUMN fire_incidents.risk_level IS 'Nível de risco: baixo, medio, alto, critico';

-- 9. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL,
  destinatario_id UUID REFERENCES users(id),
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_leitura TIMESTAMP WITH TIME ZONE,
  link TEXT,
  origem TEXT,
  prioridade TEXT DEFAULT 'normal'
);

COMMENT ON TABLE notificacoes IS 'Sistema de notificações para usuários';
COMMENT ON COLUMN notificacoes.tipo IS 'Tipo da notificação: sistema, checklist, material, incendio, usuario';
COMMENT ON COLUMN notificacoes.prioridade IS 'Prioridade da notificação: baixa, normal, alta, urgente';

-- 10. Criar view para checklists completos
CREATE OR REPLACE VIEW view_checklists_completos AS 
SELECT 
  c.id,
  c.data,
  a.nome as ala_nome,
  l.nome as location_nome,
  u.nome as user_nome,
  c.porcentagem,
  c.status,
  count(ci.id) as total_items,
  sum(CASE WHEN ci.conferido THEN 1 ELSE 0 END) as items_conferidos
FROM 
  checklists c
  JOIN alas a ON c.ala_id = a.id
  JOIN checklist_locations l ON c.location_id = l.id
  JOIN users u ON c.user_id = u.id
  LEFT JOIN checklist_items ci ON c.id = ci.checklist_id
GROUP BY
  c.id, c.data, a.nome, l.nome, u.nome, c.porcentagem, c.status;

COMMENT ON VIEW view_checklists_completos IS 'Visão consolidada dos checklists com informações de progresso';

-- 11. Criar view para materiais com alterações
CREATE OR REPLACE VIEW view_materiais_com_alteracoes AS
SELECT 
  m.id as material_id,
  m.nome as material_nome,
  m.location_id,
  l.nome as location_nome,
  count(am.id) as total_alteracoes,
  max(am.created_at) as ultima_alteracao
FROM 
  materials m
  JOIN checklist_locations l ON m.location_id = l.id
  JOIN checklist_items ci ON m.id = ci.material_id
  JOIN alteracoes_materiais am ON ci.id = am.checklist_item_id
GROUP BY
  m.id, m.nome, m.location_id, l.nome;

COMMENT ON VIEW view_materiais_com_alteracoes IS 'Visão de materiais que sofreram alterações';

-- 12. Criar função para obter checklists por período
CREATE OR REPLACE FUNCTION get_checklists_by_period(start_date DATE, end_date DATE)
RETURNS TABLE (
  id UUID,
  data DATE,
  ala_nome TEXT,
  location_nome TEXT,
  user_nome TEXT,
  porcentagem NUMERIC,
  status TEXT
)
LANGUAGE SQL
AS $$
  SELECT 
    c.id,
    c.data,
    a.nome as ala_nome,
    l.nome as location_nome,
    u.nome as user_nome,
    c.porcentagem,
    c.status
  FROM 
    checklists c
    JOIN alas a ON c.ala_id = a.id
    JOIN checklist_locations l ON c.location_id = l.id
    JOIN users u ON c.user_id = u.id
  WHERE 
    c.data BETWEEN start_date AND end_date
  ORDER BY 
    c.data DESC;
$$;

COMMENT ON FUNCTION get_checklists_by_period IS 'Função para obter checklists em um período específico';

-- 13. Criar função para obter histórico de materiais
CREATE OR REPLACE FUNCTION get_material_history(material_id UUID, days_back INTEGER)
RETURNS TABLE (
  checklist_date DATE,
  quantidade_real INTEGER,
  comentario TEXT,
  has_alteration BOOLEAN
)
LANGUAGE SQL
AS $$
  SELECT 
    c.data as checklist_date,
    ci.quantidade_real,
    ci.comentario,
    ci.has_alteration
  FROM 
    checklist_items ci
    JOIN checklists c ON ci.checklist_id = c.id
  WHERE 
    ci.material_id = material_id
    AND c.data >= CURRENT_DATE - days_back
  ORDER BY 
    c.data DESC;
$$;

COMMENT ON FUNCTION get_material_history IS 'Função para obter o histórico de um material específico';

-- 14. Configurar RLS (Row Level Security) para proteção de dados
-- Política para usuários verem apenas seus próprios dados ou supervisores verem tudo
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_policy ON users
  USING (
    (auth.uid() = id) OR 
    (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor')))
  );

-- Política para checklists
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY checklists_policy ON checklists
  USING (
    (user_id = auth.uid()) OR 
    (supervisor_id = auth.uid()) OR
    (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor')))
  );

-- 15. Criar trigger para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para todas as tabelas principais
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_alas_timestamp
  BEFORE UPDATE ON alas
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_locations_timestamp
  BEFORE UPDATE ON checklist_locations
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_materials_timestamp
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_checklists_timestamp
  BEFORE UPDATE ON checklists
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_checklist_items_timestamp
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- 16. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_materials_location ON materials(location_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_material ON checklist_items(material_id);
CREATE INDEX IF NOT EXISTS idx_alteracoes_item ON alteracoes_materiais(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_checklists_data ON checklists(data);
CREATE INDEX IF NOT EXISTS idx_checklists_user ON checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_checklists_location ON checklists(location_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_destinatario ON notificacoes(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_fire_incidents_date ON fire_incidents(acq_date);
CREATE INDEX IF NOT EXISTS idx_fire_incidents_verified ON fire_incidents(is_verified);

-- 17. Função para calcular porcentagem de conclusão de um checklist
CREATE OR REPLACE FUNCTION update_checklist_percentage()
RETURNS TRIGGER AS $$
DECLARE
  total_items INTEGER;
  checked_items INTEGER;
  percentage NUMERIC(5,2);
BEGIN
  -- Contar total de itens e itens conferidos
  SELECT COUNT(*), SUM(CASE WHEN conferido THEN 1 ELSE 0 END)
  INTO total_items, checked_items
  FROM checklist_items
  WHERE checklist_id = NEW.checklist_id;
  
  -- Calcular porcentagem
  IF total_items > 0 THEN
    percentage := (checked_items::NUMERIC / total_items::NUMERIC) * 100;
  ELSE
    percentage := 0;
  END IF;
  
  -- Atualizar checklist
  UPDATE checklists
  SET porcentagem = percentage,
      finalizada = (percentage = 100),
      status = CASE
                WHEN percentage = 0 THEN 'pendente'
                WHEN percentage = 100 THEN 'concluido'
                ELSE 'em_andamento'
              END,
      data_finalizacao = CASE
                          WHEN percentage = 100 AND (data_finalizacao IS NULL) THEN NOW()
                          ELSE data_finalizacao
                        END
  WHERE id = NEW.checklist_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar porcentagem quando um item é atualizado
CREATE TRIGGER update_checklist_percentage
  AFTER INSERT OR UPDATE OF conferido ON checklist_items
  FOR EACH ROW EXECUTE PROCEDURE update_checklist_percentage();

-- 18. Criar função para registrar alterações em materiais automaticamente
CREATE OR REPLACE FUNCTION register_material_alteration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.has_alteration = TRUE AND 
     (OLD.has_alteration = FALSE OR OLD.has_alteration IS NULL) THEN
    
    INSERT INTO alteracoes_materiais (
      checklist_item_id,
      comentario,
      user_id,
      tipo,
      quantidade_anterior,
      quantidade_nova
    ) VALUES (
      NEW.id,
      COALESCE(NEW.comentario, 'Alteração detectada durante checklist'),
      COALESCE(NEW.verificado_por, (SELECT user_id FROM checklists WHERE id = NEW.checklist_id)),
      CASE
        WHEN NEW.quantidade_real != (SELECT quantidade_esperada FROM materials WHERE id = NEW.material_id) THEN 'quantidade'
        ELSE 'estado'
      END,
      (SELECT quantidade_esperada FROM materials WHERE id = NEW.material_id),
      NEW.quantidade_real
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar alterações
CREATE TRIGGER register_material_alteration
  AFTER UPDATE OF has_alteration, quantidade_real ON checklist_items
  FOR EACH ROW EXECUTE PROCEDURE register_material_alteration(); 
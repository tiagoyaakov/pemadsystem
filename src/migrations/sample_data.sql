-- PEMAD Material Check - Dados de Exemplo
-- Execute este script após o initial_schema.sql para criar dados de teste

-- Inserir usuários de teste
INSERT INTO users (nome, nome_guerra, posto, telefone, email, senha_hash, role, status)
VALUES 
  ('Administrador Sistema', 'Admin', 'Capitão', '21999887766', 'admin@pemad.mil.br', '$2a$10$dRansFP7JIRxlPGITYnJ/.LJQRLRQrS.gRj4p5XwbQB0fY2KLm2we', 'admin', 'ativo'),
  ('Supervisor Teste', 'Super', 'Tenente', '21998765432', 'supervisor@pemad.mil.br', '$2a$10$fBDI5xrmV0rZsGHFI3qN8.KMrdR1GH5E5O3E0gYvJ2J8.LwUlnCXC', 'supervisor', 'ativo'),
  ('Operador Exemplo', 'Oper', 'Sargento', '21987654321', 'operador@pemad.mil.br', '$2a$10$5.ZFUvMJ7jPXGRD1ROv01eZzXwj.EUQhz7Q8bh3xvKijMk1UEeUru', 'operador', 'ativo');

-- Inserir alas
INSERT INTO alas (nome, codigo, descricao)
VALUES 
  ('Ala Norte', 'NORTE', 'Setor norte do complexo'),
  ('Ala Central', 'CENTRAL', 'Área central do complexo'),
  ('Ala Sul', 'SUL', 'Setor sul do complexo');

-- Inserir localizações de checklist
INSERT INTO checklist_locations (nome, descricao, ala_id, ordem)
VALUES 
  ('Depósito 1', 'Depósito principal de equipamentos', (SELECT id FROM alas WHERE codigo = 'NORTE'), 1),
  ('Sala de Emergência', 'Sala com equipamentos de emergência', (SELECT id FROM alas WHERE codigo = 'CENTRAL'), 2),
  ('Almoxarifado', 'Armazenamento de materiais diversos', (SELECT id FROM alas WHERE codigo = 'SUL'), 3);

-- Inserir materiais
INSERT INTO materials (nome, codigo, quantidade_esperada, location_id, categoria, unidade_medida, posicao, prateleira, prioridade)
VALUES 
  -- Depósito 1
  ('Extintor CO2', 'EXT-CO2-001', 5, (SELECT id FROM checklist_locations WHERE nome = 'Depósito 1'), 'Emergência', 'unidade', 1, 'A1', 'alta'),
  ('Mangueira de Incêndio', 'MAN-INC-001', 3, (SELECT id FROM checklist_locations WHERE nome = 'Depósito 1'), 'Emergência', 'unidade', 2, 'A2', 'alta'),
  ('Rádio Comunicador', 'RAD-COM-001', 10, (SELECT id FROM checklist_locations WHERE nome = 'Depósito 1'), 'Comunicação', 'unidade', 3, 'B1', 'media'),
  
  -- Sala de Emergência
  ('Kit Primeiros Socorros', 'KIT-PS-001', 2, (SELECT id FROM checklist_locations WHERE nome = 'Sala de Emergência'), 'Médico', 'unidade', 1, 'A1', 'critica'),
  ('Desfibrilador', 'DEF-001', 1, (SELECT id FROM checklist_locations WHERE nome = 'Sala de Emergência'), 'Médico', 'unidade', 2, 'A2', 'critica'),
  ('Máscara de Oxigênio', 'MASC-OX-001', 5, (SELECT id FROM checklist_locations WHERE nome = 'Sala de Emergência'), 'Médico', 'unidade', 3, 'B1', 'alta'),
  
  -- Almoxarifado
  ('Papel A4', 'PAP-A4-001', 50, (SELECT id FROM checklist_locations WHERE nome = 'Almoxarifado'), 'Escritório', 'resma', 1, 'C1', 'baixa'),
  ('Caneta Esferográfica', 'CAN-ESF-001', 100, (SELECT id FROM checklist_locations WHERE nome = 'Almoxarifado'), 'Escritório', 'unidade', 2, 'C2', 'baixa'),
  ('Cartucho de Tinta', 'CART-001', 10, (SELECT id FROM checklist_locations WHERE nome = 'Almoxarifado'), 'Escritório', 'unidade', 3, 'D1', 'media');

-- Inserir checklists
INSERT INTO checklists (user_id, location_id, data, ala_id, supervisor_id, status, turno)
VALUES 
  -- Checklist 1 - Completo
  (
    (SELECT id FROM users WHERE nome_guerra = 'Oper'), 
    (SELECT id FROM checklist_locations WHERE nome = 'Depósito 1'),
    CURRENT_DATE - INTERVAL '2 days',
    (SELECT id FROM alas WHERE codigo = 'NORTE'),
    (SELECT id FROM users WHERE nome_guerra = 'Super'),
    'aprovado',
    'manha'
  ),
  
  -- Checklist 2 - Em andamento
  (
    (SELECT id FROM users WHERE nome_guerra = 'Oper'), 
    (SELECT id FROM checklist_locations WHERE nome = 'Sala de Emergência'),
    CURRENT_DATE - INTERVAL '1 day',
    (SELECT id FROM alas WHERE codigo = 'CENTRAL'),
    NULL,
    'em_andamento',
    'tarde'
  ),
  
  -- Checklist 3 - Pendente
  (
    (SELECT id FROM users WHERE nome_guerra = 'Oper'), 
    (SELECT id FROM checklist_locations WHERE nome = 'Almoxarifado'),
    CURRENT_DATE,
    (SELECT id FROM alas WHERE codigo = 'SUL'),
    NULL,
    'pendente',
    'manha'
  );

-- Inserir itens de checklist para o Checklist 1 (Completo)
INSERT INTO checklist_items (checklist_id, material_id, conferido, quantidade_real, status, verificado_por)
SELECT 
  (SELECT id FROM checklists WHERE location_id = (SELECT id FROM checklist_locations WHERE nome = 'Depósito 1') AND data = CURRENT_DATE - INTERVAL '2 days'),
  id,
  TRUE,
  quantidade_esperada,
  'conferido',
  (SELECT id FROM users WHERE nome_guerra = 'Oper')
FROM materials
WHERE location_id = (SELECT id FROM checklist_locations WHERE nome = 'Depósito 1');

-- Inserir itens de checklist para o Checklist 2 (Em andamento)
INSERT INTO checklist_items (checklist_id, material_id, conferido, quantidade_real, status, verificado_por)
SELECT 
  (SELECT id FROM checklists WHERE location_id = (SELECT id FROM checklist_locations WHERE nome = 'Sala de Emergência') AND data = CURRENT_DATE - INTERVAL '1 day'),
  id,
  CASE WHEN ROW_NUMBER() OVER () <= 2 THEN TRUE ELSE FALSE END, -- Somente 2 conferidos
  CASE WHEN ROW_NUMBER() OVER () <= 2 THEN quantidade_esperada ELSE NULL END,
  CASE WHEN ROW_NUMBER() OVER () <= 2 THEN 'conferido' ELSE 'pendente' END,
  CASE WHEN ROW_NUMBER() OVER () <= 2 THEN (SELECT id FROM users WHERE nome_guerra = 'Oper') ELSE NULL END
FROM materials
WHERE location_id = (SELECT id FROM checklist_locations WHERE nome = 'Sala de Emergência');

-- Inserir itens de checklist para o Checklist 3 (Pendente)
INSERT INTO checklist_items (checklist_id, material_id, conferido, quantidade_real, status)
SELECT 
  (SELECT id FROM checklists WHERE location_id = (SELECT id FROM checklist_locations WHERE nome = 'Almoxarifado') AND data = CURRENT_DATE),
  id,
  FALSE,
  NULL,
  'pendente'
FROM materials
WHERE location_id = (SELECT id FROM checklist_locations WHERE nome = 'Almoxarifado');

-- Criar uma alteração em um material
UPDATE checklist_items 
SET 
  quantidade_real = 4, 
  has_alteration = TRUE,
  comentario = 'Um extintor está em manutenção',
  status = 'alterado'
WHERE 
  material_id = (SELECT id FROM materials WHERE codigo = 'EXT-CO2-001')
  AND checklist_id = (SELECT id FROM checklists WHERE location_id = (SELECT id FROM checklist_locations WHERE nome = 'Depósito 1'));

-- Inserir incidentes de incêndio
INSERT INTO fire_incidents (acq_date, latitude, longitude, brightness, confidence, frp, daynight, source, distance_to_base, risk_level)
VALUES 
  (CURRENT_DATE - INTERVAL '3 days', -22.9512, -43.1753, 325.2, 85, 40.5, 'D', 'VIIRS', 5.2, 'medio'),
  (CURRENT_DATE - INTERVAL '2 days', -22.9612, -43.1953, 450.8, 95, 62.3, 'D', 'MODIS', 3.8, 'alto'),
  (CURRENT_DATE - INTERVAL '1 day', -22.9712, -43.2153, 280.1, 75, 35.7, 'N', 'VIIRS', 8.5, 'baixo');

-- Marcar um dos incidentes como verificado
UPDATE fire_incidents
SET 
  is_verified = TRUE,
  verified_by = (SELECT id FROM users WHERE nome_guerra = 'Super'),
  verificacao_timestamp = NOW()
WHERE acq_date = CURRENT_DATE - INTERVAL '2 days';

-- Inserir notificações
INSERT INTO notificacoes (titulo, mensagem, tipo, destinatario_id, lida, prioridade)
VALUES 
  ('Checklist pendente', 'Você tem um checklist pendente para completar hoje', 'checklist', (SELECT id FROM users WHERE nome_guerra = 'Oper'), FALSE, 'normal'),
  ('Alteração em material crítico', 'Material com prioridade alta sofreu alteração', 'material', (SELECT id FROM users WHERE nome_guerra = 'Super'), FALSE, 'alta'),
  ('Incêndio detectado próximo', 'Novo incêndio detectado a 3.8km da base', 'incendio', (SELECT id FROM users WHERE nome_guerra = 'Admin'), TRUE, 'urgente'),
  ('Manutenção programada', 'Sistema entrará em manutenção amanhã às 22h', 'sistema', NULL, FALSE, 'baixa');

-- Atualizar porcentagens dos checklists para refletir os itens adicionados
-- Isso normalmente seria feito automaticamente pelo trigger, mas precisamos forçar para os dados iniciais
DO $$
DECLARE
  checklist_record RECORD;
  total_items INTEGER;
  checked_items INTEGER;
  percentage NUMERIC(5,2);
BEGIN
  FOR checklist_record IN SELECT id FROM checklists
  LOOP
    -- Contar total de itens e itens conferidos
    SELECT COUNT(*), SUM(CASE WHEN conferido THEN 1 ELSE 0 END)
    INTO total_items, checked_items
    FROM checklist_items
    WHERE checklist_id = checklist_record.id;
    
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
    WHERE id = checklist_record.id;
    
  END LOOP;
END;
$$; 
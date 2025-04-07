import { supabase } from '../services/supabase';

/**
 * Script para inicializar o banco de dados Supabase com as tabelas necessárias.
 * Deve ser executado apenas uma vez para configurar o banco de dados.
 */
async function setupDatabase() {
  console.log('Iniciando configuração do banco de dados Supabase...');

  try {
    // Verificar conexão
    const { error: connectionError } = await supabase.from('users').select('id').limit(1);
    if (connectionError && connectionError.code !== 'PGRST116') { // PGRST116 = "Table does not exist"
      throw new Error(`Erro de conexão com Supabase: ${connectionError.message}`);
    }

    // 1. Criar tabela de usuários
    console.log('Criando tabela "users"...');
    const { error: usersError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'users',
      table_definition: `
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
      `
    });
    
    if (usersError) {
      throw new Error(`Erro ao criar tabela "users": ${usersError.message}`);
    }

    // 2. Criar tabela de alas
    console.log('Criando tabela "alas"...');
    const { error: alasError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'alas',
      table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome TEXT NOT NULL,
        codigo TEXT NOT NULL UNIQUE,
        descricao TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `
    });
    
    if (alasError) {
      throw new Error(`Erro ao criar tabela "alas": ${alasError.message}`);
    }

    // 3. Criar tabela de localizações de checklist
    console.log('Criando tabela "checklist_locations"...');
    const { error: locationsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'checklist_locations',
      table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome TEXT NOT NULL,
        descricao TEXT,
        ala_id UUID REFERENCES alas(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        ordem INTEGER DEFAULT 0
      `
    });
    
    if (locationsError) {
      throw new Error(`Erro ao criar tabela "checklist_locations": ${locationsError.message}`);
    }

    // 4. Criar tabela de materiais
    console.log('Criando tabela "materials"...');
    const { error: materialsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'materials',
      table_definition: `
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
      `
    });
    
    if (materialsError) {
      throw new Error(`Erro ao criar tabela "materials": ${materialsError.message}`);
    }

    // 5. Criar tabela de checklists
    console.log('Criando tabela "checklists"...');
    const { error: checklistsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'checklists',
      table_definition: `
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
      `
    });
    
    if (checklistsError) {
      throw new Error(`Erro ao criar tabela "checklists": ${checklistsError.message}`);
    }

    // 6. Criar tabela de itens de checklist
    console.log('Criando tabela "checklist_items"...');
    const { error: itemsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'checklist_items',
      table_definition: `
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
      `
    });
    
    if (itemsError) {
      throw new Error(`Erro ao criar tabela "checklist_items": ${itemsError.message}`);
    }

    // 7. Criar tabela de alterações de materiais
    console.log('Criando tabela "alteracoes_materiais"...');
    const { error: alteracoesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'alteracoes_materiais',
      table_definition: `
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
      `
    });
    
    if (alteracoesError) {
      throw new Error(`Erro ao criar tabela "alteracoes_materiais": ${alteracoesError.message}`);
    }

    // 8. Criar tabela de incêndios
    console.log('Criando tabela "fire_incidents"...');
    const { error: fireError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'fire_incidents',
      table_definition: `
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
      `
    });
    
    if (fireError) {
      throw new Error(`Erro ao criar tabela "fire_incidents": ${fireError.message}`);
    }

    // 9. Criar tabela de notificações
    console.log('Criando tabela "notificacoes"...');
    const { error: notificacoesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'notificacoes',
      table_definition: `
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
      `
    });
    
    if (notificacoesError) {
      throw new Error(`Erro ao criar tabela "notificacoes": ${notificacoesError.message}`);
    }

    // 10. Criar view para checklists completos
    console.log('Criando view "view_checklists_completos"...');
    const { error: viewChecklistsError } = await supabase.rpc('create_view_if_not_exists', {
      view_name: 'view_checklists_completos',
      view_definition: `
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
          c.id, c.data, a.nome, l.nome, u.nome, c.porcentagem, c.status
      `
    });
    
    if (viewChecklistsError) {
      throw new Error(`Erro ao criar view "view_checklists_completos": ${viewChecklistsError.message}`);
    }

    // 11. Criar view para materiais com alterações
    console.log('Criando view "view_materiais_com_alteracoes"...');
    const { error: viewMateriaisError } = await supabase.rpc('create_view_if_not_exists', {
      view_name: 'view_materiais_com_alteracoes',
      view_definition: `
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
          m.id, m.nome, m.location_id, l.nome
      `
    });
    
    if (viewMateriaisError) {
      throw new Error(`Erro ao criar view "view_materiais_com_alteracoes": ${viewMateriaisError.message}`);
    }

    // 12. Criar função para obter checklists por período
    console.log('Criando função "get_checklists_by_period"...');
    const { error: funcChecklistsError } = await supabase.rpc('create_function_if_not_exists', {
      function_name: 'get_checklists_by_period',
      function_definition: `
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
      `
    });
    
    if (funcChecklistsError) {
      throw new Error(`Erro ao criar função "get_checklists_by_period": ${funcChecklistsError.message}`);
    }

    // 13. Criar função para obter histórico de materiais
    console.log('Criando função "get_material_history"...');
    const { error: funcMateriaisError } = await supabase.rpc('create_function_if_not_exists', {
      function_name: 'get_material_history',
      function_definition: `
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
      `
    });
    
    if (funcMateriaisError) {
      throw new Error(`Erro ao criar função "get_material_history": ${funcMateriaisError.message}`);
    }

    console.log('Configuração do banco de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao configurar banco de dados:', error);
    throw error;
  }
}

// Executar o script se for chamado diretamente
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Script finalizado com sucesso.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script finalizado com erro:', error);
      process.exit(1);
    });
}

export { setupDatabase }; 
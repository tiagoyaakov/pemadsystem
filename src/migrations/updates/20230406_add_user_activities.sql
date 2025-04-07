-- Migração: Adicionar tabela de registro de atividades de usuários
-- Data: 2023-04-06
-- Descrição: Cria uma tabela para armazenar atividades dos usuários para auditoria e análise

-- Verificar se a migração já foi aplicada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_activities'
        AND table_schema = 'public'
    ) THEN
        -- Criar tabela de atividades de usuário
        CREATE TABLE user_activities (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            activity_type TEXT NOT NULL, -- login, logout, checklist_create, etc.
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            details JSONB,
            resource_id UUID,
            resource_type TEXT,
            success BOOLEAN DEFAULT TRUE
        );

        -- Adicionar índices para melhorar performance
        CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
        CREATE INDEX idx_user_activities_timestamp ON user_activities(timestamp);
        CREATE INDEX idx_user_activities_activity_type ON user_activities(activity_type);
        CREATE INDEX idx_user_activities_resource_type_id ON user_activities(resource_type, resource_id);

        -- Configurar RLS para atividades
        ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
        
        -- Políticas de RLS: administradores podem ver tudo, usuários só suas próprias atividades
        CREATE POLICY user_activities_admin_policy ON user_activities
            FOR ALL
            USING (
                EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
            );
            
        CREATE POLICY user_activities_supervisor_policy ON user_activities
            FOR SELECT
            USING (
                EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor')
            );
        
        CREATE POLICY user_activities_user_policy ON user_activities
            FOR SELECT
            USING (user_id = auth.uid());
        
        -- Função para registrar atividade de login automaticamente
        CREATE OR REPLACE FUNCTION log_auth_event()
        RETURNS TRIGGER AS $$
        BEGIN
            IF (TG_OP = 'INSERT' AND NEW.event = 'LOGIN') THEN
                INSERT INTO user_activities (
                    user_id,
                    activity_type,
                    ip_address,
                    user_agent,
                    details
                ) VALUES (
                    NEW.auth_id,
                    'login',
                    NEW.ip_address,
                    NEW.user_agent,
                    jsonb_build_object('provider', NEW.provider)
                );
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Trigger para eventos de autenticação
        CREATE TRIGGER trigger_log_auth_event
            AFTER INSERT ON auth.audit_log_entries
            FOR EACH ROW
            EXECUTE PROCEDURE log_auth_event();
        
        -- Função para registrar autalizações de usuário
        CREATE OR REPLACE FUNCTION log_user_update()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO user_activities (
                user_id,
                activity_type,
                details,
                resource_id,
                resource_type
            ) VALUES (
                NEW.id,
                'profile_update',
                jsonb_build_object(
                    'old_data', row_to_json(OLD)::jsonb - 'senha_hash',
                    'new_data', row_to_json(NEW)::jsonb - 'senha_hash'
                ),
                NEW.id,
                'users'
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Trigger para atualizações de usuário
        CREATE TRIGGER trigger_log_user_update
            AFTER UPDATE ON users
            FOR EACH ROW
            EXECUTE PROCEDURE log_user_update();

        -- Registrar na tabela de histórico de migrações (se existir)
        BEGIN
            INSERT INTO migration_history (migration_name, applied_by, details)
            VALUES ('20230406_add_user_activities', current_user, 'Adicionada tabela de atividades de usuários');
        EXCEPTION
            WHEN undefined_table THEN
                -- Se a tabela de histórico não existir, criar
                CREATE TABLE migration_history (
                    id SERIAL PRIMARY KEY,
                    migration_name TEXT NOT NULL UNIQUE,
                    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    applied_by TEXT,
                    status TEXT CHECK (status IN ('success', 'failed', 'reverted')) DEFAULT 'success',
                    details TEXT
                );
                
                -- Registrar novamente
                INSERT INTO migration_history (migration_name, applied_by, details)
                VALUES ('20230406_add_user_activities', current_user, 'Adicionada tabela de atividades de usuários');
        END;

        RAISE NOTICE 'Migração aplicada: Adicionada tabela de atividades de usuários';
    ELSE
        RAISE NOTICE 'Migração já aplicada anteriormente';
    END IF;
END $$;

-- Para rollback, execute:
/*
DROP TRIGGER IF EXISTS trigger_log_user_update ON users;
DROP FUNCTION IF EXISTS log_user_update();
DROP TRIGGER IF EXISTS trigger_log_auth_event ON auth.audit_log_entries;
DROP FUNCTION IF EXISTS log_auth_event();
DROP POLICY IF EXISTS user_activities_user_policy ON user_activities;
DROP POLICY IF EXISTS user_activities_supervisor_policy ON user_activities;
DROP POLICY IF EXISTS user_activities_admin_policy ON user_activities;
DROP TABLE IF EXISTS user_activities;

-- Atualizar registro na tabela de histórico
UPDATE migration_history 
SET status = 'reverted', 
    details = details || ' - Revertido em ' || CURRENT_TIMESTAMP 
WHERE migration_name = '20230406_add_user_activities';
*/ 
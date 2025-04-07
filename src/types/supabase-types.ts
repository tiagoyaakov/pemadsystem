export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Definições de tipos de enum
export type UserRole = 'admin' | 'supervisor' | 'operador';
export type UserStatus = 'ativo' | 'inativo' | 'pendente';
export type ChecklistStatus = 'pendente' | 'em_andamento' | 'concluido' | 'revisao' | 'aprovado';
export type ChecklistItemStatus = 'pendente' | 'conferido' | 'alterado' | 'nao_encontrado';
export type AlteracaoTipo = 'quantidade' | 'estado' | 'posicao' | 'comentario';
export type MaterialPriority = 'baixa' | 'media' | 'alta' | 'critica';
export type RiskLevel = 'baixo' | 'medio' | 'alto' | 'critico';
export type NotificacaoTipo = 'sistema' | 'checklist' | 'material' | 'incendio' | 'usuario';
export type NotificacaoPrioridade = 'baixa' | 'normal' | 'alta' | 'urgente';
export type Turno = 'manha' | 'tarde' | 'noite';
export type ActivityType = 'login' | 'logout' | 'checklist_create' | 'checklist_update' | 'material_update' | 'profile_update';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nome: string
          nome_guerra: string
          posto: string
          telefone: string | null
          email: string
          senha_hash: string
          role: UserRole
          created_at: string
          updated_at: string
          last_login: string | null
          avatar_url: string | null
          status: UserStatus
        }
        Insert: {
          id?: string
          nome: string
          nome_guerra: string
          posto: string
          telefone?: string | null
          email: string
          senha_hash: string
          role?: UserRole
          created_at?: string
          updated_at?: string
          last_login?: string | null
          avatar_url?: string | null
          status?: UserStatus
        }
        Update: {
          id?: string
          nome?: string
          nome_guerra?: string
          posto?: string
          telefone?: string | null
          email?: string
          senha_hash?: string
          role?: UserRole
          created_at?: string
          updated_at?: string
          last_login?: string | null
          avatar_url?: string | null
          status?: UserStatus
        }
      }
      
      alas: {
        Row: {
          id: string
          nome: string
          codigo: string
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          codigo: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          codigo?: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      checklist_locations: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          ala_id: string | null
          created_at: string
          updated_at: string
          is_active: boolean
          ordem: number
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          ala_id?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          ordem?: number
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          ala_id?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          ordem?: number
        }
      }
      
      materials: {
        Row: {
          id: string
          nome: string
          codigo: string
          foto_url: string | null
          quantidade_esperada: number
          location_id: string
          created_at: string
          updated_at: string
          is_active: boolean
          categoria: string | null
          unidade_medida: string | null
          posicao: number | null
          prateleira: string | null
          prioridade: MaterialPriority
        }
        Insert: {
          id?: string
          nome: string
          codigo: string
          foto_url?: string | null
          quantidade_esperada: number
          location_id: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          categoria?: string | null
          unidade_medida?: string | null
          posicao?: number | null
          prateleira?: string | null
          prioridade?: MaterialPriority
        }
        Update: {
          id?: string
          nome?: string
          codigo?: string
          foto_url?: string | null
          quantidade_esperada?: number
          location_id?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
          categoria?: string | null
          unidade_medida?: string | null
          posicao?: number | null
          prateleira?: string | null
          prioridade?: MaterialPriority
        }
      }
      
      checklists: {
        Row: {
          id: string
          user_id: string
          location_id: string
          data: string
          porcentagem: number
          finalizada: boolean
          ala_id: string
          created_at: string
          updated_at: string
          supervisor_id: string | null
          data_finalizacao: string | null
          status: ChecklistStatus
          observacoes: string | null
          turno: Turno
        }
        Insert: {
          id?: string
          user_id: string
          location_id: string
          data: string
          porcentagem?: number
          finalizada?: boolean
          ala_id: string
          created_at?: string
          updated_at?: string
          supervisor_id?: string | null
          data_finalizacao?: string | null
          status?: ChecklistStatus
          observacoes?: string | null
          turno?: Turno
        }
        Update: {
          id?: string
          user_id?: string
          location_id?: string
          data?: string
          porcentagem?: number
          finalizada?: boolean
          ala_id?: string
          created_at?: string
          updated_at?: string
          supervisor_id?: string | null
          data_finalizacao?: string | null
          status?: ChecklistStatus
          observacoes?: string | null
          turno?: Turno
        }
      }
      
      checklist_items: {
        Row: {
          id: string
          checklist_id: string
          material_id: string
          conferido: boolean
          quantidade_real: number | null
          comentario: string | null
          has_alteration: boolean
          from_previous_day: boolean
          created_at: string
          updated_at: string
          status: ChecklistItemStatus
          foto_url: string | null
          verificado_por: string | null
        }
        Insert: {
          id?: string
          checklist_id: string
          material_id: string
          conferido?: boolean
          quantidade_real?: number | null
          comentario?: string | null
          has_alteration?: boolean
          from_previous_day?: boolean
          created_at?: string
          updated_at?: string
          status?: ChecklistItemStatus
          foto_url?: string | null
          verificado_por?: string | null
        }
        Update: {
          id?: string
          checklist_id?: string
          material_id?: string
          conferido?: boolean
          quantidade_real?: number | null
          comentario?: string | null
          has_alteration?: boolean
          from_previous_day?: boolean
          created_at?: string
          updated_at?: string
          status?: ChecklistItemStatus
          foto_url?: string | null
          verificado_por?: string | null
        }
      }
      
      alteracoes_materiais: {
        Row: {
          id: string
          checklist_item_id: string
          comentario: string
          timestamp: string
          user_id: string
          tipo: AlteracaoTipo
          quantidade_anterior: number | null
          quantidade_nova: number | null
          created_at: string
          foto_url: string | null
        }
        Insert: {
          id?: string
          checklist_item_id: string
          comentario: string
          timestamp?: string
          user_id: string
          tipo: AlteracaoTipo
          quantidade_anterior?: number | null
          quantidade_nova?: number | null
          created_at?: string
          foto_url?: string | null
        }
        Update: {
          id?: string
          checklist_item_id?: string
          comentario?: string
          timestamp?: string
          user_id?: string
          tipo?: AlteracaoTipo
          quantidade_anterior?: number | null
          quantidade_nova?: number | null
          created_at?: string
          foto_url?: string | null
        }
      }
      
      fire_incidents: {
        Row: {
          id: string
          acq_date: string
          latitude: number
          longitude: number
          brightness: number
          confidence: number
          frp: number
          daynight: string
          source: string
          created_at: string
          updated_at: string
          distance_to_base: number | null
          risk_level: RiskLevel | null
          is_verified: boolean
          verified_by: string | null
          verificacao_timestamp: string | null
        }
        Insert: {
          id?: string
          acq_date: string
          latitude: number
          longitude: number
          brightness: number
          confidence: number
          frp: number
          daynight: string
          source: string
          created_at?: string
          updated_at?: string
          distance_to_base?: number | null
          risk_level?: RiskLevel | null
          is_verified?: boolean
          verified_by?: string | null
          verificacao_timestamp?: string | null
        }
        Update: {
          id?: string
          acq_date?: string
          latitude?: number
          longitude?: number
          brightness?: number
          confidence?: number
          frp?: number
          daynight?: string
          source?: string
          created_at?: string
          updated_at?: string
          distance_to_base?: number | null
          risk_level?: RiskLevel | null
          is_verified?: boolean
          verified_by?: string | null
          verificacao_timestamp?: string | null
        }
      }
      
      notificacoes: {
        Row: {
          id: string
          titulo: string
          mensagem: string
          tipo: NotificacaoTipo
          destinatario_id: string | null
          lida: boolean
          created_at: string
          data_leitura: string | null
          link: string | null
          origem: string | null
          prioridade: NotificacaoPrioridade
        }
        Insert: {
          id?: string
          titulo: string
          mensagem: string
          tipo: NotificacaoTipo
          destinatario_id?: string | null
          lida?: boolean
          created_at?: string
          data_leitura?: string | null
          link?: string | null
          origem?: string | null
          prioridade?: NotificacaoPrioridade
        }
        Update: {
          id?: string
          titulo?: string
          mensagem?: string
          tipo?: NotificacaoTipo
          destinatario_id?: string | null
          lida?: boolean
          created_at?: string
          data_leitura?: string | null
          link?: string | null
          origem?: string | null
          prioridade?: NotificacaoPrioridade
        }
      }
      user_activities: {
        Row: {
          id: string
          user_id: string
          activity_type: ActivityType
          timestamp: string
          ip_address: string | null
          user_agent: string | null
          details: Record<string, any> | null
          resource_id: string | null
          resource_type: string | null
          success: boolean
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: ActivityType
          timestamp?: string
          ip_address?: string | null
          user_agent?: string | null
          details?: Record<string, any> | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: ActivityType
          timestamp?: string
          ip_address?: string | null
          user_agent?: string | null
          details?: Record<string, any> | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean
        }
      }
      migration_history: {
        Row: {
          id: number
          migration_name: string
          applied_at: string
          applied_by: string | null
          status: 'success' | 'failed' | 'reverted'
          details: string | null
        }
        Insert: {
          id?: number
          migration_name: string
          applied_at?: string
          applied_by?: string | null
          status?: 'success' | 'failed' | 'reverted'
          details?: string | null
        }
        Update: {
          id?: number
          migration_name?: string
          applied_at?: string
          applied_by?: string | null
          status?: 'success' | 'failed' | 'reverted'
          details?: string | null
        }
      }
    }
    Views: {
      view_checklists_completos: {
        Row: {
          id: string
          data: string
          ala_nome: string
          location_nome: string
          user_nome: string
          porcentagem: number
          status: ChecklistStatus
          total_items: number
          items_conferidos: number
        }
      }
      view_materiais_com_alteracoes: {
        Row: {
          material_id: string
          material_nome: string
          location_id: string
          location_nome: string
          total_alteracoes: number
          ultima_alteracao: string
        }
      }
    }
    Functions: {
      get_checklists_by_period: {
        Args: {
          start_date: string
          end_date: string
        }
        Returns: {
          id: string
          data: string
          ala_nome: string
          location_nome: string
          user_nome: string
          porcentagem: number
          status: ChecklistStatus
        }[]
      }
      get_material_history: {
        Args: {
          material_id: string
          days_back: number
        }
        Returns: {
          checklist_date: string
          quantidade_real: number | null
          comentario: string | null
          has_alteration: boolean
        }[]
      }
    }
    Enums: {
      UserRole: 'admin' | 'supervisor' | 'operador'
      UserStatus: 'ativo' | 'inativo' | 'pendente'
      ChecklistStatus: 'pendente' | 'em_andamento' | 'concluido' | 'revisao' | 'aprovado'
      ChecklistItemStatus: 'pendente' | 'conferido' | 'alterado' | 'nao_encontrado'
      AlteracaoTipo: 'quantidade' | 'estado' | 'posicao' | 'comentario'
      MaterialPriority: 'baixa' | 'media' | 'alta' | 'critica'
      RiskLevel: 'baixo' | 'medio' | 'alto' | 'critico'
      NotificacaoTipo: 'sistema' | 'checklist' | 'material' | 'incendio' | 'usuario'
      NotificacaoPrioridade: 'baixa' | 'normal' | 'alta' | 'urgente'
      Turno: 'manha' | 'tarde' | 'noite'
      ActivityType: 'login' | 'logout' | 'checklist_create' | 'checklist_update' | 'material_update' | 'profile_update'
    }
  }
} 
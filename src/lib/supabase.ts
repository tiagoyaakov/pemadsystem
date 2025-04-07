import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos das tabelas do Supabase
export interface User {
  id: string;
  nome: string;
  nome_guerra?: string;
  posto?: string;
  telefone?: string;
  email: string;
  senha_hash?: string;
  role: 'admin' | 'supervisor' | 'operador';
  created_at: string;
  updated_at?: string;
  last_login?: string;
  avatar_url?: string;
  status: 'ativo' | 'inativo';
}

export interface Ala {
  id: string;
  nome: string;
  codigo: string;
  descricao?: string;
  created_at: string;
  updated_at?: string;
}

export interface Localizacao {
  id: string;
  nome: string;
  descricao?: string;
  setor_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Material {
  id: string;
  nome: string;
  codigo: string;
  location_id: string;
  descricao?: string;
  status: 'ativo' | 'inativo' | 'manutencao';
  quantidade?: number;
  quantidade_minima?: number;
  created_at: string;
  updated_at?: string;
}

export interface Checklist {
  id: string;
  data: string;
  responsavel: string;
  location_id: string;
  setor_id: string;
  status: 'pendente' | 'parcial' | 'concluido';
  porcentagem: number;
  data_conclusao?: string;
  observacoes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  material_id: string;
  conferido: boolean;
  observacoes?: string;
  created_at: string;
  updated_at?: string;
}

export interface AlteracaoMaterial {
  id: string;
  material_id: string;
  user_id: string;
  tipo: 'manutencao' | 'substituicao' | 'descarte';
  descricao: string;
  data: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  created_at: string;
  updated_at?: string;
}

export interface FireIncident {
  id: string;
  latitude: number;
  longitude: number;
  acq_date: string | Date;
  acq_time?: string;
  brightness: number;
  scan?: number;
  track?: number;
  satellite?: string;
  confidence: number | string;
  version?: string;
  bright_t31?: number | null;
  frp: number;
  daynight: 'D' | 'N';
  created_at?: string;
}

export interface Notificacao {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string;
  lida: boolean;
  tipo: 'info' | 'alerta' | 'erro' | 'sucesso';
  link?: string;
  created_at: string;
  updated_at?: string;
} 
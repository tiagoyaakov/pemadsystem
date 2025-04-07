import { supabase, supabaseService } from './supabase';
import { ActivityType } from '../types/supabase-types';
import { metricsService } from './metrics.service';

/**
 * Serviço para registrar atividades de usuários
 */
class ActivityService {
  private static instance: ActivityService;

  private constructor() {}

  /**
   * Retorna a instância singleton do serviço
   */
  public static getInstance(): ActivityService {
    if (!ActivityService.instance) {
      ActivityService.instance = new ActivityService();
    }
    return ActivityService.instance;
  }

  /**
   * Registra uma atividade de usuário
   * @param userId ID do usuário
   * @param activityType Tipo de atividade
   * @param details Detalhes adicionais sobre a atividade
   * @param resourceId ID opcional do recurso associado à atividade
   * @param resourceType Tipo opcional do recurso associado à atividade
   * @returns Promise resolving com sucesso ou erro
   */
  public async recordActivity(
    userId: string,
    activityType: ActivityType,
    details?: Record<string, any>,
    resourceId?: string,
    resourceType?: string
  ): Promise<boolean> {
    try {
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : undefined;
      
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,
          ip_address: await this.getUserIP(),
          user_agent: userAgent,
          details: details || {},
          resource_id: resourceId,
          resource_type: resourceType,
          success: true
        });

      if (error) {
        console.error('Erro ao registrar atividade:', error);
        metricsService.recordMetric('error', 'activity_record', {
          activityType,
          userId,
          errorCode: error.code,
          errorMessage: error.message
        });
        return false;
      }

      metricsService.recordMetric('activity', 'record', {
        activityType,
        userId,
        success: true
      });

      return true;
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
      metricsService.recordMetric('error', 'activity_record', {
        activityType,
        userId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return false;
    }
  }

  /**
   * Registra um erro de atividade
   * @param userId ID do usuário
   * @param activityType Tipo de atividade
   * @param errorDetails Detalhes do erro
   * @param resourceId ID opcional do recurso associado à atividade
   * @param resourceType Tipo opcional do recurso associado à atividade
   */
  public async recordError(
    userId: string,
    activityType: ActivityType,
    errorDetails: Record<string, any>,
    resourceId?: string,
    resourceType?: string
  ): Promise<boolean> {
    try {
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : undefined;
      
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,
          ip_address: await this.getUserIP(),
          user_agent: userAgent,
          details: errorDetails,
          resource_id: resourceId,
          resource_type: resourceType,
          success: false
        });

      if (error) {
        console.error('Erro ao registrar erro de atividade:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao registrar erro de atividade:', error);
      return false;
    }
  }

  /**
   * Obtém o histórico de atividades de um usuário
   * @param userId ID do usuário
   * @param limit Limite de registros a retornar
   * @param offset Offset para paginação
   * @param activityType Tipo de atividade para filtrar (opcional)
   */
  public async getUserActivities(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    activityType?: ActivityType
  ) {
    try {
      let query = supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (activityType) {
        query = query.eq('activity_type', activityType);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: supabaseService.handleError(error, 'getUserActivities') 
      };
    }
  }

  /**
   * Obter o endereço IP do usuário
   * @returns IP do usuário ou null
   */
  private async getUserIP(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Erro ao obter IP do usuário:', error);
      return null;
    }
  }

  /**
   * Formatar data para exibição
   * @param timestamp Timestamp da atividade
   * @returns Data formatada
   */
  public formatActivityDate(timestamp: string): string {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  /**
   * Traduz o tipo de atividade para o português
   * @param activityType Tipo de atividade em inglês
   * @returns Tipo de atividade em português
   */
  public translateActivityType(activityType: ActivityType): string {
    const translations: Record<ActivityType, string> = {
      login: 'Login',
      logout: 'Logout',
      checklist_create: 'Criação de Checklist',
      checklist_update: 'Atualização de Checklist',
      material_update: 'Atualização de Material',
      profile_update: 'Atualização de Perfil'
    };

    return translations[activityType] || activityType;
  }
}

export const activityService = ActivityService.getInstance(); 
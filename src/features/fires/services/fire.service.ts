import { supabase } from '@/lib/supabase';
import { FireIncident } from '@/lib/supabase';

/**
 * Interface para parâmetros de consulta da API FIRMS
 */
interface FIRMSQueryParams {
  /** Data de início no formato YYYY-MM-DD */
  startDate: string;
  /** Data de fim no formato YYYY-MM-DD */
  endDate: string;
  /** Latitude mínima (-90 a 90) */
  minLatitude: number;
  /** Longitude mínima (-180 a 180) */
  minLongitude: number;
  /** Latitude máxima (-90 a 90) */
  maxLatitude: number;
  /** Longitude máxima (-180 a 180) */
  maxLongitude: number;
  /** Nível de confiança (opcional): low, nominal, high */
  confidence?: 'low' | 'nominal' | 'high';
}

/**
 * Interface para um incidente de fogo retornado pela API FIRMS
 */
interface FIRMSFireIncident {
  latitude: number;
  longitude: number;
  acq_date: string;
  acq_time: string;
  confidence: number;
  bright_ti4: number;
  scan: number;
  track: number;
  satellite: string;
  version: string;
  bright_ti5: number;
  frp: number;
  daynight: 'D' | 'N';
}

/**
 * Serviço para gerenciamento de dados de incêndios
 */
export class FireService {
  private static apiKey = process.env.NEXT_PUBLIC_NASA_FIRMS_API_KEY || '';
  private static baseUrl = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';
  
  /**
   * Busca incidentes de fogo da API FIRMS
   */
  static async fetchFireIncidents(params: FIRMSQueryParams): Promise<Omit<FireIncident, 'id' | 'created_at'>[]> {
    try {
      // Garantir que a API Key está configurada
      if (!this.apiKey) {
        throw new Error('NASA FIRMS API Key não configurada. Verifique as variáveis de ambiente.');
      }
      
      // Formatar parâmetros de consulta
      const queryParams = new URLSearchParams({
        source: 'VIIRS_SNPP_NRT',
        area_type: 'RECTANGLE', 
        lat_min: params.minLatitude.toString(),
        lon_min: params.minLongitude.toString(),
        lat_max: params.maxLatitude.toString(),
        lon_max: params.maxLongitude.toString(),
        start_date: params.startDate,
        end_date: params.endDate,
        api_key: this.apiKey
      });
      
      // Adicionar confiança se fornecida
      if (params.confidence) {
        queryParams.append('confidence', params.confidence);
      }
      
      // Fazer requisição para a API
      const response = await fetch(`${this.baseUrl}/${params.startDate}/${params.endDate}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados da API FIRMS: ${response.status} ${response.statusText}`);
      }
      
      // Processar resposta CSV para JSON
      const csvText = await response.text();
      const parsedData = this.parseCSV(csvText);
      
      // Mapear para o formato de FireIncident
      return parsedData.map(this.mapToFireIncident);
    } catch (error) {
      console.error('Erro ao buscar focos de incêndio:', error);
      throw error;
    }
  }
  
  /**
   * Salva incidentes de fogo no banco de dados
   */
  static async saveFireIncidents(incidents: Omit<FireIncident, 'id' | 'created_at'>[]): Promise<void> {
    try {
      // Verificar se há dados a serem salvos
      if (incidents.length === 0) return;
      
      // Adicionar timestamp de criação
      const timestamp = new Date().toISOString();
      const incidentsWithTimestamp = incidents.map(incident => ({
        ...incident,
        created_at: timestamp
      }));
      
      // Salvar no Supabase
      const { error } = await supabase
        .from('fire_incidents')
        .upsert(incidentsWithTimestamp, {
          onConflict: 'latitude,longitude,acq_date,acq_time',
          ignoreDuplicates: true
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar focos de incêndio:', error);
      throw error;
    }
  }
  
  /**
   * Busca incidentes de fogo do banco de dados
   */
  static async getFireIncidents(
    startDate?: string, 
    endDate?: string
  ): Promise<FireIncident[]> {
    try {
      let query = supabase
        .from('fire_incidents')
        .select('*')
        .order('acq_date', { ascending: false });
      
      // Aplicar filtro de data se fornecido
      if (startDate) {
        query = query.gte('acq_date', startDate);
      }
      
      if (endDate) {
        query = query.lte('acq_date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar focos de incêndio do banco:', error);
      throw error;
    }
  }
  
  /**
   * Converte array de FireIncident para GeoJSON
   */
  static convertToGeoJSON(incidents: FireIncident[]): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = incidents.map(incident => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [incident.longitude, incident.latitude]
      },
      properties: {
        id: incident.id,
        acq_date: incident.acq_date,
        acq_time: incident.acq_time,
        confidence: incident.confidence,
        frp: incident.frp,
        daynight: incident.daynight
      }
    }));
    
    return {
      type: 'FeatureCollection',
      features
    };
  }
  
  /**
   * Parser simples de CSV para JSON
   */
  private static parseCSV(csv: string): any[] {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    
    return lines
      .slice(1) // Pular linha de cabeçalho
      .filter(line => line.trim() !== '') // Remover linhas vazias
      .map(line => {
        const values = line.split(',');
        const entry: any = {};
        
        headers.forEach((header, index) => {
          // Converter tipos de dados apropriados
          const value = values[index]?.trim();
          
          if (value === undefined || value === '') {
            entry[header] = null;
          } else if (['latitude', 'longitude', 'scan', 'track', 'confidence', 'bright_ti4', 'bright_ti5', 'frp'].includes(header)) {
            entry[header] = parseFloat(value);
          } else {
            entry[header] = value;
          }
        });
        
        return entry;
      });
  }
  
  /**
   * Mapeia um objeto da API FIRMS para o formato FireIncident
   */
  private static mapToFireIncident(data: FIRMSFireIncident): Omit<FireIncident, 'id' | 'created_at'> {
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      acq_date: data.acq_date,
      acq_time: data.acq_time,
      brightness: data.bright_ti4,
      scan: data.scan,
      track: data.track,
      satellite: data.satellite,
      confidence: data.confidence,
      version: data.version,
      bright_t31: data.bright_ti5,
      frp: data.frp,
      daynight: data.daynight
    };
  }
} 
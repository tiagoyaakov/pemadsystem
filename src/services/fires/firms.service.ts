import { supabase } from '@/lib/supabase';
import { FireIncident } from '@/lib/supabase';
import { FireIncidentStore } from '@/lib/indexedDB';

const NASA_FIRMS_API_KEY = process.env.NEXT_PUBLIC_NASA_FIRMS_API_KEY;
const NASA_FIRMS_MAP_KEY = process.env.NEXT_PUBLIC_NASA_FIRMS_MAP_KEY;

// Cache de dados offline
const fireStore = new FireIncidentStore();

// Coordenadas do Brasil para filtrar incêndios
const BRAZIL_BOUNDS = {
  north: 5.27438, // latitude máxima
  south: -33.74189, // latitude mínima
  west: -73.98283, // longitude mínima
  east: -34.79299 // longitude máxima
};

interface FiresAPIParams {
  map_key?: string;
  area_of_interest?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  days?: number;
  date_range?: string;
  satellite?: string;
}

// Converte um objeto Date para o formato YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Verifica se um ponto está dentro dos limites do Brasil
function isPointInBrazil(latitude: number, longitude: number): boolean {
  return (
    latitude >= BRAZIL_BOUNDS.south &&
    latitude <= BRAZIL_BOUNDS.north &&
    longitude >= BRAZIL_BOUNDS.west &&
    longitude <= BRAZIL_BOUNDS.east
  );
}

// Função para buscar dados de incêndios da API do NASA FIRMS
export async function fetchFiresFromAPI(params: FiresAPIParams = {}): Promise<FireIncident[]> {
  try {
    // Parâmetros padrão caso não sejam fornecidos
    const defaultParams: FiresAPIParams = {
      map_key: NASA_FIRMS_MAP_KEY || 'd3a604a88ba226c1aa28484696289460',
      area_of_interest: 'rectangle',
      days: 1,
      satellite: 'modis,viirs_snpp,viirs_noaa20'
    };

    // Combina os parâmetros fornecidos com os padrões
    const queryParams = { ...defaultParams, ...params };

    // Se não for fornecido um intervalo de datas, usa os últimos X dias
    if (!queryParams.date_range && queryParams.days) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (queryParams.days || 1));
      
      queryParams.date_range = `${formatDate(startDate)}..${formatDate(endDate)}`;
      delete queryParams.days; // Remove o parâmetro days pois agora usamos date_range
    }

    // URL base da API
    const baseUrl = 'https://firms.modaps.eosdis.nasa.gov/api/area/json';
    
    // Constrói a URL com os parâmetros
    const url = new URL(baseUrl);
    url.searchParams.append('key', NASA_FIRMS_API_KEY || '4dad87ef97ed320e935aa50c07d46ac2');
    
    // Adiciona os parâmetros restantes
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });

    // Adiciona os limites geográficos do Brasil se for uma busca por retângulo
    if (queryParams.area_of_interest === 'rectangle') {
      url.searchParams.append('rectangle', [
        BRAZIL_BOUNDS.west,
        BRAZIL_BOUNDS.south,
        BRAZIL_BOUNDS.east,
        BRAZIL_BOUNDS.north
      ].join(','));
    }

    console.log('Buscando dados de incêndios de:', url.toString());
    
    // Faz a requisição para a API
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados de incêndios: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Processa e normaliza os dados
    const incidents: FireIncident[] = data.map((item: any) => ({
      id: `${item.latitude}_${item.longitude}_${item.acq_date}_${item.acq_time}`,
      latitude: item.latitude,
      longitude: item.longitude,
      brightness: item.brightness || item.bright_ti4 || item.bright_ti5,
      scan: item.scan || 0,
      track: item.track || 0,
      acq_date: item.acq_date,
      acq_time: item.acq_time,
      satellite: item.satellite || 'unknown',
      confidence: item.confidence || 'nominal',
      version: item.version || '1.0',
      bright_t31: item.bright_t31 || null,
      frp: item.frp || 0,
      daynight: item.daynight || 'D',
      created_at: new Date().toISOString()
    }));

    // Filtra apenas incêndios dentro do Brasil (segundo checkout)
    const brazilIncidents = incidents.filter(incident => 
      isPointInBrazil(incident.latitude, incident.longitude)
    );

    console.log(`Encontrados ${brazilIncidents.length} incêndios no Brasil (de ${incidents.length} total)`);
    
    return brazilIncidents;
  } catch (error) {
    console.error('Erro ao buscar dados de incêndios:', error);
    throw error;
  }
}

// Função para armazenar incêndios no banco de dados Supabase
export async function storeFiresInDatabase(fires: FireIncident[]): Promise<void> {
  if (!fires || fires.length === 0) {
    console.log('Nenhum incêndio para armazenar');
    return;
  }

  try {
    // Inserir ou atualizar registros de incêndios
    const { error } = await supabase
      .from('fire_incidents')
      .upsert(fires, { 
        onConflict: 'id',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Erro ao armazenar incêndios:', error);
      throw error;
    }

    console.log(`${fires.length} incêndios armazenados no banco de dados`);
  } catch (error) {
    console.error('Erro ao armazenar incêndios no banco de dados:', error);
    throw error;
  }
}

// Função para buscar incêndios do banco de dados Supabase
export async function getFiresFromDatabase(days = 1): Promise<FireIncident[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('fire_incidents')
      .select('*')
      .gte('acq_date', formatDate(startDate))
      .order('acq_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar incêndios do banco de dados:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar incêndios do banco de dados:', error);
    throw error;
  }
}

// Função para armazenar incêndios localmente usando IndexedDB
export async function storeFiresOffline(fires: FireIncident[]): Promise<void> {
  if (!fires || fires.length === 0) {
    console.log('Nenhum incêndio para armazenar offline');
    return;
  }

  try {
    await fireStore.bulkAdd(fires);
    console.log(`${fires.length} incêndios armazenados offline`);
  } catch (error) {
    console.error('Erro ao armazenar incêndios offline:', error);
    throw error;
  }
}

// Função para buscar incêndios do armazenamento local
export async function getFiresFromOfflineStorage(days = 1): Promise<FireIncident[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const fires = await fireStore.getByDateRange(startDate, endDate);
    return fires || [];
  } catch (error) {
    console.error('Erro ao buscar incêndios do armazenamento offline:', error);
    return [];
  }
}

// Função para buscar incêndios com fallback para armazenamento offline
export async function getFires(days = 1): Promise<{ fires: FireIncident[], isOfflineData: boolean }> {
  try {
    // Tenta buscar do banco de dados online
    const fires = await getFiresFromDatabase(days);
    
    if (fires && fires.length > 0) {
      // Armazena os dados mais recentes offline para uso futuro
      await storeFiresOffline(fires);
      return { fires, isOfflineData: false };
    }
    
    // Se não encontrou dados online, busca do armazenamento offline
    const offlineFires = await getFiresFromOfflineStorage(days);
    return { fires: offlineFires, isOfflineData: true };
  } catch (error) {
    console.error('Erro ao buscar incêndios, tentando armazenamento offline:', error);
    
    // Em caso de erro, busca do armazenamento offline
    const offlineFires = await getFiresFromOfflineStorage(days);
    return { fires: offlineFires, isOfflineData: true };
  }
}

// Função para sincronizar dados entre online e offline
export async function syncFiresData(days = 7): Promise<void> {
  try {
    // Busca dados mais recentes da API
    const newFires = await fetchFiresFromAPI({ days });
    
    // Armazena no banco de dados online
    await storeFiresInDatabase(newFires);
    
    // Armazena também no armazenamento offline
    await storeFiresOffline(newFires);
    
    console.log('Sincronização de dados de incêndios concluída com sucesso');
  } catch (error) {
    console.error('Erro durante sincronização de dados de incêndios:', error);
    throw error;
  }
}

// Função para verificar conectividade com o Supabase
export async function checkOnlineStatus(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('fire_incidents').select('id').limit(1);
    return !error && Array.isArray(data);
  } catch (error) {
    console.error('Erro ao verificar status online:', error);
    return false;
  }
}

// Função para buscar e atualizar dados de incêndios
export async function fetchAndUpdateFires(days = 1): Promise<FireIncident[]> {
  try {
    // Verifica se está online
    const isOnline = await checkOnlineStatus();
    
    if (isOnline) {
      // Busca novos dados da API
      const newFires = await fetchFiresFromAPI({ days });
      
      // Armazena no banco de dados
      await storeFiresInDatabase(newFires);
      
      // Armazena também offline
      await storeFiresOffline(newFires);
      
      return newFires;
    } else {
      // Se estiver offline, busca dados locais
      const { fires } = await getFires(days);
      return fires;
    }
  } catch (error) {
    console.error('Erro ao buscar e atualizar dados de incêndios:', error);
    
    // Em caso de erro, tenta buscar dados locais
    const { fires } = await getFires(days);
    return fires;
  }
} 
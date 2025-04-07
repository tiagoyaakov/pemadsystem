import { metricsService } from './metrics.service';

interface CacheConfig {
  maxSize: number;  // Tamanho máximo em bytes
  maxAge: number;   // Idade máxima em milissegundos
  name: string;     // Nome do cache para monitoramento
}

interface CacheEntry {
  value: any;
  size: number;
  timestamp: number;
  hits: number;
}

export class CacheService {
  private static instance: CacheService;
  private caches: Map<string, Map<string, CacheEntry>> = new Map();
  private configs: Map<string, CacheConfig> = new Map();

  private constructor() {
    // Monitorar uso de memória periodicamente
    setInterval(() => {
      this.monitorMemoryUsage();
    }, 60000); // A cada minuto
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public createCache(config: CacheConfig): void {
    if (!this.caches.has(config.name)) {
      this.caches.set(config.name, new Map());
      this.configs.set(config.name, config);
      console.debug(`Cache created: ${config.name}`);
    }
  }

  public async get<T>(cacheName: string, key: string): Promise<T | null> {
    const cache = this.caches.get(cacheName);
    if (!cache) return null;

    const entry = cache.get(key);
    if (!entry) {
      metricsService.recordCacheEfficiency(cacheName, 0, 0);
      return null;
    }

    // Verificar idade do cache
    const age = Date.now() - entry.timestamp;
    const config = this.configs.get(cacheName);
    
    if (config && age > config.maxAge) {
      cache.delete(key);
      metricsService.recordCacheEfficiency(cacheName, 0, entry.size);
      return null;
    }

    // Atualizar métricas
    entry.hits++;
    metricsService.recordCacheEfficiency(cacheName, 1, entry.size);

    return entry.value as T;
  }

  public set(cacheName: string, key: string, value: any): void {
    const cache = this.caches.get(cacheName);
    const config = this.configs.get(cacheName);
    
    if (!cache || !config) return;

    // Calcular tamanho aproximado
    const size = this.calculateSize(value);

    // Verificar limite de tamanho
    if (size > config.maxSize) {
      console.warn(`Cache entry too large: ${size} bytes`);
      return;
    }

    // Limpar entradas antigas se necessário
    this.evictIfNeeded(cacheName, size);

    cache.set(key, {
      value,
      size,
      timestamp: Date.now(),
      hits: 0
    });

    metricsService.recordCacheEfficiency(cacheName, 1, size);
  }

  public clear(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    if (cache) {
      const totalSize = Array.from(cache.values()).reduce((sum, entry) => sum + entry.size, 0);
      cache.clear();
      metricsService.recordCacheEfficiency(cacheName, 0, totalSize);
    }
  }

  private calculateSize(value: any): number {
    try {
      const str = JSON.stringify(value);
      return new Blob([str]).size;
    } catch {
      return 0;
    }
  }

  private evictIfNeeded(cacheName: string, newEntrySize: number): void {
    const cache = this.caches.get(cacheName);
    const config = this.configs.get(cacheName);
    
    if (!cache || !config) return;

    let currentSize = Array.from(cache.values()).reduce((sum, entry) => sum + entry.size, 0);

    // Se adicionar a nova entrada exceder o limite, remover entradas até haver espaço
    while (currentSize + newEntrySize > config.maxSize && cache.size > 0) {
      // Encontrar entrada menos usada/mais antiga
      let oldestKey: string | null = null;
      let oldestTimestamp = Infinity;
      let leastHits = Infinity;

      for (const [key, entry] of cache.entries()) {
        if (entry.hits < leastHits || (entry.hits === leastHits && entry.timestamp < oldestTimestamp)) {
          oldestKey = key;
          oldestTimestamp = entry.timestamp;
          leastHits = entry.hits;
        }
      }

      if (oldestKey) {
        const entry = cache.get(oldestKey);
        if (entry) {
          currentSize -= entry.size;
          cache.delete(oldestKey);
          metricsService.recordCacheEfficiency(cacheName, 0, entry.size);
        }
      }
    }
  }

  private monitorMemoryUsage(): void {
    for (const [cacheName, cache] of this.caches.entries()) {
      const totalSize = Array.from(cache.values()).reduce((sum, entry) => sum + entry.size, 0);
      const _totalEntries = cache.size;
      const config = this.configs.get(cacheName);
      
      if (config) {
        const usageRatio = totalSize / config.maxSize;
        metricsService.recordMemoryUsage(
          totalSize,  // heap
          config.maxSize,  // allocated
          totalSize   // used
        );

        if (usageRatio > 0.9) {
          console.warn(`Cache ${cacheName} is near capacity: ${(usageRatio * 100).toFixed(1)}%`);
        }
      }
    }
  }
} 
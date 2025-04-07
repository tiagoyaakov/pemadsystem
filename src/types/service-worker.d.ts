declare interface ExtendableEvent extends Event {
  waitUntil(fn: Promise<any>): void;
}

declare interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

declare interface ExtendableMessageEvent extends ExtendableEvent {
  data: any;
  source: Client | ServiceWorker | MessagePort | null;
  ports: readonly MessagePort[];
}

declare interface ServiceWorkerGlobalScope {
  clients: Clients;
  registration: ServiceWorkerRegistration;
  skipWaiting(): Promise<void>;
  addEventListener(
    type: 'install' | 'activate' | 'fetch' | 'message',
    listener: (event: ExtendableEvent | FetchEvent | ExtendableMessageEvent) => void
  ): void;
}

declare interface ServiceWorkerRegistrationEventMap {
  updatefound: Event;
}

declare interface ServiceWorkerEventMap {
  statechange: Event;
}

declare interface ServiceWorkerState {
  state: 'installing' | 'installed' | 'activating' | 'activated' | 'redundant';
}

declare interface CacheStorage {
  match(request: RequestInfo, options?: CacheQueryOptions): Promise<Response | undefined>;
  has(cacheName: string): Promise<boolean>;
  open(cacheName: string): Promise<Cache>;
  delete(cacheName: string): Promise<boolean>;
  keys(): Promise<string[]>;
}

declare interface Cache {
  match(request: RequestInfo, options?: CacheQueryOptions): Promise<Response | undefined>;
  matchAll(request: RequestInfo, options?: CacheQueryOptions): Promise<Response[]>;
  add(request: RequestInfo): Promise<void>;
  addAll(requests: RequestInfo[]): Promise<void>;
  put(request: RequestInfo, response: Response): Promise<void>;
  delete(request: RequestInfo, options?: CacheQueryOptions): Promise<boolean>;
  keys(request?: RequestInfo, options?: CacheQueryOptions): Promise<Request[]>;
}

declare interface CacheQueryOptions {
  ignoreSearch?: boolean;
  ignoreMethod?: boolean;
  ignoreVary?: boolean;
  cacheName?: string;
}

declare interface ServiceWorkerConfig {
  cacheVersion: string;
  criticalResources: string[];
  cacheStrategies: {
    NETWORK_FIRST: string;
    CACHE_FIRST: string;
    STALE_WHILE_REVALIDATE: string;
  };
  preloadConfig: {
    enabled: boolean;
    minPriority: number;
    maxConcurrent: number;
    timeWindow: number;
  };
}

declare interface ResourceUsage {
  frequency: number;
  lastUsed: number;
  priority: number;
}

declare interface ServiceWorkerMessage {
  type: 'SKIP_WAITING' | 'UPDATE_RESOURCE_PRIORITY';
  url?: string;
  priority?: number;
}

declare interface ServiceWorkerMetric {
  category: string;
  name: string;
  attributes: {
    [key: string]: any;
  };
}

declare interface ServiceWorkerError {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}

declare interface ServiceWorkerPerformanceEntry extends PerformanceEntry {
  initiatorType?: string;
  nextHopProtocol?: string;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
}

declare interface ServiceWorkerNavigationPreloadManager {
  enable(): Promise<void>;
  disable(): Promise<void>;
  setHeaderValue(value: string): Promise<void>;
  getState(): Promise<{ enabled: boolean; headerValue: string }>;
}

declare interface ServiceWorkerRegistrationOptions {
  scope?: string;
  type?: 'classic' | 'module';
  updateViaCache?: 'none' | 'all' | 'imports';
} 
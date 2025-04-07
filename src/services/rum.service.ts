import { metricsService } from './metrics.service';

interface UserMetrics {
  deviceType: string;
  browser: string;
  os: string;
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  viewport: {
    width: number;
    height: number;
  };
}

interface MetricPayload {
  [key: string]: any;
}

class RUMService {
  private static instance: RUMService;
  private performanceObservers: Map<string, PerformanceObserver> = new Map();
  private clsValue = 0;
  private clsEntries: LayoutShift[] = [];
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): RUMService {
    if (!RUMService.instance) {
      RUMService.instance = new RUMService();
    }
    return RUMService.instance;
  }

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      this.collectUserMetrics();
      this.observePerformanceMetrics();
      this.observeJavaScriptErrors();
      this.observeResourceErrors();
      this.observeUserInteractions();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize RUM:', error);
    }
  }

  public cleanup(): void {
    this.performanceObservers.forEach(observer => observer.disconnect());
    this.performanceObservers.clear();
    this.isInitialized = false;
  }

  private recordMetric(category: string, name: string, payload: MetricPayload): void {
    try {
      metricsService.recordMetric(category, name, payload);
    } catch (error) {
      console.error(`Failed to record metric ${category}.${name}:`, error);
    }
  }

  private collectUserMetrics(): void {
    try {
      const metrics: UserMetrics = {
        deviceType: this.getDeviceType(),
        browser: this.getBrowser(),
        os: this.getOS(),
        connection: this.getConnectionInfo(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      this.recordMetric('user', 'device_info', metrics);

      // Observar mudanças no viewport
      window.addEventListener('resize', this.debounce(() => {
        this.recordMetric('user', 'viewport_change', {
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 500));
    } catch (error) {
      console.error('Failed to collect user metrics:', error);
    }
  }

  private observePerformanceMetrics(): void {
    // Observe FCP
    this.observeEntry('paint', (entries) => {
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        this.recordMetric('performance', 'fcp', { value: fcp.startTime });
      }
    });

    // Observe LCP
    this.observeEntry('largest-contentful-paint', (entries) => {
      const lcp = entries[entries.length - 1];
      if (lcp) {
        this.recordMetric('performance', 'lcp', { value: lcp.startTime });
      }
    });

    // Observe FID
    this.observeEntry('first-input', (entries) => {
      const fid = entries[0] as PerformanceEventTiming;
      if (fid) {
        this.recordMetric('performance', 'fid', { 
          value: fid.processingStart - fid.startTime 
        });
      }
    });

    // Observe CLS
    this.observeEntry('layout-shift', (entries) => {
      entries.forEach((entry) => {
        const layoutShift = entry as LayoutShift;
        if (!layoutShift.hadRecentInput) {
          this.clsValue += layoutShift.value;
          this.clsEntries.push(layoutShift);

          // Only keep the most recent 1 second of entries
          const now = entry.startTime;
          while (this.clsEntries.length > 0 && this.clsEntries[0].startTime < now - 1000) {
            this.clsValue -= this.clsEntries.shift()!.value;
          }

          this.recordMetric('performance', 'cls', { value: this.clsValue });
        }
      });
    });

    // Observe Navigation Timing
    if (document.readyState === 'complete') {
      this.recordNavigationTiming();
    } else {
      window.addEventListener('load', () => this.recordNavigationTiming());
    }

    // Observe Resource Timing
    this.observeEntry('resource', (entries) => {
      entries.forEach((entry) => {
        const resource = entry as PerformanceResourceTiming;
        this.recordMetric('performance', 'resource_timing', {
          name: resource.name,
          initiatorType: resource.initiatorType,
          duration: resource.duration,
          transferSize: resource.transferSize,
          protocol: resource.nextHopProtocol
        });
      });
    });
  }

  private recordNavigationTiming(): void {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.recordMetric('performance', 'navigation_timing', {
          ttfb: navigation.responseStart - navigation.requestStart,
          domInteractive: navigation.domInteractive,
          domComplete: navigation.domComplete,
          loadComplete: navigation.loadEventEnd,
          type: navigation.type,
          redirectCount: navigation.redirectCount
        });
      }
    }, 0);
  }

  private observeEntry(entryType: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      if (this.performanceObservers.has(entryType)) {
        this.performanceObservers.get(entryType)?.disconnect();
      }

      const observer = new PerformanceObserver((list) => callback(list.getEntries()));
      observer.observe({ entryTypes: [entryType], buffered: true });
      this.performanceObservers.set(entryType, observer);
    } catch (e) {
      console.error(`Failed to observe ${entryType}:`, e);
    }
  }

  private observeJavaScriptErrors(): void {
    window.addEventListener('error', (event) => {
      if (event.error) {
        this.recordMetric('error', 'javascript', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error.stack,
          type: event.error.name
        });
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordMetric('error', 'promise_rejection', {
        message: event.reason?.message || 'Unknown error',
        stack: event.reason?.stack,
        type: event.reason?.name
      });
    });
  }

  private observeResourceErrors(): void {
    window.addEventListener('error', (event) => {
      const target = event.target as HTMLElement;
      if (target && 'src' in target) {
        this.recordMetric('error', 'resource', {
          src: (target as HTMLImageElement | HTMLScriptElement).src,
          type: target.tagName.toLowerCase(),
          timestamp: event.timeStamp
        });
      }
    }, true);
  }

  private observeUserInteractions(): void {
    const interactionEvents = ['click', 'submit', 'input', 'scroll', 'keypress'];
    let lastInteractionTime = performance.now();
    
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const target = event.target as HTMLElement;
        const now = performance.now();
        const timeSinceLastInteraction = now - lastInteractionTime;

        this.recordMetric('interaction', eventType, {
          targetType: target.tagName.toLowerCase(),
          targetId: target.id || undefined,
          targetClass: target.className || undefined,
          path: this.getElementPath(target),
          timeSinceLastInteraction
        });

        lastInteractionTime = now;
      }, { passive: true });
    });
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    const browserRegexes = {
      chrome: /chrome|chromium|crios/i,
      safari: /safari/i,
      firefox: /firefox|fxios/i,
      opera: /opera|opr/i,
      ie: /msie|trident/i,
      edge: /edge|edg/i
    };

    for (const [browser, regex] of Object.entries(browserRegexes)) {
      if (regex.test(ua)) return browser;
    }
    return 'unknown';
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    const osRegexes = {
      windows: /windows nt/i,
      mac: /macintosh|mac os x/i,
      linux: /linux/i,
      android: /android/i,
      ios: /iphone|ipad|ipod/i
    };

    for (const [os, regex] of Object.entries(osRegexes)) {
      if (regex.test(ua)) return os;
    }
    return 'unknown';
  }

  private getConnectionInfo() {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    };
  }

  private getElementPath(element: HTMLElement): string {
    const path: string[] = [];
    let currentElement: HTMLElement | null = element;
    
    while (currentElement && currentElement !== document.body) {
      let selector = currentElement.tagName.toLowerCase();
      if (currentElement.id) {
        selector += `#${currentElement.id}`;
      } else if (currentElement.className) {
        selector += `.${currentElement.className.split(' ').join('.')}`;
      }
      path.unshift(selector);
      currentElement = currentElement.parentElement;
    }
    
    return path.join(' > ');
  }

  private debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }
}

export const rumService = RUMService.getInstance(); 
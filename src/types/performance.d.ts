interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  lastInputTime?: number;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  duration: number;
  cancelable: boolean;
  target: Node | null;
  interactionId?: number;
  timeStamp: number;
}

interface PerformanceResourceTiming extends PerformanceEntry {
  initiatorType: string;
  nextHopProtocol: string;
  workerStart: number;
  redirectStart: number;
  redirectEnd: number;
  fetchStart: number;
  domainLookupStart: number;
  domainLookupEnd: number;
  connectStart: number;
  connectEnd: number;
  secureConnectionStart: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  serverTiming: PerformanceServerTiming[];
}

interface PerformanceNavigationTiming extends PerformanceResourceTiming {
  unloadEventStart: number;
  unloadEventEnd: number;
  domInteractive: number;
  domContentLoadedEventStart: number;
  domContentLoadedEventEnd: number;
  domComplete: number;
  loadEventStart: number;
  loadEventEnd: number;
  type: NavigationType;
  redirectCount: number;
}

interface PerformanceServerTiming {
  name: string;
  duration: number;
  description: string;
}

interface PerformanceObserverInit {
  entryTypes: string[];
  buffered?: boolean;
  durationThreshold?: number;
}

type NavigationType = 'navigate' | 'reload' | 'back_forward' | 'prerender';

declare global {
  interface Window {
    LayoutShift: typeof LayoutShift;
    PerformanceEventTiming: typeof PerformanceEventTiming;
    PerformanceResourceTiming: typeof PerformanceResourceTiming;
    PerformanceNavigationTiming: typeof PerformanceNavigationTiming;
  }
} 
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();
  
  static startTimer(name: string): void {
    this.metrics.set(name, performance.now());
  }
  
  static endTimer(name: string): number {
    const start = this.metrics.get(name);
    if (!start) {
      console.warn(`Timer '${name}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - start;
    this.metrics.delete(name);
    
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }
  
  static measurePageLoad(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      console.log('📊 Page Load Metrics:');
      console.log(`  DOM Content Loaded: ${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`);
      console.log(`  Load Complete: ${navigation.loadEventEnd - navigation.loadEventStart}ms`);
      console.log(`  Total Load Time: ${navigation.loadEventEnd - navigation.fetchStart}ms`);
    });
  }
  
  static measureMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('💾 Memory Usage:');
      console.log(`  Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
    }
  }
}

// Initialize performance monitoring
PerformanceMonitor.measurePageLoad();

// Make available globally
(window as any).performanceMonitor = PerformanceMonitor;
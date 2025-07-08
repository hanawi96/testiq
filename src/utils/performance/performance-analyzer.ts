/**
 * Performance Analysis Tool cho Admin Articles
 * Đo và phân tích performance bottlenecks
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: any;
}

class PerformanceAnalyzer {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    // Enable only in development
    this.isEnabled = import.meta.env.DEV;
  }

  /**
   * Start measuring a performance metric
   */
  start(name: string, metadata?: any): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });

    console.log(`🚀 Performance: Started ${name}`, metadata);
  }

  /**
   * End measuring a performance metric
   */
  end(name: string, metadata?: any): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`⚠️ Performance: Metric ${name} not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    const color = this.getColorForDuration(duration);
    console.log(
      `%c⏱️ Performance: ${name} completed in ${duration.toFixed(2)}ms`,
      `color: ${color}; font-weight: bold;`,
      { ...metric.metadata, ...metadata }
    );

    return duration;
  }

  /**
   * Get color based on duration for better visualization
   */
  private getColorForDuration(duration: number): string {
    if (duration < 100) return '#22c55e'; // green - fast
    if (duration < 500) return '#f59e0b'; // yellow - moderate
    if (duration < 1000) return '#ef4444'; // red - slow
    return '#dc2626'; // dark red - very slow
  }

  /**
   * Mark a point in time
   */
  mark(name: string, metadata?: any): void {
    if (!this.isEnabled) return;

    console.log(`📍 Performance: ${name}`, {
      timestamp: performance.now(),
      ...metadata
    });
  }

  /**
   * Get summary of all metrics
   */
  getSummary(): { [key: string]: PerformanceMetric } {
    const summary: { [key: string]: PerformanceMetric } = {};
    
    this.metrics.forEach((metric, name) => {
      summary[name] = { ...metric };
    });

    return summary;
  }

  /**
   * Print detailed performance report
   */
  printReport(): void {
    if (!this.isEnabled) return;

    console.group('📊 Performance Report');
    
    const completed = Array.from(this.metrics.values())
      .filter(m => m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));

    if (completed.length === 0) {
      console.log('No completed metrics found');
      console.groupEnd();
      return;
    }

    const totalTime = completed.reduce((sum, m) => sum + (m.duration || 0), 0);

    console.log(`Total measured time: ${totalTime.toFixed(2)}ms`);
    console.log('Breakdown by operation:');

    completed.forEach(metric => {
      const percentage = ((metric.duration || 0) / totalTime * 100).toFixed(1);
      const color = this.getColorForDuration(metric.duration || 0);
      
      console.log(
        `%c${metric.name}: ${metric.duration?.toFixed(2)}ms (${percentage}%)`,
        `color: ${color}`
      );
    });

    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Analyze network requests
   */
  analyzeNetworkRequests(): void {
    if (!this.isEnabled) return;

    // Get performance entries for network requests
    const entries = performance.getEntriesByType('navigation');
    const resourceEntries = performance.getEntriesByType('resource');

    console.group('🌐 Network Analysis');
    
    entries.forEach(entry => {
      const navEntry = entry as PerformanceNavigationTiming;
      console.log('Page Load Timing:', {
        'DNS Lookup': `${(navEntry.domainLookupEnd - navEntry.domainLookupStart).toFixed(2)}ms`,
        'TCP Connect': `${(navEntry.connectEnd - navEntry.connectStart).toFixed(2)}ms`,
        'Request': `${(navEntry.responseStart - navEntry.requestStart).toFixed(2)}ms`,
        'Response': `${(navEntry.responseEnd - navEntry.responseStart).toFixed(2)}ms`,
        'DOM Processing': `${(navEntry.domContentLoadedEventEnd - navEntry.responseEnd).toFixed(2)}ms`,
        'Total': `${navEntry.loadEventEnd.toFixed(2)}ms`
      });
    });

    // Analyze API requests
    const apiRequests = resourceEntries.filter(entry => 
      entry.name.includes('/api/') || entry.name.includes('supabase')
    );

    if (apiRequests.length > 0) {
      console.log('API Requests:');
      apiRequests.forEach(entry => {
        console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
      });
    }

    console.groupEnd();
  }
}

// Create global instance
export const perfAnalyzer = new PerformanceAnalyzer();

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).perfAnalyzer = perfAnalyzer;
}

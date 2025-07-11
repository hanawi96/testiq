/**
 * Edit Page Performance Benchmark
 * Đo lường và so sánh hiệu suất trước/sau tối ưu
 */

interface PerformanceMetrics {
  // Core Web Vitals
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  
  // Custom Metrics
  timeToInteractive: number;
  dataLoadTime: number;
  editorLoadTime: number;
  totalPageLoadTime: number;
  
  // Network Metrics
  apiCallCount: number;
  totalTransferSize: number;
  cacheHitRate: number;
  
  // User Experience Metrics
  timeToFirstEdit: number;
  dropdownResponseTime: number;
  saveResponseTime: number;
}

interface BenchmarkResult {
  timestamp: string;
  version: 'before' | 'after';
  metrics: PerformanceMetrics;
  userAgent: string;
  connectionType: string;
}

class EditPageBenchmark {
  private results: BenchmarkResult[] = [];
  private startTime: number = 0;
  private metrics: Partial<PerformanceMetrics> = {};

  /**
   * Bắt đầu benchmark session
   */
  startBenchmark(version: 'before' | 'after' = 'after') {
    this.startTime = performance.now();
    this.metrics = {};
    
    console.log(`🚀 Starting Edit Page Benchmark (${version})`);
    
    // Đo Core Web Vitals
    this.measureCoreWebVitals();
    
    // Đo custom metrics
    this.measureCustomMetrics();
    
    return this;
  }

  /**
   * Đo Core Web Vitals
   */
  private measureCoreWebVitals() {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
          console.log(`📊 FCP: ${entry.startTime.toFixed(2)}ms`);
        }
      });
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.largestContentfulPaint = lastEntry.startTime;
      console.log(`📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.metrics.cumulativeLayoutShift = clsValue;
      console.log(`📊 CLS: ${clsValue.toFixed(4)}`);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Đo custom metrics
   */
  private measureCustomMetrics() {
    // API Call tracking
    this.trackApiCalls();
    
    // Data load time
    this.measureDataLoadTime();
    
    // Editor load time
    this.measureEditorLoadTime();
  }

  /**
   * Track API calls
   */
  private trackApiCalls() {
    let apiCallCount = 0;
    let totalTransferSize = 0;
    
    // Override fetch để track API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      apiCallCount++;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        // Estimate transfer size
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          totalTransferSize += parseInt(contentLength);
        }
        
        console.log(`🌐 API Call ${apiCallCount}: ${(endTime - startTime).toFixed(2)}ms`);
        
        this.metrics.apiCallCount = apiCallCount;
        this.metrics.totalTransferSize = totalTransferSize;
        
        return response;
      } catch (error) {
        console.error('API Call failed:', error);
        throw error;
      }
    };
  }

  /**
   * Đo data load time
   */
  measureDataLoadTime() {
    const dataLoadStart = performance.now();
    
    // Listen for data loaded events
    window.addEventListener('article-data-loaded', () => {
      const dataLoadTime = performance.now() - dataLoadStart;
      this.metrics.dataLoadTime = dataLoadTime;
      console.log(`📊 Data Load Time: ${dataLoadTime.toFixed(2)}ms`);
    });
  }

  /**
   * Đo editor load time
   */
  measureEditorLoadTime() {
    const editorLoadStart = performance.now();
    
    // Listen for editor ready events
    window.addEventListener('editor-ready', () => {
      const editorLoadTime = performance.now() - editorLoadStart;
      this.metrics.editorLoadTime = editorLoadTime;
      console.log(`📊 Editor Load Time: ${editorLoadTime.toFixed(2)}ms`);
    });
  }

  /**
   * Đo dropdown response time
   */
  measureDropdownResponse(dropdownType: 'categories' | 'authors' | 'tags') {
    const startTime = performance.now();
    
    return () => {
      const responseTime = performance.now() - startTime;
      console.log(`📊 ${dropdownType} Dropdown Response: ${responseTime.toFixed(2)}ms`);
      
      if (!this.metrics.dropdownResponseTime) {
        this.metrics.dropdownResponseTime = responseTime;
      } else {
        // Average multiple dropdown responses
        this.metrics.dropdownResponseTime = (this.metrics.dropdownResponseTime + responseTime) / 2;
      }
    };
  }

  /**
   * Đo save response time
   */
  measureSaveResponse() {
    const startTime = performance.now();
    
    return () => {
      const saveTime = performance.now() - startTime;
      this.metrics.saveResponseTime = saveTime;
      console.log(`📊 Save Response Time: ${saveTime.toFixed(2)}ms`);
    };
  }

  /**
   * Kết thúc benchmark và lưu kết quả
   */
  endBenchmark(version: 'before' | 'after' = 'after'): BenchmarkResult {
    const totalTime = performance.now() - this.startTime;
    this.metrics.totalPageLoadTime = totalTime;
    
    // Time to Interactive (estimate)
    this.metrics.timeToInteractive = Math.max(
      this.metrics.firstContentfulPaint || 0,
      this.metrics.dataLoadTime || 0,
      this.metrics.editorLoadTime || 0
    );

    const result: BenchmarkResult = {
      timestamp: new Date().toISOString(),
      version,
      metrics: this.metrics as PerformanceMetrics,
      userAgent: navigator.userAgent,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown'
    };

    this.results.push(result);
    
    console.log(`✅ Benchmark completed in ${totalTime.toFixed(2)}ms`);
    this.printSummary(result);
    
    return result;
  }

  /**
   * In tóm tắt kết quả
   */
  private printSummary(result: BenchmarkResult) {
    console.group(`📊 Performance Summary (${result.version})`);
    console.log(`🎯 Total Page Load: ${result.metrics.totalPageLoadTime.toFixed(2)}ms`);
    console.log(`🎨 First Contentful Paint: ${result.metrics.firstContentfulPaint?.toFixed(2)}ms`);
    console.log(`📊 Data Load Time: ${result.metrics.dataLoadTime?.toFixed(2)}ms`);
    console.log(`✏️ Editor Load Time: ${result.metrics.editorLoadTime?.toFixed(2)}ms`);
    console.log(`🌐 API Calls: ${result.metrics.apiCallCount}`);
    console.log(`📦 Transfer Size: ${(result.metrics.totalTransferSize / 1024).toFixed(2)}KB`);
    console.log(`⚡ Dropdown Response: ${result.metrics.dropdownResponseTime?.toFixed(2)}ms`);
    console.groupEnd();
  }

  /**
   * So sánh kết quả trước/sau
   */
  compareResults(): void {
    const beforeResults = this.results.filter(r => r.version === 'before');
    const afterResults = this.results.filter(r => r.version === 'after');
    
    if (beforeResults.length === 0 || afterResults.length === 0) {
      console.warn('⚠️ Cần có kết quả cả trước và sau để so sánh');
      return;
    }

    const before = beforeResults[beforeResults.length - 1];
    const after = afterResults[afterResults.length - 1];

    console.group('🔄 Performance Comparison');
    
    this.compareMetric('Total Page Load', before.metrics.totalPageLoadTime, after.metrics.totalPageLoadTime, 'ms');
    this.compareMetric('Data Load Time', before.metrics.dataLoadTime, after.metrics.dataLoadTime, 'ms');
    this.compareMetric('Editor Load Time', before.metrics.editorLoadTime, after.metrics.editorLoadTime, 'ms');
    this.compareMetric('API Calls', before.metrics.apiCallCount, after.metrics.apiCallCount, 'calls');
    this.compareMetric('Transfer Size', before.metrics.totalTransferSize, after.metrics.totalTransferSize, 'bytes');
    this.compareMetric('Dropdown Response', before.metrics.dropdownResponseTime, after.metrics.dropdownResponseTime, 'ms');
    
    console.groupEnd();
  }

  /**
   * So sánh một metric cụ thể
   */
  private compareMetric(name: string, before: number, after: number, unit: string) {
    if (!before || !after) return;
    
    const improvement = ((before - after) / before) * 100;
    const symbol = improvement > 0 ? '✅' : '❌';
    const direction = improvement > 0 ? 'faster' : 'slower';
    
    console.log(`${symbol} ${name}: ${before.toFixed(2)}${unit} → ${after.toFixed(2)}${unit} (${Math.abs(improvement).toFixed(1)}% ${direction})`);
  }

  /**
   * Export kết quả để phân tích
   */
  exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * Load kết quả từ localStorage
   */
  loadResults(): void {
    const saved = localStorage.getItem('edit-page-benchmark');
    if (saved) {
      this.results = JSON.parse(saved);
      console.log(`📊 Loaded ${this.results.length} benchmark results`);
    }
  }

  /**
   * Save kết quả vào localStorage
   */
  saveResults(): void {
    localStorage.setItem('edit-page-benchmark', JSON.stringify(this.results));
    console.log(`💾 Saved ${this.results.length} benchmark results`);
  }

  /**
   * Get current metrics (for real-time display)
   */
  getCurrentMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get all results
   */
  getResults(): BenchmarkResult[] {
    return [...this.results];
  }
}

// Global instance
export const editPageBenchmark = new EditPageBenchmark();

// Auto-load saved results
if (typeof window !== 'undefined') {
  editPageBenchmark.loadResults();
}

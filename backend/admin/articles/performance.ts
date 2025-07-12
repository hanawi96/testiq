/**
 * Articles Module - Performance Monitor & Optimization
 * Siêu nhẹ, siêu nhanh performance monitoring và optimization utilities
 */

// OPTIMIZED: Lightweight performance metrics
interface PerformanceMetrics {
  readonly queryTime: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly memoryUsage: number;
}

// OPTIMIZED: Simple performance tracker
class PerformanceTracker {
  private static metrics: PerformanceMetrics = {
    queryTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    memoryUsage: 0
  };

  // OPTIMIZED: Track query performance
  static trackQuery<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    
    return fn().finally(() => {
      const duration = Date.now() - start;
      this.metrics = {
        ...this.metrics,
        queryTime: this.metrics.queryTime + duration
      };

      // OPTIMIZED: Warn only for slow queries
      if (duration > 1000) {
        console.warn(`🐌 Slow query detected: ${operation} took ${duration}ms`);
      }
    });
  }

  // OPTIMIZED: Track cache performance
  static trackCacheHit(): void {
    this.metrics = {
      ...this.metrics,
      cacheHits: this.metrics.cacheHits + 1
    };
  }

  static trackCacheMiss(): void {
    this.metrics = {
      ...this.metrics,
      cacheMisses: this.metrics.cacheMisses + 1
    };
  }

  // OPTIMIZED: Get performance summary
  static getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // OPTIMIZED: Reset metrics
  static reset(): void {
    this.metrics = {
      queryTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: 0
    };
  }
}

// OPTIMIZED: Memory optimization utilities
export class PerformanceUtils {
  /**
   * OPTIMIZED: Lightweight object cleanup
   */
  static cleanupObject<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: Partial<T> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // OPTIMIZED: Skip null, undefined, empty strings, empty arrays
      if (value != null && value !== '' && (!Array.isArray(value) || value.length > 0)) {
        cleaned[key as keyof T] = value;
      }
    }
    
    return cleaned;
  }

  /**
   * OPTIMIZED: Batch processing với size limit
   */
  static async processBatch<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 50
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await PerformanceTracker.trackQuery(
        `batch-${i}-${i + batchSize}`,
        () => processor(batch)
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * OPTIMIZED: Memory-efficient array deduplication
   */
  static deduplicateArray<T>(array: T[], keyFn?: (item: T) => string): T[] {
    if (!keyFn) {
      return [...new Set(array)];
    }
    
    const seen = new Set<string>();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * OPTIMIZED: Smart pagination calculation
   */
  static calculatePagination(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return {
      totalPages,
      hasNext,
      hasPrev,
      // OPTIMIZED: Pre-calculate common values
      offset: (page - 1) * limit,
      isFirstPage: page === 1,
      isLastPage: page === totalPages
    };
  }

  /**
   * OPTIMIZED: Debounced function execution
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * OPTIMIZED: Get performance metrics
   */
  static getPerformanceMetrics(): PerformanceMetrics {
    return PerformanceTracker.getMetrics();
  }

  /**
   * OPTIMIZED: Reset performance tracking
   */
  static resetPerformanceTracking(): void {
    PerformanceTracker.reset();
  }
}

// Export performance tracker for internal use
export { PerformanceTracker };

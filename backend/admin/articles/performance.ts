/**
 * Articles Module - Essential Performance Utilities
 * Lightweight utilities for common performance tasks
 */

// ===== SIMPLE TIMING UTILITY =====

/**
 * SIMPLIFIED: Basic timing for slow operation detection
 */
class SimpleTimer {
  /**
   * Time an async operation and warn if slow
   */
  static async time<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      const duration = Date.now() - start;
      if (duration > 1000) {
        console.warn(`Slow operation: ${operation} took ${duration}ms`);
      }
    }
  }
}

// ===== ESSENTIAL UTILITIES =====

export class PerformanceUtils {
  /**
   * SIMPLIFIED: Clean object by removing empty values
   */
  static cleanupObject<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: Partial<T> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value != null && value !== '' && (!Array.isArray(value) || value.length > 0)) {
        cleaned[key as keyof T] = value;
      }
    }

    return cleaned;
  }

  /**
   * SIMPLIFIED: Batch processing with timing
   */
  static async processBatch<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 50
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await SimpleTimer.time(
        `batch-${i}-${i + batchSize}`,
        () => processor(batch)
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * SIMPLIFIED: Debounced function execution
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
}

// Export simple timer for timing operations
export { SimpleTimer };

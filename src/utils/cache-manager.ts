/**
 * Simple in-memory cache manager for admin data
 * Improves performance by caching frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
    console.log(`📦 Cache: Stored ${key} (TTL: ${entry.ttl}ms)`);
  }

  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      console.log(`🗑️ Cache: Expired and removed ${key}`);
      return null;
    }

    console.log(`✅ Cache: Hit for ${key}`);
    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache: Manually removed ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🧹 Cache: Cleared ${size} entries`);
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      const isExpired = (now - entry.timestamp) > entry.ttl;
      if (isExpired) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🧹 Cache: Cleared ${cleared} expired entries`);
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: Array<{ key: string; age: number; ttl: number; expired: boolean }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
      expired: (now - entry.timestamp) > entry.ttl
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  /**
   * Generate cache key for articles list
   */
  static getArticlesKey(page: number, limit: number, filters: any): string {
    const filterStr = JSON.stringify(filters);
    return `articles:${page}:${limit}:${btoa(filterStr)}`;
  }

  /**
   * Generate cache key for article stats
   */
  static getStatsKey(): string {
    return 'articles:stats';
  }

  /**
   * Generate cache key for related data
   */
  static getRelatedDataKey(articleIds: string[]): string {
    const idsStr = articleIds.sort().join(',');
    return `related:${btoa(idsStr)}`;
  }
}

// Create global instance
export const cacheManager = new CacheManager();

// Auto-cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.clearExpired();
  }, 5 * 60 * 1000);
}

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).cacheManager = cacheManager;
}

import { useState, useEffect, useCallback } from 'react';
import { MediaAPI } from '../services/media-api';

// Inline types to avoid import issues
interface MediaFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
  title?: string;
  description?: string;
  alt_text?: string;
  tags?: string[];
  subject?: string;
  rating?: string;
  comments?: string;
  origin?: string;
  authors?: string;
  date_taken?: string;
  program_name?: string;
  date_acquired?: string;
  copyright?: string;
}

interface MediaListResponse {
  files: MediaFile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface MediaListOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'image' | 'video' | 'document' | 'all';
  sortBy?: 'name' | 'size' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

interface UseMediaQueryResult {
  data: MediaListResponse | null;
  isLoading: boolean;
  error: string;
  refetch: () => Promise<void>;
  prefetchNext: () => void;
}

// Simple in-memory cache
const cache = new Map<string, { data: MediaListResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(options: MediaListOptions): string {
  return JSON.stringify(options);
}

function getCachedData(key: string): MediaListResponse | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCachedData(key: string, data: MediaListResponse): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function useMediaQuery(options: MediaListOptions = {}): UseMediaQueryResult {
  const [data, setData] = useState<MediaListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const cacheKey = getCacheKey(options);

  const fetchData = useCallback(async (useCache = true) => {
    setError('');
    
    // Check cache first
    if (useCache) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setIsLoading(false);
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const { data: result, error: fetchError } = await MediaAPI.getMediaFiles(options);
      
      if (fetchError || !result) {
        setError('Không thể tải danh sách media');
        return;
      }
      
      // Cache the result
      setCachedData(cacheKey, result);
      setData(result);
      
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, options]);

  const refetch = useCallback(async () => {
    await fetchData(false); // Force refresh, skip cache
  }, [fetchData]);

  const prefetchNext = useCallback(() => {
    if (!data || !data.hasMore) return;
    
    const nextOptions = { ...options, page: (options.page || 1) + 1 };
    const nextCacheKey = getCacheKey(nextOptions);
    
    // Only prefetch if not already cached
    if (!getCachedData(nextCacheKey)) {
      MediaAPI.getMediaFiles(nextOptions).then(({ data: result }) => {
        if (result) {
          setCachedData(nextCacheKey, result);
        }
      });
    }
  }, [data, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Prefetch next page when current page loads
  useEffect(() => {
    if (data && !isLoading) {
      const timer = setTimeout(prefetchNext, 1000); // Prefetch after 1s
      return () => clearTimeout(timer);
    }
  }, [data, isLoading, prefetchNext]);

  return {
    data,
    isLoading,
    error,
    refetch,
    prefetchNext
  };
}

// Clear cache function for when data changes (upload, delete, etc.)
export function clearMediaCache(): void {
  cache.clear();
}

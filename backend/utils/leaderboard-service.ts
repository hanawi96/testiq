import { supabase } from '../config/supabase';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  location: string;
  date: string;
  badge: string;
  isAnonymous: boolean;
  user_id?: string;
  gender?: string;
  age?: number;
  duration?: number; // Thời gian hoàn thành (giây)
}

export interface LeaderboardStats {
  totalParticipants: number;
  highestScore: number;
  averageScore: number;
  geniusPercentage: number;
  medianScore?: number;
  topPercentileScore?: number;
  recentGrowth?: number;
  averageImprovement?: number;
}

export interface PaginatedLeaderboard {
  data: LeaderboardEntry[] | null;
  stats: LeaderboardStats | null;
  totalPages: number;
  currentPage: number;
  error: any;
}

// ✅ OPTIMIZED: Unified cache structure
interface UnifiedCache {
  allResults: any[] | null;
  stats: LeaderboardStats | null;
  totalCount: number;
  lastFetch: number;
}

let cache: UnifiedCache = {
  allResults: null,
  stats: null,
  totalCount: 0,
  lastFetch: 0
};

const CACHE_DURATION = 10 * 1000; // 10 seconds
const BROWSER_CACHE_KEY = 'leaderboard_cache';

// ✅ SMART: Unified browser cache helpers
const browserCache = {
  get(): LeaderboardStats | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(BROWSER_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed.stats;
      }
    }
  } catch (e) {
    console.warn('Failed to read browser cache:', e);
  }
  return null;
  },

  set(stats: LeaderboardStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BROWSER_CACHE_KEY, JSON.stringify({
      stats,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to set browser cache:', e);
  }
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(BROWSER_CACHE_KEY);
    } catch (e) {
      console.warn('Failed to clear browser cache:', e);
    }
  }
};

// ✅ SMART: Unified retry operation with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let delay = 1000;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries || (error?.code && !['PGRST301', 'PGRST116'].includes(error.code))) {
        throw error;
      }
      
        console.log(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  
  throw new Error('Retry operation failed');
}

// ✅ OPTIMIZED: Single deduplication function for all use cases
function deduplicateResults(results: any[]): any[] {
  const emailBestScores = new Map<string, any>();
  
  for (const record of results) {
    if (!record.email) continue;
    
    const existing = emailBestScores.get(record.email);
          if (!existing || record.score > existing.score) {
      emailBestScores.set(record.email, record);
    }
  }
  
  return Array.from(emailBestScores.values()).sort((a, b) => b.score - a.score);
}

// ✅ OPTIMIZED: Single transform function for all use cases
function transformToLeaderboardEntry(result: any, rank: number): LeaderboardEntry {
        const isAnonymous = !result.user_id;
        
        return {
    rank,
          name: result.name || (isAnonymous ? 'Anonymous User' : `User_${result.user_id?.slice(-8) || 'Unknown'}`),
          score: result.score,
          location: result.country || 'Không rõ',
          date: result.tested_at,
          badge: getBadgeFromScore(result.score),
          isAnonymous,
          user_id: result.user_id,
          gender: result.gender,
          age: result.age,
          duration: result.duration_seconds
        };
}

// ✅ OPTIMIZED: Smart stats calculation
function calculateStats(results: any[]): LeaderboardStats {
  if (!results.length) {
    return { totalParticipants: 0, highestScore: 0, averageScore: 0, geniusPercentage: 0 };
  }

  const scores = results.map(r => r.score).filter(s => s != null).sort((a, b) => b - a);
  const total = scores.reduce((a, b) => a + b, 0);
  const geniusCount = scores.filter(s => s >= 140).length;
  
  // Advanced calculations
  const median = scores.length % 2 === 0 
    ? (scores[Math.floor(scores.length / 2) - 1] + scores[Math.floor(scores.length / 2)]) / 2
    : scores[Math.floor(scores.length / 2)];
  
  const topPercentileScore = scores[Math.floor(scores.length * 0.1)] || scores[0];
  
  // Growth calculation
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentTests = results.filter(r => new Date(r.tested_at) >= thirtyDaysAgo);
  const recentGrowth = Math.round((recentTests.length / results.length) * 100 * 10) / 10;

  return {
    totalParticipants: scores.length,
    highestScore: Math.max(...scores),
    averageScore: Math.round(total / scores.length),
    geniusPercentage: Math.round((geniusCount / scores.length) * 100 * 10) / 10,
    medianScore: Math.round(median),
    topPercentileScore,
    recentGrowth,
    averageImprovement: Math.round(Math.random() * 10 + 5) // Placeholder
  };
}

// ✅ SIMPLE: Badge function
function getBadgeFromScore(score: number): string {
  if (score >= 140) return 'genius';
  if (score >= 130) return 'superior'; 
  if (score >= 115) return 'above';
  return 'good';
}

// ✅ OPTIMIZED: Core data fetcher with smart caching
async function fetchLeaderboardData(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  const needsFetch = forceRefresh || !cache.allResults || (now - cache.lastFetch > CACHE_DURATION);
  
  if (!needsFetch) return cache.allResults!;

  console.log('🔄 Fetching fresh leaderboard data...');
  
  const result = await retryOperation(async () => {
    const { data, error } = await supabase
      .from('user_test_results')
      .select('score, tested_at, name, country, gender, age, email, user_id, duration_seconds')
      .order('score', { ascending: false });

    if (error) throw error;
    return data || [];
  });

  // Deduplicate and cache
  const uniqueResults = deduplicateResults(result);
  
  cache.allResults = uniqueResults;
  cache.stats = calculateStats(uniqueResults);
  cache.totalCount = uniqueResults.length;
  cache.lastFetch = now;
  
  console.log(`✅ Cached ${uniqueResults.length} unique results`);
  return uniqueResults;
}

/**
 * 🚀 UNIFIED: Main leaderboard function - handles all scenarios efficiently
 */
export async function getLeaderboard(
  page: number = 1, 
  itemsPerPage: number = 20,
  frontendPagination: boolean = false
): Promise<PaginatedLeaderboard> {
  try {
    // Get fresh data if needed
    const results = await fetchLeaderboardData();
    
    if (!results.length) {
      return { 
        data: [], 
        stats: cache.stats!,
        totalPages: 0,
        currentPage: page,
        error: null 
      };
    }
    
    // Smart pagination
    const totalPages = Math.ceil(results.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const pageResults = results.slice(startIndex, startIndex + itemsPerPage);
    
    // Transform to leaderboard entries
    const leaderboard = pageResults.map((result, index) => 
      transformToLeaderboardEntry(result, startIndex + index + 1)
    );

    console.log(`✅ Page ${page}/${totalPages}: ${leaderboard.length} items`);

    return { 
      data: leaderboard, 
      stats: cache.stats!, 
      totalPages, 
      currentPage: page,
      error: null 
    };

  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    
    // Fallback to cached data if available
    if (cache.allResults) {
      const totalPages = Math.ceil(cache.allResults.length / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const pageResults = cache.allResults.slice(startIndex, startIndex + itemsPerPage);
      
      const leaderboard = pageResults.map((result, index) => 
        transformToLeaderboardEntry(result, startIndex + index + 1)
      );

      return { 
        data: leaderboard, 
        stats: cache.stats!, 
        totalPages, 
        currentPage: page,
        error: null 
      };
    }
    
    return { 
      data: null, 
      stats: null, 
      totalPages: 0, 
      currentPage: page,
      error 
    };
  }
}

/**
 * 🚀 OPTIMIZED: Quick stats with multi-layer caching
 */
export async function getQuickStats(): Promise<LeaderboardStats> {
  try {
    // Check browser cache first
    const browserCached = browserCache.get();
    if (browserCached) return browserCached;

    // Check memory cache
    if (cache.stats && Date.now() - cache.lastFetch < CACHE_DURATION) {
      browserCache.set(cache.stats);
      return cache.stats;
    }

    // Fetch fresh data
    await fetchLeaderboardData();
    
    if (cache.stats) {
      browserCache.set(cache.stats);
      return cache.stats;
    }

    // Fallback
    return { totalParticipants: 0, highestScore: 0, averageScore: 0, geniusPercentage: 0 };

  } catch (error) {
    console.error('❌ Quick stats error:', error);
    return { totalParticipants: 0, highestScore: 0, averageScore: 0, geniusPercentage: 0 };
  }
}

/**
 * 🚀 OPTIMIZED: Recent top performers
 */
export async function getRecentTopPerformers(days: number = 7, limit: number = 5): Promise<{
  data: LeaderboardEntry[] | null;
  error: any;
}> {
  try {
    const results = await fetchLeaderboardData();
    
    if (!results.length) {
      return { data: [], error: null };
    }

      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

    const recentResults = results
      .filter(result => new Date(result.tested_at) >= dateThreshold)
      .slice(0, limit);
    
    const recentTop = recentResults.map((result, index) => 
      transformToLeaderboardEntry(result, index + 1)
    );

    return { data: recentTop, error: null };

  } catch (error) {
    console.error('❌ Recent top performers error:', error);
    return { data: null, error };
  }
}

/**
 * 🚀 OPTIMIZED: User local ranking
 */
export async function getUserLocalRanking(userId: string): Promise<{
  data: {
    userRank: number;
    userEntry: LeaderboardEntry;
    surrounding: LeaderboardEntry[];
    totalParticipants: number;
  } | null;
  error: any;
}> {
  try {
    const results = await fetchLeaderboardData();
    
    if (!results.length) {
      return { data: null, error: 'No leaderboard data available' };
    }

    // Find user position
    const userResultIndex = results.findIndex(result => result.user_id === userId);
    
    if (userResultIndex === -1) {
      return { data: null, error: 'User not found in leaderboard' };
    }

    const userRank = userResultIndex + 1;
    const userResult = results[userResultIndex];
    
    // Get surrounding users (5 above, user, 5 below)
    const startIndex = Math.max(0, userResultIndex - 5);
    const endIndex = Math.min(results.length, userResultIndex + 6);
    const surroundingResults = results.slice(startIndex, endIndex);

    const userEntry = transformToLeaderboardEntry(userResult, userRank);
    const surrounding = surroundingResults.map((result, index) => 
      transformToLeaderboardEntry(result, startIndex + index + 1)
    );

    return {
      data: {
        userRank,
        userEntry,
        surrounding,
        totalParticipants: results.length
      },
      error: null
    };

  } catch (error) {
    console.error('❌ Get user local ranking error:', error);
    return { data: null, error };
  }
}

// ✅ SCALABLE FUNCTIONS: Keep for compatibility but redirect to optimized versions
export async function getScalableLeaderboard(
  page: number = 1,
  itemsPerPage?: number,
  forceRefresh: boolean = false
): Promise<PaginatedLeaderboard> {
  if (forceRefresh) await fetchLeaderboardData(true);
  return getLeaderboard(page, itemsPerPage || 25);
}

export async function getMaterializedLeaderboard(
  page: number = 1,
  itemsPerPage: number = 50
): Promise<PaginatedLeaderboard> {
  // For now, redirect to optimized function
  // Can be replaced with actual materialized view later
  return getLeaderboard(page, itemsPerPage);
}

export async function getMaterializedUserRanking(userId: string): Promise<{
  data: {
    userRank: number;
    userEntry: LeaderboardEntry;
    surrounding: LeaderboardEntry[];
    totalParticipants: number;
  } | null;
  error: any;
}> {
  return getUserLocalRanking(userId);
}

// ✅ CACHE MANAGEMENT: Simplified
export function clearLeaderboardCache(): void {
  cache = {
    allResults: null,
    stats: null,
    totalCount: 0,
    lastFetch: 0
  };
  browserCache.clear();
  console.log('🧹 Cache cleared completely');
}

export function clearScalableCache(): void {
  clearLeaderboardCache(); // Unified cache now
}

export async function preloadLeaderboardData(): Promise<void> {
  try {
    console.log('🔥 Warming up cache...');
    await Promise.all([
      getQuickStats(),
      getLeaderboard(1, 10, true)
    ]);
    console.log('✅ Cache warmed up successfully');
  } catch (error) {
    console.error('❌ Failed to warm up cache:', error);
  }
}

export function getCacheStatus() {
  return {
    hasData: !!cache.allResults,
    hasStats: !!cache.stats,
    lastFetch: cache.lastFetch,
    cacheAge: Date.now() - cache.lastFetch,
    isExpired: (Date.now() - cache.lastFetch) > CACHE_DURATION
  };
}

export function getScalableCacheStats() {
  return getCacheStatus(); // Unified now
}

export async function refreshMaterializedCache(): Promise<boolean> {
  try {
    await fetchLeaderboardData(true);
    return true;
  } catch (error) {
    console.error('❌ Failed to refresh cache:', error);
    return false;
  }
}

export async function getMaterializedCacheStatus(): Promise<{
  status: any[] | null;
  error: any;
}> {
  return { status: [getCacheStatus()], error: null };
}

export async function forceRefreshLeaderboard(): Promise<PaginatedLeaderboard> {
  console.log('🔄 Force refreshing leaderboard...');
  clearLeaderboardCache();
  const result = await getLeaderboard(1, 20, true);
  console.log('✅ Force refresh completed');
  return result;
} 
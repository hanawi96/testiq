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

// Simple cache with longer duration and browser storage integration
let cachedData: {
  allResults: any[] | null;
  stats: LeaderboardStats | null;
  lastFetch: number;
} = {
  allResults: null,
  stats: null,
  lastFetch: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BROWSER_CACHE_KEY = 'leaderboard_stats_cache';

// Browser cache helpers
function getBrowserCache(): LeaderboardStats | null {
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
}

function setBrowserCache(stats: LeaderboardStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BROWSER_CACHE_KEY, JSON.stringify({
      stats,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to set browser cache:', e);
  }
}

// Retry utility for failed requests
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if it's a permanent error
      if (error?.code && !['PGRST301', 'PGRST116'].includes(error.code)) {
        console.error(`❌ Non-retryable error:`, error);
        throw error;
      }
      
      if (attempt < maxRetries) {
        console.log(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

/**
 * Simple optimized leaderboard function with retry logic
 */
export async function getLeaderboard(
  page: number = 1, 
  itemsPerPage: number = 20
): Promise<PaginatedLeaderboard> {
  try {
    const now = Date.now();
    const needsFetch = !cachedData.allResults || (now - cachedData.lastFetch > CACHE_DURATION);
    
    if (needsFetch) {
      console.log('🔄 Fetching leaderboard...');
      
      const result = await retryOperation(async () => {
        const { data: results, error } = await supabase
          .from('user_test_results')
          .select(`
            user_id,
            score,
            tested_at,
            guest_name,
            guest_location,
            user_profiles!left(full_name, location)
          `)
          .order('score', { ascending: false });

        if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
        }

        console.log('🗄️ Database query result:', {
          totalRows: results?.length || 0,
          sampleScores: results?.slice(0, 5).map(r => r.score) || []
        });

        return results;
      });

      if (!result?.length) {
        return { 
          data: [], 
          stats: { totalParticipants: 0, highestScore: 0, averageScore: 0, geniusPercentage: 0 },
          totalPages: 0,
          currentPage: page, 
          error: null 
        };
      }
      
      // Calculate stats
      const scores = result.map(r => r.score);
      const stats: LeaderboardStats = {
        totalParticipants: scores.length,
        highestScore: Math.max(...scores),
        averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        geniusPercentage: Math.round((scores.filter(s => s >= 140).length / scores.length) * 100 * 10) / 10
      };
      
      // Update cache
      cachedData = {
        allResults: result,
        stats,
        lastFetch: now
      };
      
      console.log(`✅ Cached ${result.length} results`);
    }
    
    // Paginate from cache
    const totalRecords = cachedData.allResults?.length || 0;
    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageResults = cachedData.allResults?.slice(startIndex, endIndex) || [];
    
    console.log('🔢 Backend pagination:', {
      requestedPage: page,
      itemsPerPage,
      totalRecords,
      totalPages,
      startIndex,
      endIndex,
      pageResultsLength: pageResults.length
    });
    
    // Transform to leaderboard format
    const leaderboard: LeaderboardEntry[] = pageResults.map((result: any, index) => {
      const globalRank = startIndex + index + 1;
      const isAnonymous = !result.user_id;
      
      const name = isAnonymous 
        ? (result.guest_name || 'Anonymous User')
        : (result.user_profiles?.full_name || `User_${result.user_id.slice(-8)}`);

      // Fix location logic
      const location = isAnonymous 
        ? (result.guest_location || 'Không rõ')
        : (result.user_profiles?.location || 'Chưa cập nhật');
      
      return {
        rank: globalRank,
        name,
        score: result.score,
        location,
        date: result.tested_at,
        badge: getBadgeFromScore(result.score),
        isAnonymous,
        user_id: result.user_id
      };
    });

    return { 
      data: leaderboard, 
      stats: cachedData.stats, 
      totalPages, 
      currentPage: page,
      error: null 
    };

  } catch (err) {
    console.error('❌ Leaderboard error:', err);
    
    // Return cached data if available, even if stale
    if (cachedData.allResults) {
      console.log('⚠️ Using stale cache due to error');
      const totalPages = Math.ceil(cachedData.allResults.length / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const pageResults = cachedData.allResults.slice(startIndex, startIndex + itemsPerPage);
      
      const leaderboard: LeaderboardEntry[] = pageResults.map((result: any, index) => {
        const globalRank = startIndex + index + 1;
        const isAnonymous = !result.user_id;
        const name = isAnonymous 
          ? (result.guest_name || 'Anonymous User')
          : (result.user_profiles?.full_name || `User_${result.user_id.slice(-8)}`);
        
        // Fix location logic
        const location = isAnonymous 
          ? (result.guest_location || 'Không rõ')
          : (result.user_profiles?.location || 'Chưa cập nhật');
        
        return {
          rank: globalRank,
          name,
          score: result.score,
          location,
          date: result.tested_at,
          badge: getBadgeFromScore(result.score),
          isAnonymous,
          user_id: result.user_id
        };
      });

      return { 
        data: leaderboard, 
        stats: cachedData.stats, 
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
      error: err 
    };
  }
}

/**
 * Get badge based on IQ score
 */
function getBadgeFromScore(score: number): string {
  if (score >= 140) return 'genius';
  if (score >= 130) return 'superior'; 
  if (score >= 115) return 'above';
  return 'good';
}

/**
 * Simple recent top performers with retry
 */
export async function getRecentTopPerformers(days: number = 7, limit: number = 5): Promise<{
  data: LeaderboardEntry[] | null;
  error: any;
}> {
  try {
    // Use cached data if available
    if (cachedData.allResults && Date.now() - cachedData.lastFetch < CACHE_DURATION) {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);
      
      const recentResults = cachedData.allResults
        .filter((result: any) => new Date(result.tested_at) >= dateThreshold)
        .slice(0, limit);
      
      const recentTop: LeaderboardEntry[] = recentResults.map((result: any, index) => {
        const isAnonymous = !result.user_id;
        const name = isAnonymous 
          ? (result.guest_name || 'Anonymous User')
          : (result.user_profiles?.full_name || `User_${result.user_id.slice(-8)}`);
        
        // Fix location logic
        const location = isAnonymous 
          ? (result.guest_location || 'Không rõ')
          : (result.user_profiles?.location || 'Chưa cập nhật');
        
        return {
          rank: index + 1,
          name,
          score: result.score,
          location,
          date: result.tested_at,
          badge: getBadgeFromScore(result.score),
          isAnonymous,
          user_id: result.user_id
        };
      });
      
      return { data: recentTop, error: null };
    }

    // Fallback direct query with retry
    const result = await retryOperation(async () => {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const { data: results, error } = await supabase
        .from('user_test_results')
        .select(`
          user_id,
          score,
          tested_at,
          guest_name,
          guest_location,
          user_profiles!left(full_name, location)
        `)
        .gte('tested_at', dateThreshold.toISOString())
        .order('score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return results;
    });

    const recentTop: LeaderboardEntry[] = (result || []).map((entry: any, index) => {
      const isAnonymous = !entry.user_id;
      const name = isAnonymous 
        ? (entry.guest_name || 'Anonymous User')
        : (entry.user_profiles?.full_name || `User_${entry.user_id.slice(-8)}`);
      
      // Fix location logic
      const location = isAnonymous 
        ? (entry.guest_location || 'Không rõ')
        : (entry.user_profiles?.location || 'Chưa cập nhật');
      
      return {
        rank: index + 1,
        name,
        score: entry.score,
        location,
        date: entry.tested_at,
        badge: getBadgeFromScore(entry.score),
        isAnonymous,
        user_id: entry.user_id
      };
    });

    return { data: recentTop, error: null };

  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Clear cache to force refresh (useful after data updates)
 */
export function clearLeaderboardCache(): void {
  cachedData = {
    allResults: null,
    stats: null,
    lastFetch: 0
  };
  
  // Clear browser cache too
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(BROWSER_CACHE_KEY);
    } catch (e) {
      console.warn('Failed to clear browser cache:', e);
    }
  }
  
  console.log('🧹 Leaderboard cache cleared completely');
}

/**
 * Preload data to warm up cache (call this on app startup)
 */
export async function preloadLeaderboardData(): Promise<void> {
  try {
    console.log('🔥 Warming up leaderboard cache...');
    await Promise.all([
      getQuickStats(),
      getLeaderboard(1, 10)
    ]);
    console.log('✅ Leaderboard cache warmed up successfully');
  } catch (error) {
    console.error('❌ Failed to warm up cache:', error);
  }
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus() {
  return {
    hasData: !!cachedData.allResults,
    hasStats: !!cachedData.stats,
    lastFetch: cachedData.lastFetch,
    cacheAge: Date.now() - cachedData.lastFetch,
    isExpired: (Date.now() - cachedData.lastFetch) > CACHE_DURATION
  };
}

/**
 * Ultra-fast stats calculation with smart caching and advanced metrics
 */
export async function getQuickStats(): Promise<LeaderboardStats> {
  try {
    // Multi-layer caching: browser -> memory -> database
    const browserCached = getBrowserCache();
    if (browserCached) {
      return browserCached;
    }

    // Use cached stats if available
    if (cachedData.stats && Date.now() - cachedData.lastFetch < CACHE_DURATION) {
      setBrowserCache(cachedData.stats);
      return cachedData.stats;
    }

    // Fast stats-only query with timestamps for growth analysis
    const { data: results, error } = await supabase
      .from('user_test_results')
      .select('score, tested_at')
      .order('score', { ascending: false });

    if (error) throw error;

    if (!results?.length) {
      return { totalParticipants: 0, highestScore: 0, averageScore: 0, geniusPercentage: 0 };
    }

    // Ultra-fast calculation with advanced metrics
    const scores = results.map(r => r.score).sort((a, b) => b - a);
    const total = scores.reduce((a, b) => a + b, 0);
    const geniusCount = scores.filter(s => s >= 140).length;
    
    // Advanced calculations
    const median = scores.length % 2 === 0 
      ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
      : scores[Math.floor(scores.length / 2)];
    
    const ninetiethPercentileIndex = Math.floor(scores.length * 0.1);
    const topPercentileScore = scores[ninetiethPercentileIndex] || scores[0];
    
    // Growth in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTests = results.filter(r => new Date(r.tested_at) >= thirtyDaysAgo);
    const recentGrowth = results.length > 0 ? Math.round((recentTests.length / results.length) * 100 * 10) / 10 : 0;
    
    const stats: LeaderboardStats = {
      totalParticipants: scores.length,
      highestScore: Math.max(...scores),
      averageScore: Math.round(total / scores.length),
      geniusPercentage: Math.round((geniusCount / scores.length) * 100 * 10) / 10,
      medianScore: Math.round(median),
      topPercentileScore,
      recentGrowth,
      averageImprovement: Math.round(Math.random() * 10 + 5) // Placeholder for now
    };

    // Multi-layer cache update
    cachedData.stats = stats;
    cachedData.lastFetch = Date.now();
    setBrowserCache(stats);

    return stats;

  } catch (error) {
    console.error('❌ Quick stats error:', error);
    // Return sensible defaults
    return { totalParticipants: 0, highestScore: 0, averageScore: 0, geniusPercentage: 0 };
  }
}

/**
 * Get user's personal ranking with surrounding users (local view)
 * Shows current user's position + 5 people above and below
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
    // Ensure we have fresh data
    const now = Date.now();
    const needsFetch = !cachedData.allResults || (now - cachedData.lastFetch > CACHE_DURATION);
    
    if (needsFetch) {
      console.log('🔄 Fetching leaderboard for local ranking...');
      await getLeaderboard(1, 20); // This will populate the cache
    }

    if (!cachedData.allResults?.length) {
      return { data: null, error: 'No leaderboard data available' };
    }

    // Find user's position in the global ranking
    const userResultIndex = cachedData.allResults.findIndex((result: any) => result.user_id === userId);
    
    if (userResultIndex === -1) {
      return { data: null, error: 'User not found in leaderboard' };
    }

    const userRank = userResultIndex + 1;
    const userResult = cachedData.allResults[userResultIndex];
    
    // Get surrounding users (5 above, user, 5 below) - max 11 entries total
    const startIndex = Math.max(0, userResultIndex - 5);
    const endIndex = Math.min(cachedData.allResults.length, userResultIndex + 6);
    const surroundingResults = cachedData.allResults.slice(startIndex, endIndex);

    // Transform to leaderboard format
    const userEntry: LeaderboardEntry = {
      rank: userRank,
      name: userResult.user_profiles?.full_name || `User_${userResult.user_id.slice(-8)}`,
      score: userResult.score,
      location: userResult.user_profiles?.location || 'Chưa cập nhật',
      date: userResult.tested_at,
      badge: getBadgeFromScore(userResult.score),
      isAnonymous: false,
      user_id: userResult.user_id
    };

    const surrounding: LeaderboardEntry[] = surroundingResults.map((result: any, index) => {
      const globalRank = startIndex + index + 1;
      const isAnonymous = !result.user_id;
      
      const name = isAnonymous 
        ? (result.guest_name || 'Anonymous User')
        : (result.user_profiles?.full_name || `User_${result.user_id.slice(-8)}`);

      const location = isAnonymous 
        ? (result.guest_location || 'Không rõ')
        : (result.user_profiles?.location || 'Chưa cập nhật');
      
      return {
        rank: globalRank,
        name,
        score: result.score,
        location,
        date: result.tested_at,
        badge: getBadgeFromScore(result.score),
        isAnonymous,
        user_id: result.user_id
      };
    });

    return {
      data: {
        userRank,
        userEntry,
        surrounding,
        totalParticipants: cachedData.allResults.length
      },
      error: null
    };

  } catch (error) {
    console.error('❌ Get user local ranking error:', error);
    return { data: null, error };
  }
} 
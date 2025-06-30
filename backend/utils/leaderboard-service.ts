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
  lastFetch: 0 // Force refresh by setting lastFetch to 0
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
 * ULTRA-OPTIMIZED leaderboard function - No JOINs, all data from user_test_results
 * 🚀 PERFORMANCE: Only select essential fields, use optimized indexes, smart caching
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
                // ✅ SIMPLE & SMART: Chỉ group by email - đơn giản nhất!
        const { data: fallbackResults, error: fallbackError } = await supabase
          .from('user_test_results')
          .select(`
            score,
            tested_at,
            name,
            country,
            gender,
            age,
            email,
            user_id
          `)
          .order('score', { ascending: false });

        if (fallbackError) throw fallbackError;

        // ✅ SUPER SIMPLE: Group by email - lấy điểm cao nhất mỗi email
        const emailBestScores = new Map<string, any>();
        for (const record of fallbackResults || []) {
          const email = record.email;
          if (!email) continue; // Bỏ qua records không có email
          
          const existing = emailBestScores.get(email);
          if (!existing || record.score > existing.score) {
            emailBestScores.set(email, record);
          }
        }
        
        const uniqueResults = Array.from(emailBestScores.values())
          .sort((a: any, b: any) => b.score - a.score);

        console.log('🗄️ Email-based deduplication result:', {
          originalRows: fallbackResults?.length || 0,
          uniqueEmails: uniqueResults.length,
          sampleScores: uniqueResults.slice(0, 5).map((r: any) => r.score) || []
        });

        return uniqueResults;
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
    
    // 🔄 Transform to leaderboard format - OPTIMIZED: All data from user_test_results
    // ⚡ PERFORMANCE: No JOIN needed, simple field mapping, ultra-fast processing
    const leaderboard: LeaderboardEntry[] = pageResults.map((result: any, index) => {
      const globalRank = startIndex + index + 1;
      const isAnonymous = !result.user_id;
      
      return {
        rank: globalRank,
        name: result.name || (isAnonymous ? 'Anonymous User' : `User_${result.user_id?.slice(-8) || 'Unknown'}`),
        score: result.score,
        location: result.country || 'Không rõ',
        date: result.tested_at,
        badge: getBadgeFromScore(result.score),
        isAnonymous,
        user_id: result.user_id,
        gender: result.gender,
        age: result.age
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
        
        return {
          rank: globalRank,
          name: result.name || (isAnonymous ? 'Anonymous User' : `User_${result.user_id?.slice(-8) || 'Unknown'}`),
          score: result.score,
          location: result.country || 'Không rõ',
          date: result.tested_at,
          badge: getBadgeFromScore(result.score),
          isAnonymous,
          user_id: result.user_id,
          gender: result.gender,
          age: result.age
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
        
        return {
          rank: index + 1,
          name: result.name || (isAnonymous ? 'Anonymous User' : `User_${result.user_id?.slice(-8) || 'Unknown'}`),
          score: result.score,
          location: result.country || 'Không rõ',
          date: result.tested_at,
          badge: getBadgeFromScore(result.score),
          isAnonymous,
          user_id: result.user_id,
          gender: result.gender,
          age: result.age
        };
      });
      
      return { data: recentTop, error: null };
    }

    // Fallback direct query with retry
    const result = await retryOperation(async () => {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      // 🚀 ULTRA-OPTIMIZED: Select only essential fields for recent performers
      const { data: results, error } = await supabase
        .from('user_test_results')
        .select(`
          user_id,
          score,
          tested_at,
          name,
          country,
          gender,
          age
        `)
        .gte('tested_at', dateThreshold.toISOString())
        .order('score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return results;
    });

    const recentTop: LeaderboardEntry[] = (result || []).map((entry: any, index) => {
      const isAnonymous = !entry.user_id;
      
      return {
        rank: index + 1,
        name: entry.name || (isAnonymous ? 'Anonymous User' : `User_${entry.user_id?.slice(-8) || 'Unknown'}`),
        score: entry.score,
        location: entry.country || 'Không rõ',
        date: entry.tested_at,
        badge: getBadgeFromScore(entry.score),
        isAnonymous,
        user_id: entry.user_id,
        gender: entry.gender,
        age: entry.age
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

    // Transform to leaderboard format - OPTIMIZED: All data from user_test_results
    const userEntry: LeaderboardEntry = {
      rank: userRank,
      name: userResult.name || `User_${userResult.user_id.slice(-8)}`,
      score: userResult.score,
      location: userResult.country || 'Chưa cập nhật',
      date: userResult.tested_at,
      badge: getBadgeFromScore(userResult.score),
      isAnonymous: false,
      user_id: userResult.user_id,
      gender: userResult.gender,
      age: userResult.age
    };

    const surrounding: LeaderboardEntry[] = surroundingResults.map((result: any, index) => {
      const globalRank = startIndex + index + 1;
      const isAnonymous = !result.user_id;
      
      return {
        rank: globalRank,
        name: result.name || (isAnonymous ? 'Anonymous User' : `User_${result.user_id?.slice(-8) || 'Unknown'}`),
        score: result.score,
        location: result.country || 'Không rõ',
        date: result.tested_at,
        badge: getBadgeFromScore(result.score),
        isAnonymous,
        user_id: result.user_id,
        gender: result.gender,
        age: result.age
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
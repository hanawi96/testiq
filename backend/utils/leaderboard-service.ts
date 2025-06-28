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
}

export interface PaginatedLeaderboard {
  data: LeaderboardEntry[] | null;
  stats: LeaderboardStats | null;
  totalPages: number;
  currentPage: number;
  error: any;
}

// Simple cache with longer duration
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
    const totalPages = Math.ceil((cachedData.allResults?.length || 0) / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageResults = cachedData.allResults?.slice(startIndex, endIndex) || [];
    
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
  console.log('🧹 Leaderboard cache cleared');
} 
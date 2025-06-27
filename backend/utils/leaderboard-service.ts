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

/**
 * Get leaderboard data from user_test_results table (OPTIMIZED)
 */
export async function getLeaderboard(limit: number = 50): Promise<{
  data: LeaderboardEntry[] | null;
  stats: LeaderboardStats | null;
  error: any;
}> {
  try {
    console.log('🏆 Fetching leaderboard data (optimized)...');

    // SINGLE QUERY: Get all test results for both leaderboard and stats
    const { data: allResults, error } = await supabase
      .from('user_test_results')
      .select('user_id, score, tested_at, guest_name, guest_location')
      .order('score', { ascending: false });

    if (error) {
      console.error('❌ Error fetching leaderboard:', error);
      return { data: null, stats: null, error };
    }

    if (!allResults || allResults.length === 0) {
      return { 
        data: [], 
        stats: { totalParticipants: 0, highestScore: 0, averageScore: 0, geniusPercentage: 0 }, 
        error: null 
      };
    }

    // Calculate stats from the same data (no extra query)
    const scores = allResults.map(r => r.score);
    const totalParticipants = scores.length;
    const highestScore = Math.max(...scores);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalParticipants);
    const geniusCount = scores.filter(score => score >= 140).length;
    const geniusPercentage = totalParticipants > 0 
      ? Math.round((geniusCount / totalParticipants) * 100 * 10) / 10 
      : 0;

    const stats: LeaderboardStats = {
      totalParticipants,
      highestScore,
      averageScore,
      geniusPercentage
    };

    // Get top entries for leaderboard (already sorted by score desc)
    const topResults = allResults.slice(0, limit);
    
    // Transform to leaderboard format (no JOIN needed)
    const leaderboard: LeaderboardEntry[] = topResults.map((result: any, index) => {
      const isAnonymous = !result.user_id;
      
      return {
        rank: index + 1,
        name: isAnonymous ? (result.guest_name || 'Anonymous User') : 'User',
        score: result.score,
        location: isAnonymous ? (result.guest_location || 'Không rõ') : 'Không rõ',
        date: result.tested_at,
        badge: getBadgeFromScore(result.score),
        isAnonymous,
        user_id: result.user_id
      };
    });

    console.log(`✅ Leaderboard optimized: ${leaderboard.length} entries, ${totalParticipants} total`);
    return { data: leaderboard, stats, error: null };

  } catch (err) {
    console.error('❌ Unexpected error fetching leaderboard:', err);
    return { data: null, stats: null, error: err };
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
 * Get recent top performers (for highlights) - OPTIMIZED
 */
export async function getRecentTopPerformers(days: number = 7, limit: number = 5): Promise<{
  data: LeaderboardEntry[] | null;
  error: any;
}> {
  try {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const { data: recentResults, error } = await supabase
      .from('user_test_results')
      .select('user_id, score, tested_at, guest_name, guest_location')
      .gte('tested_at', dateThreshold.toISOString())
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error };
    }

    const recentTop: LeaderboardEntry[] = (recentResults || []).map((result: any, index) => {
      const isAnonymous = !result.user_id;
      
      return {
        rank: index + 1,
        name: isAnonymous ? (result.guest_name || 'Anonymous User') : 'User',
        score: result.score,
        location: isAnonymous ? (result.guest_location || 'Không rõ') : 'Không rõ',
        date: result.tested_at,
        badge: getBadgeFromScore(result.score),
        isAnonymous,
        user_id: result.user_id
      };
    });

    return { data: recentTop, error: null };

  } catch (err) {
    return { data: null, error: err };
  }
} 
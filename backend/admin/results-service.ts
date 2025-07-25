import { supabase, TABLES } from '../config/supabase';

export interface TestResult {
  id: string;
  user_id: string | null;
  test_type: string;
  score: number;
  accuracy: number | null;
  duration_seconds: number | null;
  tested_at: string;
  name: string | null;
  email: string | null;
  age: number | null;
  country: string | null;
  country_code: string | null;
  gender: string | null;
  user_type: 'registered' | 'anonymous';
}

export interface ResultsStats {
  totalTests: number;
  averageScore: number;
  totalParticipants: number;
  testsToday: number;
  highestScore: number;
  geniusCount: number;
  averageDuration: number;
  topCountries: Array<{ country: string; count: number; avgScore: number }>;
}

export interface ResultsFilters {
  search?: string;
  user_type?: 'registered' | 'anonymous' | 'all';
  score_min?: number;
  score_max?: number;
  date_from?: string;
  date_to?: string;
  country?: string;
  test_type?: string;
}

export interface ResultsListResponse {
  results: TestResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ResultsService {
  /**
   * Get test results with pagination and filters
   */
  static async getResults(
    page: number = 1,
    limit: number = 20,
    filters: ResultsFilters = {}
  ): Promise<{ data: ResultsListResponse | null; error: any }> {
    try {
      console.log('ResultsService: Fetching test results', { page, limit, filters });

      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('user_test_results')
        .select('*', { count: 'exact' })
        .order('tested_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,country.ilike.%${filters.search}%`);
      }

      if (filters.user_type && filters.user_type !== 'all') {
        if (filters.user_type === 'anonymous') {
          query = query.is('user_id', null);
        } else {
          query = query.not('user_id', 'is', null);
        }
      }

      if (filters.score_min !== undefined) {
        query = query.gte('score', filters.score_min);
      }

      if (filters.score_max !== undefined) {
        query = query.lte('score', filters.score_max);
      }

      if (filters.date_from) {
        query = query.gte('tested_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('tested_at', filters.date_to);
      }

      if (filters.country) {
        query = query.eq('country', filters.country);
      }

      if (filters.test_type) {
        query = query.eq('test_type', filters.test_type);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: results, error, count } = await query;

      if (error) {
        console.error('ResultsService: Error fetching results:', error);
        return { data: null, error };
      }

      // Transform results
      const transformedResults: TestResult[] = (results || []).map(result => ({
        ...result,
        user_type: result.user_id ? 'registered' : 'anonymous'
      }));

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      const response: ResultsListResponse = {
        results: transformedResults,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      console.log('ResultsService: Results fetched successfully:', {
        returned: transformedResults.length,
        total,
        page,
        totalPages
      });

      return { data: response, error: null };

    } catch (err) {
      console.error('ResultsService: Unexpected error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get results statistics
   */
  static async getStats(): Promise<{ data: ResultsStats | null; error: any }> {
    try {
      console.log('ResultsService: Fetching results statistics');

      const { data: results, error } = await supabase
        .from('user_test_results')
        .select('score, duration_seconds, tested_at, country, user_id');

      if (error) {
        console.error('ResultsService: Error fetching stats:', error);
        return { data: null, error };
      }

      if (!results || results.length === 0) {
        return {
          data: {
            totalTests: 0,
            averageScore: 0,
            totalParticipants: 0,
            testsToday: 0,
            highestScore: 0,
            geniusCount: 0,
            averageDuration: 0,
            topCountries: []
          },
          error: null
        };
      }

      // Calculate stats
      const totalTests = results.length;
      const scores = results.map(r => r.score).filter(s => s != null);
      const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const highestScore = Math.max(...scores);
      const geniusCount = scores.filter(s => s >= 140).length;

      // Unique participants (by email for anonymous, by user_id for registered)
      const uniqueParticipants = new Set();
      results.forEach(r => {
        if (r.user_id) {
          uniqueParticipants.add(r.user_id);
        } else {
          // For anonymous, we'll count each test as unique participant for now
          uniqueParticipants.add(r.id);
        }
      });

      // Tests today
      const today = new Date().toISOString().split('T')[0];
      const testsToday = results.filter(r => r.tested_at?.startsWith(today)).length;

      // Average duration
      const durations = results.map(r => r.duration_seconds).filter(d => d != null && d > 0);
      const averageDuration = durations.length > 0 
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      // Top countries
      const countryStats = new Map();
      results.forEach(r => {
        if (r.country) {
          const existing = countryStats.get(r.country) || { count: 0, totalScore: 0 };
          existing.count++;
          existing.totalScore += r.score;
          countryStats.set(r.country, existing);
        }
      });

      const topCountries = Array.from(countryStats.entries())
        .map(([country, stats]) => ({
          country,
          count: stats.count,
          avgScore: Math.round(stats.totalScore / stats.count)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const statsData: ResultsStats = {
        totalTests,
        averageScore,
        totalParticipants: uniqueParticipants.size,
        testsToday,
        highestScore,
        geniusCount,
        averageDuration,
        topCountries
      };

      console.log('ResultsService: Stats calculated successfully');
      return { data: statsData, error: null };

    } catch (err) {
      console.error('ResultsService: Unexpected error calculating stats:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get score distribution for charts
   */
  static async getScoreDistribution(): Promise<{ data: Array<{ range: string; count: number }> | null; error: any }> {
    try {
      const { data: results, error } = await supabase
        .from('user_test_results')
        .select('score');

      if (error) return { data: null, error };

      const ranges = [
        { label: '< 70', min: 0, max: 69 },
        { label: '70-84', min: 70, max: 84 },
        { label: '85-99', min: 85, max: 99 },
        { label: '100-114', min: 100, max: 114 },
        { label: '115-129', min: 115, max: 129 },
        { label: '130-144', min: 130, max: 144 },
        { label: '145+', min: 145, max: 999 }
      ];

      const distribution = ranges.map(range => ({
        range: range.label,
        count: results?.filter(r => r.score >= range.min && r.score <= range.max).length || 0
      }));

      return { data: distribution, error: null };

    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Export results data
   */
  static async exportResults(filters: ResultsFilters = {}): Promise<{ data: TestResult[] | null; error: any }> {
    try {
      console.log('ResultsService: Exporting results with filters:', filters);

      // Get all results without pagination for export
      let query = supabase
        .from('user_test_results')
        .select('*')
        .order('tested_at', { ascending: false });

      // Apply same filters as getResults but without pagination
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,country.ilike.%${filters.search}%`);
      }

      if (filters.user_type && filters.user_type !== 'all') {
        if (filters.user_type === 'anonymous') {
          query = query.is('user_id', null);
        } else {
          query = query.not('user_id', 'is', null);
        }
      }

      if (filters.score_min !== undefined) {
        query = query.gte('score', filters.score_min);
      }

      if (filters.score_max !== undefined) {
        query = query.lte('score', filters.score_max);
      }

      if (filters.date_from) {
        query = query.gte('tested_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('tested_at', filters.date_to);
      }

      if (filters.country) {
        query = query.eq('country', filters.country);
      }

      const { data: results, error } = await query;

      if (error) {
        console.error('ResultsService: Error exporting results:', error);
        return { data: null, error };
      }

      const transformedResults: TestResult[] = (results || []).map(result => ({
        ...result,
        user_type: result.user_id ? 'registered' : 'anonymous'
      }));

      console.log('ResultsService: Export completed:', transformedResults.length, 'results');
      return { data: transformedResults, error: null };

    } catch (err) {
      console.error('ResultsService: Unexpected error during export:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Bulk delete test results
   */
  static async deleteResults(resultIds: string[]): Promise<{ data: number; error: any }> {
    try {
      console.log('ResultsService: Bulk deleting results:', resultIds);

      if (!resultIds || resultIds.length === 0) {
        return { data: 0, error: null };
      }

      const { error: deleteError } = await supabase
        .from('user_test_results')
        .delete()
        .in('id', resultIds);

      if (deleteError) {
        console.error('ResultsService: Error in bulk delete:', deleteError);
        return { data: 0, error: deleteError };
      }

      console.log('ResultsService: Bulk delete completed:', resultIds.length, 'results deleted');
      return { data: resultIds.length, error: null };

    } catch (err: any) {
      console.error('ResultsService: Unexpected error in bulk delete:', err);
      return { data: 0, error: err };
    }
  }
}

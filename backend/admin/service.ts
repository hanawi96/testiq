import { supabase, TABLES } from '../config/supabase';
import { AuthService } from '../auth/service';
import type { AdminStats, AdminAction, NewUsersStats, WeeklyTestStats, DailyTestStats, DailyComparisonStats, WeeklyNewUsersStats, NewUsersTimeRange, TestTimeRange } from '../types';

// Cache for stats (5 minutes) - separate cache for each time range
let newUsersStatsCache: Record<string, { data: NewUsersStats; timestamp: number }> = {};
let weeklyTestStatsCache: { data: WeeklyTestStats; timestamp: number } | null = null;
let dailyTestStatsCache: Record<string, { data: DailyTestStats; timestamp: number }> = {};
let dailyComparisonStatsCache: { data: DailyComparisonStats; timestamp: number } | null = null;
let weeklyNewUsersStatsCache: { data: WeeklyNewUsersStats; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Admin Service
 * Handles admin-specific operations and data
 */
export class AdminService {

  /**
   * Get admin dashboard statistics
   */
  static async getStats(): Promise<{ stats: AdminStats | null; error: any }> {
    try {
      console.log('AdminService: Fetching dashboard stats');

      // Mock data for now - replace with real queries later
      const stats: AdminStats = {
        totalTests: 1234,
        totalUsers: 567,
        testsToday: 89,
        averageScore: 125,
      };

      // TODO: Replace with real database queries
      // const { data: testCount } = await supabase.from(TABLES.TEST_RESULTS).select('count');
      // const { data: userCount } = await supabase.from(TABLES.PROFILES).select('count');

      console.log('AdminService: Stats retrieved successfully');
      return { stats, error: null };
    } catch (err) {
      console.error('AdminService: Error fetching stats:', err);
      return { stats: null, error: err };
    }
  }

  /**
   * Get new users statistics for specified time range
   */
  static async getNewUsersStats(timeRange: NewUsersTimeRange = '7d'): Promise<{
    data: NewUsersStats | null;
    error: any
  }> {
    try {
      console.log(`AdminService: Fetching new users stats for ${timeRange}`);

      // Check cache first
      const cacheKey = `newUsers_${timeRange}`;
      const now = Date.now();
      if (newUsersStatsCache[cacheKey] && (now - newUsersStatsCache[cacheKey].timestamp) < CACHE_DURATION) {
        console.log(`AdminService: Using cached new users stats for ${timeRange}`);
        return { data: newUsersStatsCache[cacheKey].data, error: null };
      }

      // Calculate date range and sampling based on time range
      const endDate = new Date();
      const startDate = new Date();
      let days: number;
      let sampleInterval: number = 1; // Sample every N days for performance

      switch (timeRange) {
        case '7d':
          days = 7;
          sampleInterval = 1;
          break;
        case '1m':
          days = 30;
          sampleInterval = 1;
          break;
        case '3m':
          days = 90;
          sampleInterval = 3; // Sample every 3 days
          break;
        case '6m':
          days = 180;
          sampleInterval = 6; // Sample every 6 days
          break;
        default:
          days = 7;
          sampleInterval = 1;
      }

      startDate.setDate(endDate.getDate() - (days - 1));

      // Format dates for SQL queries
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);

      console.log(`AdminService: Querying users from ${startDateStr} to ${endDateStr} (${days} days, sample interval: ${sampleInterval})`);

      // Query registered users from user_profiles
      const { data: registeredUsers, error: registeredError } = await supabase
        .from(TABLES.PROFILES)
        .select('created_at')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr + 'T23:59:59.999Z');

      if (registeredError) {
        console.error('AdminService: Error fetching registered users:', registeredError);
        return { data: null, error: registeredError };
      }

      // Query anonymous users from anonymous_players
      const { data: anonymousUsers, error: anonymousError } = await supabase
        .from('anonymous_players')
        .select('created_at')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr + 'T23:59:59.999Z');

      if (anonymousError) {
        console.error('AdminService: Error fetching anonymous users:', anonymousError);
        return { data: null, error: anonymousError };
      }

      // Process data by day with sampling
      const dailyData: Array<{ date: string; registeredUsers: number; anonymousUsers: number; total: number }> = [];

      for (let i = 0; i < days; i += sampleInterval) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = formatDate(currentDate);

        // For sampling intervals > 1, aggregate data for the interval
        let registeredCount = 0;
        let anonymousCount = 0;

        for (let j = 0; j < sampleInterval && (i + j) < days; j++) {
          const sampleDate = new Date(startDate);
          sampleDate.setDate(startDate.getDate() + i + j);
          const sampleDateStr = formatDate(sampleDate);

          // Count registered users for this day
          registeredCount += registeredUsers?.filter(user => {
            const userDate = new Date(user.created_at).toISOString().split('T')[0];
            return userDate === sampleDateStr;
          }).length || 0;

          // Count anonymous users for this day
          anonymousCount += anonymousUsers?.filter(user => {
            const userDate = new Date(user.created_at).toISOString().split('T')[0];
            return userDate === sampleDateStr;
          }).length || 0;
        }

        dailyData.push({
          date: dateStr,
          registeredUsers: registeredCount,
          anonymousUsers: anonymousCount,
          total: registeredCount + anonymousCount
        });
      }

      // Calculate total new users
      const totalNewUsers = (registeredUsers?.length || 0) + (anonymousUsers?.length || 0);

      console.log(`AdminService: New users stats calculated successfully for ${timeRange}`, {
        totalNewUsers,
        dailyDataLength: dailyData.length,
        sampleInterval
      });

      const result: NewUsersStats = {
        totalNewUsers,
        timeRange,
        dailyData
      };

      // Cache the result
      newUsersStatsCache[cacheKey] = {
        data: result,
        timestamp: now
      };

      return {
        data: result,
        error: null
      };
    } catch (err) {
      console.error(`AdminService: Error fetching new users stats for ${timeRange}:`, err);
      return { data: null, error: err };
    }
  }

  /**
   * Clear new users stats cache
   */
  static clearNewUsersStatsCache(timeRange?: NewUsersTimeRange): void {
    if (timeRange) {
      const cacheKey = `newUsers_${timeRange}`;
      delete newUsersStatsCache[cacheKey];
      console.log(`AdminService: New users stats cache cleared for ${timeRange}`);
    } else {
      newUsersStatsCache = {};
      console.log('AdminService: All new users stats cache cleared');
    }
  }

  /**
   * Get weekly test statistics for the last 6 weeks
   */
  static async getWeeklyTestStats(): Promise<{
    data: WeeklyTestStats | null;
    error: any
  }> {
    try {
      console.log('AdminService: Fetching weekly test stats for last 6 weeks');

      // Check cache first
      const now = Date.now();
      if (weeklyTestStatsCache && (now - weeklyTestStatsCache.timestamp) < CACHE_DURATION) {
        console.log('AdminService: Using cached weekly test stats');
        return { data: weeklyTestStatsCache.data, error: null };
      }

      // Calculate date range for last 6 weeks
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (6 * 7)); // 6 weeks ago

      // Format dates for SQL queries
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);

      console.log(`AdminService: Querying tests from ${startDateStr} to ${endDateStr}`);

      // Query all test results from user_test_results
      const { data: testResults, error: testError } = await supabase
        .from('user_test_results')
        .select('tested_at')
        .gte('tested_at', startDateStr)
        .lte('tested_at', endDateStr + 'T23:59:59.999Z')
        .order('tested_at', { ascending: true });

      if (testError) {
        console.error('AdminService: Error fetching test results:', testError);
        return { data: null, error: testError };
      }

      // Process data by week
      const weeklyData: Array<{ weekStart: string; weekEnd: string; weekLabel: string; testCount: number }> = [];

      // Generate 6 weeks of data
      for (let i = 5; i >= 0; i--) {
        const weekStart = new Date(endDate);
        weekStart.setDate(endDate.getDate() - (i * 7) - (endDate.getDay() || 7) + 1); // Start of week (Monday)

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End of week (Sunday)

        const weekStartStr = formatDate(weekStart);
        const weekEndStr = formatDate(weekEnd);

        // Count tests for this week
        const testCount = testResults?.filter(test => {
          const testDate = new Date(test.tested_at).toISOString().split('T')[0];
          return testDate >= weekStartStr && testDate <= weekEndStr;
        }).length || 0;

        // Create week label
        const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;

        weeklyData.push({
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          weekLabel,
          testCount
        });
      }

      // Calculate total tests
      const totalTests = weeklyData.reduce((sum, week) => sum + week.testCount, 0);

      console.log('AdminService: Weekly test stats calculated successfully', { totalTests, weeklyDataLength: weeklyData.length });

      const result = {
        totalTests,
        weeklyData
      };

      // Cache the result
      weeklyTestStatsCache = {
        data: result,
        timestamp: now
      };

      return {
        data: result,
        error: null
      };
    } catch (err) {
      console.error('AdminService: Error fetching weekly test stats:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Clear weekly test stats cache
   */
  static clearWeeklyTestStatsCache(): void {
    weeklyTestStatsCache = null;
    console.log('AdminService: Weekly test stats cache cleared');
  }

  /**
   * Get daily test statistics with time range support
   */
  static async getDailyTestStats(timeRange: TestTimeRange = '7d'): Promise<{
    data: DailyTestStats | null;
    error: any
  }> {
    try {
      console.log(`AdminService: Fetching daily test stats for ${timeRange}`);

      // Check cache first
      const now = Date.now();
      const cacheKey = timeRange;
      if (dailyTestStatsCache[cacheKey] && (now - dailyTestStatsCache[cacheKey].timestamp) < CACHE_DURATION) {
        console.log(`AdminService: Using cached daily test stats for ${timeRange}`);
        return { data: dailyTestStatsCache[cacheKey].data, error: null };
      }

      // Calculate date range and sampling based on time range
      let days: number;
      let sampleInterval: number;

      switch (timeRange) {
        case '7d':
          days = 7;
          sampleInterval = 1;
          break;
        case '1m':
          days = 30;
          sampleInterval = 1;
          break;
        case '3m':
          days = 90;
          sampleInterval = 3; // Sample every 3 days
          break;
        case '6m':
          days = 180;
          sampleInterval = 6; // Sample every 6 days
          break;
        default:
          days = 7;
          sampleInterval = 1;
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (days - 1));

      // Format dates for SQL queries
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);

      console.log(`AdminService: Querying daily tests from ${startDateStr} to ${endDateStr}`);

      // Query all test results from user_test_results
      const { data: testResults, error: testError } = await supabase
        .from('user_test_results')
        .select('tested_at')
        .gte('tested_at', startDateStr)
        .lte('tested_at', endDateStr + 'T23:59:59.999Z')
        .order('tested_at', { ascending: true });

      if (testError) {
        console.error('AdminService: Error fetching daily test results:', testError);
        return { data: null, error: testError };
      }

      console.log(`AdminService: Found ${testResults?.length || 0} test results for daily stats`);

      // Group by day and count tests
      const dailyData: Array<{
        date: string;
        dateLabel: string;
        testCount: number;
      }> = [];

      // Create array for sampled days
      for (let i = 0; i < days; i += sampleInterval) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = formatDate(currentDate);

        // For sampling intervals > 1, aggregate data for the interval
        let testsForPeriod = 0;
        for (let j = 0; j < sampleInterval && (i + j) < days; j++) {
          const periodDate = new Date(startDate);
          periodDate.setDate(startDate.getDate() + i + j);
          const periodDateStr = formatDate(periodDate);

          const testsForDay = testResults?.filter(result => {
            const resultDate = new Date(result.tested_at).toISOString().split('T')[0];
            return resultDate === periodDateStr;
          }) || [];

          testsForPeriod += testsForDay.length;
        }

        // Create appropriate date label based on time range
        let dateLabel: string;
        if (timeRange === '7d' || timeRange === '1m') {
          // Show day name for short periods
          const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
          const dayName = dayNames[currentDate.getDay()];
          dateLabel = `${dayName} ${currentDate.getDate()}/${currentDate.getMonth() + 1}`;
        } else {
          // Show date range for longer periods with sampling
          if (sampleInterval > 1) {
            const endPeriodDate = new Date(currentDate);
            endPeriodDate.setDate(currentDate.getDate() + sampleInterval - 1);
            dateLabel = `${currentDate.getDate()}/${currentDate.getMonth() + 1}-${endPeriodDate.getDate()}/${endPeriodDate.getMonth() + 1}`;
          } else {
            dateLabel = `${currentDate.getDate()}/${currentDate.getMonth() + 1}`;
          }
        }

        dailyData.push({
          date: dateStr,
          dateLabel,
          testCount: testsForPeriod
        });
      }

      // Calculate total tests and average
      const totalTests = dailyData.reduce((sum, day) => sum + day.testCount, 0);
      const averagePerDay = Math.round(totalTests / days);

      console.log('AdminService: Daily test stats calculated successfully', {
        totalTests,
        averagePerDay,
        dailyDataLength: dailyData.length
      });

      const result = {
        totalTests,
        averagePerDay,
        dailyData
      };

      // Cache the result
      dailyTestStatsCache[cacheKey] = {
        data: result,
        timestamp: now
      };

      return {
        data: result,
        error: null
      };
    } catch (err) {
      console.error('AdminService: Error fetching daily test stats:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Clear daily test stats cache
   */
  static clearDailyTestStatsCache(timeRange?: TestTimeRange): void {
    if (timeRange) {
      delete dailyTestStatsCache[timeRange];
      console.log(`AdminService: Daily test stats cache cleared for ${timeRange}`);
    } else {
      dailyTestStatsCache = {};
      console.log('AdminService: All daily test stats cache cleared');
    }
  }

  /**
   * Get daily comparison statistics (today vs yesterday)
   */
  static async getDailyComparisonStats(): Promise<{
    data: DailyComparisonStats | null;
    error: any
  }> {
    try {
      console.log('AdminService: Fetching daily comparison stats');

      // Check cache first
      const now = Date.now();
      if (dailyComparisonStatsCache && (now - dailyComparisonStatsCache.timestamp) < CACHE_DURATION) {
        console.log('AdminService: Using cached daily comparison stats');
        return { data: dailyComparisonStatsCache.data, error: null };
      }

      // Calculate dates
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      console.log(`AdminService: Comparing ${todayStr} vs ${yesterdayStr}`);

      // Helper function to calculate change
      const calculateChange = (today: number, yesterday: number) => {
        const change = today - yesterday;
        let changePercent = 0;

        if (yesterday > 0) {
          // Normal percentage calculation
          changePercent = Math.round((change / yesterday) * 100);
        } else if (yesterday === 0 && today > 0) {
          // When yesterday was 0 but today has data, show 100% increase
          changePercent = 100;
        } else if (yesterday === 0 && today === 0) {
          // Both days are 0, no change
          changePercent = 0;
        }

        return { change, changePercent };
      };

      // 1. Tests Today vs Yesterday
      const { data: testsToday, error: testsError } = await supabase
        .from('user_test_results')
        .select('tested_at')
        .gte('tested_at', todayStr + 'T00:00:00.000Z')
        .lt('tested_at', todayStr + 'T23:59:59.999Z');

      if (testsError) {
        console.error('AdminService: Error fetching tests today:', testsError);
        return { data: null, error: testsError };
      }

      const { data: testsYesterday, error: testsYesterdayError } = await supabase
        .from('user_test_results')
        .select('tested_at')
        .gte('tested_at', yesterdayStr + 'T00:00:00.000Z')
        .lt('tested_at', yesterdayStr + 'T23:59:59.999Z');

      if (testsYesterdayError) {
        console.error('AdminService: Error fetching tests yesterday:', testsYesterdayError);
        return { data: null, error: testsYesterdayError };
      }

      const { data: totalTests, error: totalTestsError } = await supabase
        .from('user_test_results')
        .select('id', { count: 'exact' });

      if (totalTestsError) {
        console.error('AdminService: Error fetching total tests:', totalTestsError);
        return { data: null, error: totalTestsError };
      }

      const testsStats = {
        today: testsToday?.length || 0,
        yesterday: testsYesterday?.length || 0,
        total: totalTests?.length || 0,
        ...calculateChange(testsToday?.length || 0, testsYesterday?.length || 0)
      };

      // 2. Registered Users Today vs Yesterday
      const { data: registeredToday, error: regTodayError } = await supabase
        .from(TABLES.PROFILES)
        .select('created_at')
        .gte('created_at', todayStr + 'T00:00:00.000Z')
        .lt('created_at', todayStr + 'T23:59:59.999Z');

      if (regTodayError) {
        console.error('AdminService: Error fetching registered users today:', regTodayError);
        return { data: null, error: regTodayError };
      }

      const { data: registeredYesterday, error: regYesterdayError } = await supabase
        .from(TABLES.PROFILES)
        .select('created_at')
        .gte('created_at', yesterdayStr + 'T00:00:00.000Z')
        .lt('created_at', yesterdayStr + 'T23:59:59.999Z');

      if (regYesterdayError) {
        console.error('AdminService: Error fetching registered users yesterday:', regYesterdayError);
        return { data: null, error: regYesterdayError };
      }

      const { data: totalRegistered, error: totalRegError } = await supabase
        .from(TABLES.PROFILES)
        .select('id', { count: 'exact' });

      if (totalRegError) {
        console.error('AdminService: Error fetching total registered users:', totalRegError);
        return { data: null, error: totalRegError };
      }

      const registeredStats = {
        today: registeredToday?.length || 0,
        yesterday: registeredYesterday?.length || 0,
        total: totalRegistered?.length || 0,
        ...calculateChange(registeredToday?.length || 0, registeredYesterday?.length || 0)
      };

      // 3. Anonymous Users Today vs Yesterday
      const { data: anonymousToday, error: anonTodayError } = await supabase
        .from('anonymous_players')
        .select('created_at')
        .gte('created_at', todayStr + 'T00:00:00.000Z')
        .lt('created_at', todayStr + 'T23:59:59.999Z');

      if (anonTodayError) {
        console.error('AdminService: Error fetching anonymous users today:', anonTodayError);
        return { data: null, error: anonTodayError };
      }

      const { data: anonymousYesterday, error: anonYesterdayError } = await supabase
        .from('anonymous_players')
        .select('created_at')
        .gte('created_at', yesterdayStr + 'T00:00:00.000Z')
        .lt('created_at', yesterdayStr + 'T23:59:59.999Z');

      if (anonYesterdayError) {
        console.error('AdminService: Error fetching anonymous users yesterday:', anonYesterdayError);
        return { data: null, error: anonYesterdayError };
      }

      const { data: totalAnonymous, error: totalAnonError } = await supabase
        .from('anonymous_players')
        .select('id', { count: 'exact' });

      if (totalAnonError) {
        console.error('AdminService: Error fetching total anonymous users:', totalAnonError);
        return { data: null, error: totalAnonError };
      }

      const anonymousStats = {
        today: anonymousToday?.length || 0,
        yesterday: anonymousYesterday?.length || 0,
        total: totalAnonymous?.length || 0,
        ...calculateChange(anonymousToday?.length || 0, anonymousYesterday?.length || 0)
      };

      // 4. Average Score Today vs Yesterday
      const { data: scoresData, error: scoresError } = await supabase
        .from('user_test_results')
        .select('tested_at, score')
        .gte('tested_at', yesterdayStr + 'T00:00:00.000Z')
        .lt('tested_at', todayStr + 'T23:59:59.999Z');

      if (scoresError) {
        console.error('AdminService: Error fetching scores:', scoresError);
        return { data: null, error: scoresError };
      }

      const todayStart = todayStr + 'T00:00:00.000Z';
      const todayEnd = todayStr + 'T23:59:59.999Z';
      const yesterdayStart = yesterdayStr + 'T00:00:00.000Z';
      const yesterdayEnd = yesterdayStr + 'T23:59:59.999Z';

      const todayScores = scoresData?.filter(s => s.tested_at >= todayStart && s.tested_at <= todayEnd) || [];
      const yesterdayScores = scoresData?.filter(s => s.tested_at >= yesterdayStart && s.tested_at <= yesterdayEnd) || [];

      const avgScoreToday = todayScores.length > 0
        ? Math.round(todayScores.reduce((sum, s) => sum + s.score, 0) / todayScores.length)
        : 0;

      const avgScoreYesterday = yesterdayScores.length > 0
        ? Math.round(yesterdayScores.reduce((sum, s) => sum + s.score, 0) / yesterdayScores.length)
        : 0;

      const scoreStats = {
        today: avgScoreToday,
        yesterday: avgScoreYesterday,
        ...calculateChange(avgScoreToday, avgScoreYesterday)
      };

      const result: DailyComparisonStats = {
        testsToday: testsStats,
        registeredUsersToday: registeredStats,
        anonymousUsersToday: anonymousStats,
        averageScoreToday: scoreStats
      };

      console.log('AdminService: Daily comparison stats calculated successfully', result);

      // Cache the result
      dailyComparisonStatsCache = {
        data: result,
        timestamp: now
      };

      return {
        data: result,
        error: null
      };
    } catch (err) {
      console.error('AdminService: Error fetching daily comparison stats:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Clear daily comparison stats cache
   */
  static clearDailyComparisonStatsCache(): void {
    dailyComparisonStatsCache = null;
    console.log('AdminService: Daily comparison stats cache cleared');
  }

  /**
   * Get weekly new users statistics for the last 6 weeks
   */
  static async getWeeklyNewUsersStats(): Promise<{
    data: WeeklyNewUsersStats | null;
    error: any
  }> {
    try {
      console.log('AdminService: Fetching weekly new users stats for last 6 weeks');

      // Check cache first
      const now = Date.now();
      if (weeklyNewUsersStatsCache && (now - weeklyNewUsersStatsCache.timestamp) < CACHE_DURATION) {
        console.log('AdminService: Using cached weekly new users stats');
        return { data: weeklyNewUsersStatsCache.data, error: null };
      }

      // Calculate date range for last 6 weeks
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (6 * 7 - 1)); // 6 weeks total (42 days)

      // Format dates for SQL queries
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);

      console.log(`AdminService: Querying weekly users from ${startDateStr} to ${endDateStr}`);

      // Query registered users from user_profiles
      const { data: registeredUsers, error: regError } = await supabase
        .from('user_profiles')
        .select('created_at')
        .gte('created_at', startDateStr + 'T00:00:00.000Z')
        .lte('created_at', endDateStr + 'T23:59:59.999Z')
        .order('created_at', { ascending: true });

      if (regError) {
        console.error('AdminService: Error fetching registered users:', regError);
        return { data: null, error: regError };
      }

      // Query anonymous users from anonymous_players
      const { data: anonymousUsers, error: anonError } = await supabase
        .from('anonymous_players')
        .select('created_at')
        .gte('created_at', startDateStr + 'T00:00:00.000Z')
        .lte('created_at', endDateStr + 'T23:59:59.999Z')
        .order('created_at', { ascending: true });

      if (anonError) {
        console.error('AdminService: Error fetching anonymous users:', anonError);
        return { data: null, error: anonError };
      }

      console.log(`AdminService: Found ${registeredUsers?.length || 0} registered users and ${anonymousUsers?.length || 0} anonymous users`);

      // Create weekly data structure
      const weeklyData = [];

      for (let i = 0; i < 6; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (i * 7));

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        // Ensure we don't go beyond endDate
        if (weekEnd > endDate) {
          weekEnd.setTime(endDate.getTime());
        }

        const weekStartStr = formatDate(weekStart);
        const weekEndStr = formatDate(weekEnd);

        // Count registered users for this week
        const registeredCount = registeredUsers?.filter(user => {
          const userDate = user.created_at.split('T')[0];
          return userDate >= weekStartStr && userDate <= weekEndStr;
        }).length || 0;

        // Count anonymous users for this week
        const anonymousCount = anonymousUsers?.filter(user => {
          const userDate = user.created_at.split('T')[0];
          return userDate >= weekStartStr && userDate <= weekEndStr;
        }).length || 0;

        // Create week label (e.g., "T6 15/1 - T5 21/1")
        const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;

        weeklyData.push({
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          weekLabel,
          registeredUsers: registeredCount,
          anonymousUsers: anonymousCount,
          total: registeredCount + anonymousCount
        });
      }

      // Calculate totals
      const totalNewUsers = weeklyData.reduce((sum, week) => sum + week.total, 0);
      const averagePerWeek = Math.round(totalNewUsers / 6);

      console.log('AdminService: Weekly new users stats calculated successfully', {
        totalNewUsers,
        averagePerWeek,
        weeklyDataLength: weeklyData.length
      });

      const result = {
        totalNewUsers,
        averagePerWeek,
        weeklyData
      };

      // Cache the result
      weeklyNewUsersStatsCache = {
        data: result,
        timestamp: now
      };

      return {
        data: result,
        error: null
      };
    } catch (err) {
      console.error('AdminService: Error fetching weekly new users stats:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Clear weekly new users stats cache
   */
  static clearWeeklyNewUsersStatsCache(): void {
    weeklyNewUsersStatsCache = null;
    console.log('AdminService: Weekly new users stats cache cleared');
  }

  /**
   * Clear all admin caches
   */
  static clearAllCaches(): void {
    newUsersStatsCache = null;
    weeklyTestStatsCache = null;
    dailyComparisonStatsCache = null;
    weeklyNewUsersStatsCache = null;
    console.log('AdminService: All admin caches cleared');
  }

  /**
   * Get admin quick actions
   */
  static getQuickActions(): AdminAction[] {
    return [
      {
        id: 'create-article',
        title: 'Đăng bài viết',
        description: 'Viết bài mới với editor SEO',
        icon: '📝',
        href: '/admin/articles/create',
        category: 'content'
      },
      {
        id: 'manage-articles',
        title: 'Quản lý bài viết',
        description: 'Xem, sửa, xóa các bài viết',
        icon: '📰',
        href: '/admin/articles',
        category: 'content'
      },
      {
        id: 'manage-categories',
        title: 'Quản lý danh mục',
        description: 'Tạo, sửa, xóa danh mục bài viết',
        icon: '📁',
        href: '/admin/categories',
        category: 'content'
      },
      {
        id: 'manage-questions',
        title: 'Quản lý câu hỏi',
        description: 'Thêm, sửa, xóa câu hỏi test',
        icon: '❓',
        href: '/admin/questions',
        category: 'management'
      },
      {
        id: 'view-results',
        title: 'Xem kết quả',
        description: 'Thống kê và phân tích kết quả',
        icon: '📋',
        href: '/admin/results',
        category: 'analytics'
      },
      {
        id: 'manage-users',
        title: 'Quản lý người dùng',
        description: 'Quản lý tài khoản người dùng',
        icon: '👤',
        href: '/admin/users',
        category: 'management'
      },
      {
        id: 'system-settings',
        title: 'Cài đặt hệ thống',
        description: 'Cấu hình các thông số',
        icon: '⚙️',
        href: '/admin/settings',
        category: 'system'
      },
      {
        id: 'reports',
        title: 'Báo cáo',
        description: 'Xuất báo cáo chi tiết',
        icon: '📊',
        href: '/admin/reports',
        category: 'analytics'
      },
      {
        id: 'manage-media',
        title: 'Quản lý Media',
        description: 'Upload, quản lý hình ảnh và file media',
        icon: '🖼️',
        href: '/admin/media',
        category: 'content'
      }
    ];
  }

  /**
   * Verify admin access and get dashboard data
   */
  static async getDashboardData(): Promise<{
    isAuthorized: boolean;
    user: any;
    profile: any;
    stats: AdminStats | null;
    actions: AdminAction[];
    error?: any;
  }> {
    try {
      console.log('AdminService: Getting dashboard data');
      
      // Verify admin access
      const { isAdmin, user, profile, error: authError } = await AuthService.verifyAdminAccess();
      
      if (authError || !isAdmin) {
        console.log('AdminService: Access denied or auth error');
        return {
          isAuthorized: false,
          user: null,
          profile: null,
          stats: null,
          actions: [],
          error: authError || 'Access denied'
        };
      }

      // Get stats and actions
      const { stats, error: statsError } = await this.getStats();
      const actions = this.getQuickActions();

      console.log('AdminService: Dashboard data retrieved successfully');
      return {
        isAuthorized: true,
        user,
        profile,
        stats,
        actions,
        error: statsError
      };
    } catch (err) {
      console.error('AdminService: Error getting dashboard data:', err);
      return {
        isAuthorized: false,
        user: null,
        profile: null,
        stats: null,
        actions: [],
        error: err
      };
    }
  }

  /**
   * Create initial admin user (for setup)
   */
  static async createAdminUser(userId: string, email: string, fullName?: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('AdminService: Creating admin user profile');
      
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .insert({
          id: userId,
          full_name: fullName || email.split('@')[0] + ' (Admin)',
          role: 'admin',
          is_verified: true, // Admins are auto-verified
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('AdminService: Error creating admin profile:', error);
        return { success: false, error };
      }

      console.log('AdminService: Admin profile created successfully');
      return { success: true, error: null };
    } catch (err) {
      console.error('AdminService: Unexpected error creating admin:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Promote existing user to admin role
   */
  static async promoteUserToAdmin(userId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('AdminService: Promoting user to admin:', userId);
      
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update({
          role: 'admin',
          is_verified: true, // Auto-verify when promoting to admin
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('AdminService: Error promoting user to admin:', error);
        return { success: false, error };
      }

      if (!data) {
        console.error('AdminService: User profile not found');
        return { success: false, error: { message: 'User profile not found' } };
      }

      console.log('AdminService: User promoted to admin successfully');
      return { success: true, error: null };
    } catch (err) {
      console.error('AdminService: Unexpected error promoting user:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Demote admin to regular user
   */
  static async demoteAdminToUser(userId: string): Promise<{ success: boolean; error: any }> {
    try {
      console.log('AdminService: Demoting admin to user:', userId);
      
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update({
          role: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('AdminService: Error demoting admin to user:', error);
        return { success: false, error };
      }

      if (!data) {
        console.error('AdminService: Admin profile not found');
        return { success: false, error: { message: 'Admin profile not found' } };
      }

      console.log('AdminService: Admin demoted to user successfully');
      return { success: true, error: null };
    } catch (err) {
      console.error('AdminService: Unexpected error demoting admin:', err);
      return { success: false, error: err };
    }
  }
} 
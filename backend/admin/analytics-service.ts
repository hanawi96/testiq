import { supabase } from '../config/supabase';

export interface AnalyticsStats {
  completionRate: number;
  abandonmentRate: number;
  inProgressRate: number;
  totalSessions: number;
  completedCount: number;
  abandonedCount: number;
  inProgressCount: number;
  avgCompletionTime: number;
  problemQuestions: Array<{ questionNumber: number; abandonCount: number }>;
  deviceStats: {
    mobile: { completionRate: number; count: number };
    desktop: { completionRate: number; count: number };
  };
  peakHour: number;
  mainAbandonReason: string;
  scoreVsSpeed: {
    fast: { avgScore: number; count: number };
    medium: { avgScore: number; count: number };
    slow: { avgScore: number; count: number };
  };
}

export class AnalyticsService {
  
  /**
   * Get comprehensive analytics stats
   */
  static async getStats(): Promise<{ data: AnalyticsStats | null; error: any }> {
    try {
      console.log('AnalyticsService: Fetching analytics stats');

      // Get all behavior logs
      const { data: logs, error } = await supabase
        .from('test_behavior_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('AnalyticsService: Error fetching logs:', error);
        return { data: null, error };
      }

      if (!logs || logs.length === 0) {
        return {
          data: {
            completionRate: 0,
            abandonmentRate: 0,
            inProgressRate: 0,
            totalSessions: 0,
            completedCount: 0,
            abandonedCount: 0,
            inProgressCount: 0,
            avgCompletionTime: 0,
            problemQuestions: [],
            deviceStats: {
              mobile: { completionRate: 0, count: 0 },
              desktop: { completionRate: 0, count: 0 }
            },
            peakHour: 9,
            mainAbandonReason: 'N/A',
            scoreVsSpeed: {
              fast: { avgScore: 0, count: 0 },
              medium: { avgScore: 0, count: 0 },
              slow: { avgScore: 0, count: 0 }
            }
          },
          error: null
        };
      }

      // Calculate session stats
      const sessionStats = this.calculateSessionStats(logs);
      
      // Calculate problem questions
      const problemQuestions = this.calculateProblemQuestions(logs);
      
      // Calculate device stats
      const deviceStats = this.calculateDeviceStats(logs);
      
      // Calculate peak hour
      const peakHour = this.calculatePeakHour(logs);
      
      // Calculate main abandon reason
      const mainAbandonReason = this.calculateMainAbandonReason(logs);
      
      // Calculate score vs speed
      const scoreVsSpeed = this.calculateScoreVsSpeed(logs);
      
      // Calculate avg completion time
      const avgCompletionTime = this.calculateAvgCompletionTime(logs);

      const stats: AnalyticsStats = {
        ...sessionStats,
        avgCompletionTime,
        problemQuestions,
        deviceStats,
        peakHour,
        mainAbandonReason,
        scoreVsSpeed
      };

      console.log('AnalyticsService: Stats calculated successfully');
      return { data: stats, error: null };

    } catch (err) {
      console.error('AnalyticsService: Unexpected error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Calculate session completion/abandonment stats
   */
  private static calculateSessionStats(logs: any[]) {
    const sessionMap = new Map();
    
    // Group by session
    logs.forEach(log => {
      if (!sessionMap.has(log.session_id)) {
        sessionMap.set(log.session_id, []);
      }
      sessionMap.get(log.session_id).push(log);
    });

    let completedCount = 0;
    let abandonedCount = 0;
    let inProgressCount = 0;

    sessionMap.forEach(sessionLogs => {
      const hasComplete = sessionLogs.some((log: any) => log.event_type === 'complete');
      const hasAbandon = sessionLogs.some((log: any) => log.event_type === 'abandon');
      const hasStart = sessionLogs.some((log: any) => log.event_type === 'start');

      if (hasComplete) {
        completedCount++;
      } else if (hasAbandon) {
        abandonedCount++;
      } else if (hasStart) {
        inProgressCount++;
      }
    });

    const totalSessions = completedCount + abandonedCount + inProgressCount;
    
    return {
      totalSessions,
      completedCount,
      abandonedCount,
      inProgressCount,
      completionRate: totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0,
      abandonmentRate: totalSessions > 0 ? Math.round((abandonedCount / totalSessions) * 100) : 0,
      inProgressRate: totalSessions > 0 ? Math.round((inProgressCount / totalSessions) * 100) : 0
    };
  }

  /**
   * Calculate problem questions (most abandoned)
   */
  private static calculateProblemQuestions(logs: any[]) {
    const abandonMap = new Map();
    
    logs
      .filter(log => log.event_type === 'abandon' && log.question_number)
      .forEach(log => {
        const qNum = log.question_number;
        abandonMap.set(qNum, (abandonMap.get(qNum) || 0) + 1);
      });

    return Array.from(abandonMap.entries())
      .map(([questionNumber, abandonCount]) => ({ questionNumber, abandonCount }))
      .sort((a, b) => b.abandonCount - a.abandonCount)
      .slice(0, 5);
  }

  /**
   * Calculate device performance stats
   */
  private static calculateDeviceStats(logs: any[]) {
    const deviceSessions = new Map();
    
    // Group sessions by device type
    logs.forEach(log => {
      if (log.event_type === 'start' && log.event_data?.isMobile !== undefined) {
        const deviceType = log.event_data.isMobile ? 'mobile' : 'desktop';
        if (!deviceSessions.has(deviceType)) {
          deviceSessions.set(deviceType, new Set());
        }
        deviceSessions.get(deviceType).add(log.session_id);
      }
    });

    const mobileCompletions = this.getCompletionsByDevice(logs, true);
    const desktopCompletions = this.getCompletionsByDevice(logs, false);

    const mobileTotal = deviceSessions.get('mobile')?.size || 0;
    const desktopTotal = deviceSessions.get('desktop')?.size || 0;

    return {
      mobile: {
        completionRate: mobileTotal > 0 ? Math.round((mobileCompletions / mobileTotal) * 100) : 0,
        count: mobileTotal
      },
      desktop: {
        completionRate: desktopTotal > 0 ? Math.round((desktopCompletions / desktopTotal) * 100) : 0,
        count: desktopTotal
      }
    };
  }

  private static getCompletionsByDevice(logs: any[], isMobile: boolean) {
    const deviceSessions = new Set();
    const completedSessions = new Set();

    // Get sessions by device
    logs.forEach(log => {
      if (log.event_type === 'start' && log.event_data?.isMobile === isMobile) {
        deviceSessions.add(log.session_id);
      }
      if (log.event_type === 'complete') {
        completedSessions.add(log.session_id);
      }
    });

    // Count intersections
    let count = 0;
    deviceSessions.forEach(sessionId => {
      if (completedSessions.has(sessionId)) {
        count++;
      }
    });

    return count;
  }

  /**
   * Calculate peak hour
   */
  private static calculatePeakHour(logs: any[]) {
    const hourMap = new Map();
    
    logs
      .filter(log => log.event_type === 'start')
      .forEach(log => {
        const hour = new Date(log.timestamp).getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      });

    let maxCount = 0;
    let peakHour = 9;
    
    hourMap.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    });

    return peakHour;
  }

  /**
   * Calculate main abandon reason
   */
  private static calculateMainAbandonReason(logs: any[]) {
    const reasonMap = new Map();
    
    logs
      .filter(log => log.event_type === 'abandon' && log.event_data?.reason)
      .forEach(log => {
        const reason = log.event_data.reason;
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
      });

    if (reasonMap.size === 0) return 'N/A';

    let maxCount = 0;
    let mainReason = 'N/A';
    
    reasonMap.forEach((count, reason) => {
      if (count > maxCount) {
        maxCount = count;
        mainReason = reason;
      }
    });

    return mainReason;
  }

  /**
   * Calculate score vs speed correlation
   */
  private static calculateScoreVsSpeed(logs: any[]) {
    const completedSessions = logs
      .filter(log => log.event_type === 'complete' && log.event_data?.totalTime && log.event_data?.score)
      .map(log => ({
        totalTime: log.event_data.totalTime,
        score: log.event_data.score
      }));

    const fast = completedSessions.filter(s => s.totalTime < 900); // < 15 min
    const medium = completedSessions.filter(s => s.totalTime >= 900 && s.totalTime < 1500); // 15-25 min
    const slow = completedSessions.filter(s => s.totalTime >= 1500); // > 25 min

    return {
      fast: {
        avgScore: fast.length > 0 ? Math.round(fast.reduce((sum, s) => sum + s.score, 0) / fast.length) : 0,
        count: fast.length
      },
      medium: {
        avgScore: medium.length > 0 ? Math.round(medium.reduce((sum, s) => sum + s.score, 0) / medium.length) : 0,
        count: medium.length
      },
      slow: {
        avgScore: slow.length > 0 ? Math.round(slow.reduce((sum, s) => sum + s.score, 0) / slow.length) : 0,
        count: slow.length
      }
    };
  }

  /**
   * Calculate average completion time
   */
  private static calculateAvgCompletionTime(logs: any[]) {
    const completionTimes = logs
      .filter(log => log.event_type === 'complete' && log.event_data?.totalTime)
      .map(log => log.event_data.totalTime);

    if (completionTimes.length === 0) return 0;

    const avgSeconds = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    return Math.round(avgSeconds / 60); // Convert to minutes
  }
}

// Backend Types
export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  location?: string;
  avatar_url?: string;
  bio?: string;
  role: 'user' | 'admin';
  is_verified?: boolean;
  last_login?: string;
  settings?: any;
  created_at: string;
  updated_at?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  email_confirmed_at?: string;
  created_at: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  error: any;
}

export interface ProfileResponse {
  profile: UserProfile | null;
  error: any;
}

// Admin specific types
export interface AdminStats {
  totalTests: number;
  totalUsers: number;
  testsToday: number;
  averageScore: number;
}

// New users statistics for dashboard
export interface NewUsersStats {
  totalNewUsers: number;
  timeRange: string;
  dailyData: Array<{
    date: string;
    registeredUsers: number;
    anonymousUsers: number;
    total: number;
  }>;
}

// Time range options for new users stats
export type NewUsersTimeRange = '7d' | '1m' | '3m' | '6m';

// Weekly test statistics for dashboard
export interface WeeklyTestStats {
  totalTests: number;
  weeklyData: Array<{
    weekStart: string;
    weekEnd: string;
    weekLabel: string;
    testCount: number;
  }>;
}

// Daily test statistics for dashboard (7 days)
export interface DailyTestStats {
  totalTests: number;
  averagePerDay: number;
  dailyData: Array<{
    date: string;
    dateLabel: string;
    testCount: number;
  }>;
}

// Weekly new users statistics for dashboard (6 weeks)
export interface WeeklyNewUsersStats {
  totalNewUsers: number;
  averagePerWeek: number;
  weeklyData: Array<{
    weekStart: string;
    weekEnd: string;
    weekLabel: string;
    registeredUsers: number;
    anonymousUsers: number;
    total: number;
  }>;
}

// Daily comparison statistics for dashboard
export interface DailyComparisonStats {
  testsToday: {
    today: number;
    yesterday: number;
    total: number;
    change: number;
    changePercent: number;
  };
  registeredUsersToday: {
    today: number;
    yesterday: number;
    total: number;
    change: number;
    changePercent: number;
  };
  anonymousUsersToday: {
    today: number;
    yesterday: number;
    total: number;
    change: number;
    changePercent: number;
  };
  averageScoreToday: {
    today: number;
    yesterday: number;
    change: number;
    changePercent: number;
  };
}

export interface AdminAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  category: 'management' | 'analytics' | 'system' | 'content';
} 
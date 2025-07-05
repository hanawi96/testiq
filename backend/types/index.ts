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
  dailyData: Array<{
    date: string;
    registeredUsers: number;
    anonymousUsers: number;
    total: number;
  }>;
}

export interface AdminAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  category: 'management' | 'analytics' | 'system' | 'content';
} 
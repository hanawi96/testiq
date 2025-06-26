// Backend Types
export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
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

export interface AdminAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  category: 'management' | 'analytics' | 'system';
} 
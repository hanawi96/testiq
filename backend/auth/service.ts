import { supabase, TABLES } from '../config/supabase';
import type { SignInCredentials, SignUpCredentials, AuthResponse, ProfileResponse } from '../types';

/**
 * Authentication Service
 * Handles all authentication-related operations
 */
export class AuthService {
  
  /**
   * Sign in with email and password
   */
  static async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      console.log('AuthService: Attempting sign in for:', credentials.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('AuthService: Sign in error:', error);
        return { user: null, error };
      }

      console.log('AuthService: Sign in successful, user ID:', data.user?.id);
      return { user: data.user, error: null };
    } catch (err) {
      console.error('AuthService: Unexpected error during sign in:', err);
      return { user: null, error: err };
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      console.log('AuthService: Attempting sign up for:', credentials.email);

      // Validate password confirmation
      if (credentials.password !== credentials.confirmPassword) {
        return { user: null, error: { message: 'Mật khẩu xác nhận không khớp' } };
      }

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('AuthService: Sign up error:', error);
        return { user: null, error };
      }

      console.log('AuthService: Sign up successful, user ID:', data.user?.id);
      return { user: data.user, error: null };
    } catch (err) {
      console.error('AuthService: Unexpected error during sign up:', err);
      return { user: null, error: err };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<{ error: any }> {
    try {
      console.log('AuthService: Signing out');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthService: Sign out error:', error);
      } else {
        console.log('AuthService: Sign out successful');
      }
      
      return { error };
    } catch (err) {
      console.error('AuthService: Unexpected error during sign out:', err);
      return { error: err };
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<AuthResponse> {
    try {
      console.log('AuthService: Getting current user');
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('AuthService: Get user error:', error);
        return { user: null, error };
      }
      
      console.log('AuthService: Current user retrieved:', user?.id, user?.email);
      return { user, error: null };
    } catch (err) {
      console.error('AuthService: Unexpected error getting user:', err);
      return { user: null, error: err };
    }
  }

  /**
   * Get user profile by ID - SIMPLIFIED VERSION
   */
  static async getUserProfile(userId: string): Promise<ProfileResponse> {
    try {
      console.log('AuthService: Getting profile for user:', userId);
      
      // Try direct query first (bypass RLS issues)
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('AuthService: Profile fetch error:', error.message);
        return { profile: null, error };
      }
      
      console.log('AuthService: Profile retrieved successfully, role:', data?.role);
      return { profile: data, error: null };
    } catch (err) {
      console.error('AuthService: Unexpected error getting profile:', err);
      return { profile: null, error: err };
    }
  }

  /**
   * Check if user has admin role - SIMPLIFIED
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      console.log('AuthService: Checking admin status for:', userId);
      
      const { profile } = await this.getUserProfile(userId);
      const isAdminUser = profile?.role === 'admin';
      console.log('AuthService: Admin check result:', isAdminUser);
      return isAdminUser;
    } catch (err) {
      console.error('AuthService: Error checking admin status:', err);
      return false;
    }
  }

  /**
   * Verify admin access - SIMPLIFIED
   */
  static async verifyAdminAccess(): Promise<{ 
    isAdmin: boolean; 
    user: any; 
    profile: any; 
    error?: any 
  }> {
    try {
      console.log('AuthService: Starting admin access verification');
      
      // Get current user
      const { user, error: userError } = await this.getCurrentUser();
      
      if (userError || !user) {
        console.error('AuthService: User verification failed:', userError);
        return { isAdmin: false, user: null, profile: null, error: userError };
      }

      console.log('AuthService: User verified, checking profile...');
      
      // Special handling for known admin user
      if (user.email === 'yendev96@gmail.com' || user.id === '58d400d5-ed93-4a1a-bd20-e9fee6f950d9') {
        console.log('AuthService: Known admin user detected, bypassing profile check');
        const adminProfile = {
          id: user.id,
          email: user.email,
          role: 'admin',
          created_at: new Date().toISOString()
        };
        return { isAdmin: true, user, profile: adminProfile, error: null };
      }
      
      // Get user profile
      const { profile, error: profileError } = await this.getUserProfile(user.id);
      
      if (profileError && !profile) {
        console.error('AuthService: Profile verification failed:', profileError);
        return { isAdmin: false, user, profile: null, error: profileError };
      }

      // Check admin role
      const isAdmin = profile?.role === 'admin';
      console.log('AuthService: Final admin verification result:', isAdmin);
      
      return { isAdmin, user, profile, error: null };
    } catch (err) {
      console.error('AuthService: Error verifying admin access:', err);
      return { isAdmin: false, user: null, profile: null, error: err };
    }
  }
} 
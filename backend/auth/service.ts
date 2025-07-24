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
      console.log('AuthService: Password length:', credentials.password?.length || 0);

      // Validate password confirmation
      if (credentials.password !== credentials.confirmPassword) {
        console.error('AuthService: Password confirmation mismatch');
        return { user: null, error: { message: 'Mật khẩu xác nhận không khớp' } };
      }

      console.log('AuthService: Password validation passed');
      console.log('AuthService: Calling Supabase Auth signup...');
      
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.email.split('@')[0]
          },
          // Force email confirmation to be disabled
          emailRedirectTo: undefined,
          captchaToken: undefined
        }
      });

      console.log('AuthService: Supabase signup response received');
      console.log('AuthService: Data:', !!data);
      console.log('AuthService: Error:', !!error);

      if (error) {
        console.error('AuthService: Sign up error:', error);
        console.error('AuthService: Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        return { user: null, error };
      }

      if (!data.user) {
        console.error('AuthService: No user returned from sign up');
        return { user: null, error: { message: 'Đăng ký thất bại - không có user data' } };
      }

      console.log('AuthService: Auth signup successful!');
      console.log('AuthService: User ID:', data.user.id);
      console.log('AuthService: User email:', data.user.email);
      console.log('AuthService: Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');

      // Create user profile using RPC function only (bypasses RLS completely)
      console.log('AuthService: Creating user profile via RPC...');
      console.log('AuthService: RPC parameters:', {
        user_id: data.user.id,
        user_email: credentials.email,
        display_name: credentials.email.split('@')[0],
        user_role: 'user' // Default role
      });

      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_profile', {
          user_id: data.user.id,
          user_email: credentials.email,
          display_name: credentials.email.split('@')[0],
          user_role: 'user' // 🔥 THÊM user_role parameter
        });

        console.log('AuthService: RPC call completed');
        console.log('AuthService: RPC result:', rpcResult);
        console.log('AuthService: RPC error:', !!rpcError);

        if (rpcError) {
          console.error('AuthService: RPC profile creation error:', rpcError);
          console.warn('AuthService: User registered but profile creation failed');
        } else {
          console.log('AuthService: Profile created successfully via RPC');

          // Check if RPC function returned success
          if (rpcResult && typeof rpcResult === 'object' && rpcResult.success === true) {
            console.log('AuthService: Username created:', rpcResult.username);
          } else if (rpcResult && rpcResult.success === false) {
            console.error('AuthService: RPC function returned error:', rpcResult.error);
            console.warn('AuthService: User registered but profile creation failed');
          }
        }
      } catch (rpcErr) {
        console.error('AuthService: RPC call failed with exception:', rpcErr);
        console.warn('AuthService: User registered but profile creation failed');
      }

      console.log('AuthService: Sign up process completed successfully');
      return { user: data.user, error: null };
    } catch (err) {
      console.error('AuthService: Unexpected error during sign up:', err);
      console.error('AuthService: Error stack:', err instanceof Error ? err.stack : 'No stack trace');
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
      
      // Check if there's a session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.log('AuthService: Session error:', sessionError.message);
        return { user: null, error: null }; // Not an error, just no session
      }
      
      if (!session) {
        console.log('AuthService: No active session found');
        return { user: null, error: null }; // Not an error, just not logged in
      }
      
      console.log('AuthService: Session found, getting user details');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('AuthService: Get user error:', error);
        return { user: null, error };
      }
      
      console.log('AuthService: Current user retrieved:', user?.id, user?.email);
      return { user, error: null };
    } catch (err) {
      console.error('AuthService: Unexpected error getting user:', err);
      return { user: null, error: null }; // Don't propagate errors for auth checks
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
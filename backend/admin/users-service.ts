import { supabase, TABLES } from '../config/supabase';

export interface UserWithProfile {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string;
  role: 'user' | 'admin' | 'mod';
  is_verified: boolean;
  last_login: string | null;
  age?: number;
  location?: string;
}

export interface UsersListResponse {
  users: UserWithProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UsersFilters {
  role?: 'user' | 'admin' | 'mod' | 'all';
  search?: string;
  verified?: boolean;
}

/**
 * Users Management Service for Admin
 */
export class UsersService {

  /**
   * Get paginated users list with filters
   */
  static async getUsers(
    page: number = 1,
    limit: number = 5,
    filters: UsersFilters = {}
  ): Promise<{ data: UsersListResponse | null; error: any }> {
    try {
      console.log('UsersService: Fetching users', { page, limit, filters });

      const offset = (page - 1) * limit;

      // Prepare RPC parameters with detailed logging
      const rpcParams = {
        page_limit: limit,
        page_offset: offset,
        role_filter: filters.role === 'all' ? null : filters.role,
        search_term: filters.search || null,
        verified_filter: filters.verified
      };

      console.log('UsersService: RPC parameters:', rpcParams);
      console.log('UsersService: Calling get_users_with_email RPC function...');



      // Use RPC function to get users with email data
      const { data: usersData, error: rpcError } = await supabase.rpc('get_users_with_email', rpcParams);

      console.log('UsersService: RPC call completed');
      console.log('UsersService: RPC returned data:', !!usersData);
      console.log('UsersService: RPC returned error:', !!rpcError);

      if (rpcError) {
        console.error('UsersService: Error fetching users via RPC:', rpcError);
        console.error('UsersService: RPC Error details:', {
          code: rpcError.code,
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint
        });

        // Additional debug for type mismatch errors
        if (rpcError.code === '42804') {
          console.error('UsersService: TYPE MISMATCH ERROR DETECTED');
          console.error('UsersService: This indicates column type mismatch in RPC function');
          console.error('UsersService: Check if get_users_with_email_final_fix.sql was run correctly');
          
          // Try to get table schema info
          try {
            const { data: schemaInfo } = await supabase
              .from('information_schema.columns')
              .select('column_name, data_type')
              .eq('table_name', 'user_profiles')
              .eq('table_schema', 'public');
            
            console.log('UsersService: user_profiles table schema:', schemaInfo);
          } catch (schemaErr) {
            console.warn('UsersService: Could not fetch schema info:', schemaErr);
          }
        }

        return { data: null, error: rpcError };
      }

      if (!usersData || usersData.length === 0) {
        console.log('UsersService: No users found');
        return { 
          data: { 
            users: [], 
            total: 0, 
            page, 
            limit, 
            totalPages: 0, 
            hasNext: false, 
            hasPrev: false 
          }, 
          error: null 
        };
      }

      console.log('UsersService: Processing', usersData.length, 'user records');
      console.log('UsersService: Sample first record:', usersData[0]);
      console.log('UsersService: Sample record keys:', Object.keys(usersData[0] || {}));

      // Transform RPC result to UserWithProfile[]
      const users: UserWithProfile[] = usersData.map((row: any, index: number) => {
        try {
          return {
            id: row.id,
            email: row.email,
            email_confirmed_at: row.email_confirmed_at,
            created_at: row.created_at,
            last_sign_in_at: row.last_sign_in_at,
            full_name: row.full_name,
            role: row.role,
            is_verified: row.is_verified,
            last_login: row.last_login,
            age: row.age,
            location: row.location
          };
        } catch (transformErr) {
          console.error(`UsersService: Error transforming row ${index}:`, transformErr);
          console.error(`UsersService: Problematic row data:`, row);
          throw transformErr;
        }
      });

      // Get total count from first row (all rows have same total_count)
      const total = usersData[0]?.total_count || 0;
      const totalPages = Math.ceil(Number(total) / limit);

      const result: UsersListResponse = {
        users,
        total: Number(total),
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      console.log('UsersService: Users fetched successfully:', {
        count: users.length,
        total: Number(total),
        page,
        totalPages
      });

      return { data: result, error: null };

    } catch (err) {
      console.error('UsersService: Unexpected error:', err);
      console.error('UsersService: Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      
      // Additional context for debugging
      console.error('UsersService: Error occurred during users fetch with params:', {
        page,
        limit,
        filters
      });
      
      return { data: null, error: err };
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(
    userId: string, 
    newRole: 'user' | 'admin' | 'mod'
  ): Promise<{ success: boolean; error: any }> {
    try {
      console.log('UsersService: Updating user role:', { userId, newRole });

      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('UsersService: Error updating user role:', error);
        return { success: false, error };
      }

      console.log('UsersService: User role updated successfully');
      return { success: true, error: null };

    } catch (err) {
      console.error('UsersService: Unexpected error updating role:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Toggle user verification status
   */
  static async toggleUserVerification(
    userId: string
  ): Promise<{ success: boolean; error: any }> {
    try {
      console.log('UsersService: Toggling user verification:', userId);

      // Get current status first
      const { data: currentUser, error: fetchError } = await supabase
        .from(TABLES.PROFILES)
        .select('is_verified')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('UsersService: Error fetching current user:', fetchError);
        return { success: false, error: fetchError };
      }

      const newVerifiedStatus = !currentUser.is_verified;

      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update({ 
          is_verified: newVerifiedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('UsersService: Error updating verification:', error);
        return { success: false, error };
      }

      console.log('UsersService: User verification updated:', newVerifiedStatus);
      return { success: true, error: null };

    } catch (err) {
      console.error('UsersService: Unexpected error toggling verification:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{ 
    data: { 
      total: number; 
      admins: number; 
      mods: number; 
      users: number; 
      verified: number; 
      unverified: number;
    } | null; 
    error: any 
  }> {
    try {
      console.log('UsersService: Fetching user statistics');

      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('role, is_verified');

      if (error) {
        console.error('UsersService: Error fetching stats:', error);
        return { data: null, error };
      }

      const stats = {
        total: data.length,
        admins: data.filter(u => u.role === 'admin').length,
        mods: data.filter(u => u.role === 'mod').length,
        users: data.filter(u => u.role === 'user').length,
        verified: data.filter(u => u.is_verified).length,
        unverified: data.filter(u => !u.is_verified).length
      };

      console.log('UsersService: Stats fetched:', stats);
      return { data: stats, error: null };

    } catch (err) {
      console.error('UsersService: Error fetching stats:', err);
      return { data: null, error: err };
    }
  }
} 
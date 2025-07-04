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
  user_type?: 'registered' | 'anonymous';
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
  role?: 'user' | 'admin' | 'mod' | 'all' | 'anonymous';
  search?: string;
  verified?: boolean;
  user_type?: 'registered' | 'anonymous';
}

/**
 * Users Management Service for Admin
 */
export class UsersService {

  /**
   * Get paginated users list with filters (bao gồm cả anonymous players)
   */
  static async getUsers(
    page: number = 1,
    limit: number = 5,
    filters: UsersFilters = {}
  ): Promise<{ data: UsersListResponse | null; error: any }> {
    try {
      console.log('UsersService: Fetching users (registered + anonymous)', { page, limit, filters });

      const offset = (page - 1) * limit;

      // Fetch registered users từ RPC function hiện tại
      const rpcParams = {
        page_limit: Math.max(limit * 2, 10), // Lấy nhiều hơn để có đủ dữ liệu khi merge
        page_offset: 0, // Reset offset vì sẽ handle pagination sau khi merge
        role_filter: filters.role === 'all' ? null : filters.role,
        search_term: filters.search || null,
        verified_filter: filters.verified
      };

      console.log('UsersService: Fetching users from user_profiles and anonymous_players...');
      const [registeredResult, anonymousResult] = await Promise.all([
        // Query registered users directly from user_profiles
        supabase
          .from(TABLES.PROFILES)
          .select(`
            id,
            full_name,
            email,
            role,
            is_verified,
            last_login,
            age,
            location,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false }),
        // Query anonymous users from anonymous_players table
        supabase
          .from('anonymous_players')
          .select('id, name, age, country_name, email, created_at, test_score, gender')
          .order('created_at', { ascending: false })
      ]);

      const { data: registeredUsers, error: registeredError } = registeredResult;
      const { data: anonymousPlayers, error: anonymousError } = anonymousResult;

      if (registeredError) {
        console.error('UsersService: Error fetching registered users:', registeredError);
        return { data: null, error: registeredError };
      }

      if (anonymousError) {
        console.error('UsersService: Error fetching anonymous players:', anonymousError);
        return { data: null, error: anonymousError };
      }

      // Transform anonymous players thành UserWithProfile format
      const transformedAnonymous: UserWithProfile[] = (anonymousPlayers || []).map(player => ({
        id: player.id,
        email: player.email || `anonymous-${player.id.slice(0, 8)}@anonymous.local`,
        email_confirmed_at: null,
        created_at: player.created_at,
        last_sign_in_at: null,
        full_name: player.name,
        role: 'user' as const,
        is_verified: false,
        last_login: null,
        age: player.age,
        location: player.country_name,
        user_type: 'anonymous' as const
      }));

      // Transform registered users và thêm user_type
      const transformedRegistered: UserWithProfile[] = (registeredUsers || []).map((user: any) => ({
        id: user.id,
        email: user.email || `user-${user.id.slice(0, 8)}@unknown.local`,
        email_confirmed_at: null, // Not available from user_profiles
        created_at: user.created_at,
        last_sign_in_at: user.last_login, // Use last_login as approximation
        full_name: user.full_name || 'Unknown User',
        role: user.role || 'user',
        is_verified: user.is_verified || false,
        last_login: user.last_login,
        age: user.age,
        location: user.location,
        user_type: 'registered' as const
      }));

      // Merge cả 2 lists
      let allUsers = [...transformedRegistered, ...transformedAnonymous];

      // Apply search filter nếu có
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        allUsers = allUsers.filter(user =>
          (user.full_name || '').toLowerCase().includes(searchTerm) ||
          (user.email || '').toLowerCase().includes(searchTerm) ||
          (user.location && user.location.toLowerCase().includes(searchTerm))
        );
      }

      // Apply role filter nếu có
      if (filters.role && filters.role !== 'all') {
        if (filters.role === 'anonymous') {
          allUsers = allUsers.filter(user => user.user_type === 'anonymous');
        } else {
          allUsers = allUsers.filter(user => user.role === filters.role && user.user_type === 'registered');
        }
      }

      // Apply verified filter nếu có  
      if (filters.verified !== undefined) {
        allUsers = allUsers.filter(user => user.is_verified === filters.verified);
      }

      // Apply user type filter nếu có
      if (filters.user_type) {
        allUsers = allUsers.filter(user => user.user_type === filters.user_type);
      }

      // Sort by created_at desc
      allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Apply pagination
      const total = allUsers.length;
      const startIndex = offset;
      const endIndex = startIndex + limit;
      const paginatedUsers = allUsers.slice(startIndex, endIndex);

      const totalPages = Math.ceil(total / limit);

      const result: UsersListResponse = {
        users: paginatedUsers,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      console.log('UsersService: Users fetched successfully:', {
        registered: transformedRegistered.length,
        anonymous: transformedAnonymous.length,
        total,
        page,
        totalPages,
        returned: paginatedUsers.length
      });

      return { data: result, error: null };

    } catch (err) {
      console.error('UsersService: Unexpected error:', err);
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
   * Get user statistics (bao gồm cả anonymous players)
   */
  static async getUserStats(): Promise<{ 
    data: { 
      total: number; 
      admins: number; 
      mods: number; 
      users: number; 
      verified: number; 
      unverified: number;
      registered: number;
      anonymous: number;
    } | null; 
    error: any 
  }> {
    try {
      console.log('UsersService: Fetching user statistics (registered + anonymous)');

      // Fetch both registered users and anonymous players
      const [registeredResult, anonymousResult] = await Promise.all([
        supabase.from(TABLES.PROFILES).select('role, is_verified'),
        // Count anonymous players from anonymous_players table
        supabase
          .from('anonymous_players')
          .select('id')
      ]);

      const { data: registeredData, error: registeredError } = registeredResult;
      const { data: anonymousPlayers, error: anonymousError } = anonymousResult;

      if (registeredError) {
        console.error('UsersService: Error fetching registered stats:', registeredError);
        return { data: null, error: registeredError };
      }

      if (anonymousError) {
        console.error('UsersService: Error fetching anonymous stats:', anonymousError);
        return { data: null, error: anonymousError };
      }

      const registeredCount = registeredData?.length || 0;
      const anonymousCount = anonymousPlayers?.length || 0;

      const stats = {
        total: registeredCount + anonymousCount,
        admins: registeredData?.filter(u => u.role === 'admin').length || 0,
        mods: registeredData?.filter(u => u.role === 'mod').length || 0,
        users: (registeredData?.filter(u => u.role === 'user').length || 0) + anonymousCount, // All anonymous are users
        verified: registeredData?.filter(u => u.is_verified).length || 0,
        unverified: (registeredData?.filter(u => !u.is_verified).length || 0) + anonymousCount, // All anonymous are unverified
        registered: registeredCount,
        anonymous: anonymousCount
      };

      console.log('UsersService: Stats fetched:', stats);
      return { data: stats, error: null };

    } catch (err) {
      console.error('UsersService: Error fetching stats:', err);
      return { data: null, error: err };
    }
  }
} 
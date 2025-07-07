import { supabase, supabaseAdmin, TABLES } from '../config/supabase';

export interface UserWithProfile {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string;
  role: 'user' | 'admin' | 'mod' | 'editor' | 'author' | 'reviewer';
  is_verified: boolean;
  last_login: string | null;
  age?: number;
  country_name?: string;
  user_type?: 'registered' | 'anonymous';
  // Thêm 3 trường mới cho các cột bảng
  gender?: string | null;
  country?: string | null;
  test_count?: number;
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
  role?: 'user' | 'admin' | 'mod' | 'editor' | 'author' | 'reviewer' | 'all' | 'anonymous';
  search?: string;
  verified?: boolean;
  user_type?: 'registered' | 'anonymous';
}

export interface CreateUserData {
  email: string;
  fullName: string;
  password: string;
  role: 'user' | 'admin' | 'editor' | 'author' | 'reviewer';
  isVerified: boolean;
}

export interface UpdateUserData {
  fullName?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  country_name?: string;
  role?: 'user' | 'admin' | 'editor' | 'author' | 'reviewer';
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
      const [registeredResult, anonymousResult, testCountsResult] = await Promise.all([
        // Query registered users directly from user_profiles với gender
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
            country_name,
            gender,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false }),
        // Query anonymous users from anonymous_players table với gender và country
        supabase
          .from('anonymous_players')
          .select('id, name, age, country_name, email, created_at, test_score, gender')
          .order('created_at', { ascending: false }),
        // Query test counts từ user_test_results
        supabase
          .from('user_test_results')
          .select('user_id, email')
      ]);

      const { data: registeredUsers, error: registeredError } = registeredResult;
      const { data: anonymousPlayers, error: anonymousError } = anonymousResult;
      const { data: testResults, error: testCountsError } = testCountsResult;

      if (registeredError) {
        console.error('UsersService: Error fetching registered users:', registeredError);
        return { data: null, error: registeredError };
      }

      if (anonymousError) {
        console.error('UsersService: Error fetching anonymous players:', anonymousError);
        return { data: null, error: anonymousError };
      }

      if (testCountsError) {
        console.error('UsersService: Error fetching test counts:', testCountsError);
        // Không return error vì test counts không phải critical
      }

      // Tạo map để đếm số lần test cho mỗi user
      const testCountMap = new Map<string, number>();
      const emailTestCountMap = new Map<string, number>();

      (testResults || []).forEach((result: any) => {
        if (result.user_id) {
          // Đếm cho registered users
          testCountMap.set(result.user_id, (testCountMap.get(result.user_id) || 0) + 1);
        } else if (result.email) {
          // Đếm cho anonymous users theo email
          emailTestCountMap.set(result.email, (emailTestCountMap.get(result.email) || 0) + 1);
        }
      });

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
        country_name: player.country_name,
        user_type: 'anonymous' as const,
        // Thêm 3 trường mới
        gender: player.gender || null,
        country: player.country_name || null,
        test_count: emailTestCountMap.get(player.email) || 0
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
        country_name: user.country_name,
        user_type: 'registered' as const,
        // Thêm 3 trường mới
        gender: user.gender || null,
        country: user.country_name || null, // Sử dụng country_name làm country cho registered users
        test_count: testCountMap.get(user.id) || 0
      }));

      // Merge cả 2 lists
      let allUsers = [...transformedRegistered, ...transformedAnonymous];

      // Apply search filter nếu có
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        allUsers = allUsers.filter(user =>
          (user.full_name || '').toLowerCase().includes(searchTerm) ||
          (user.email || '').toLowerCase().includes(searchTerm) ||
          (user.country_name && user.country_name.toLowerCase().includes(searchTerm))
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
    newRole: 'user' | 'admin' | 'mod' | 'editor' | 'author' | 'reviewer'
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

  /**
   * Create new user with profile - using same method as regular signup
   */
  static async createUser(userData: CreateUserData): Promise<{ success: boolean; error: any }> {
    try {
      console.log('UsersService: Creating new user:', { email: userData.email, role: userData.role });

      // Create user in Supabase Auth (same as regular signup)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName
          },
          // Auto-confirm email if verified is true
          emailRedirectTo: undefined,
          captchaToken: undefined
        }
      });

      if (authError) {
        console.error('UsersService: Error creating auth user:', authError);
        return { success: false, error: authError };
      }

      if (!authData.user) {
        console.error('UsersService: No user data returned from auth');
        return { success: false, error: { message: 'No user data returned' } };
      }

      console.log('UsersService: Auth user created, now creating profile via RPC...');

      // Create user profile using RPC function (same as regular signup)
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_profile', {
          user_id: authData.user.id,
          user_email: userData.email,
          display_name: userData.fullName,
          user_role: userData.role // Pass role to RPC function
        });

        if (rpcError) {
          console.error('UsersService: RPC profile creation error:', rpcError);

          // Try to delete the auth user if profile creation failed
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
          } catch (cleanupError) {
            console.error('UsersService: Error cleaning up auth user:', cleanupError);
          }

          return { success: false, error: rpcError };
        }

        console.log('UsersService: Profile created successfully via RPC');

        // If user should be verified, update the auth user
        if (userData.isVerified) {
          console.log('UsersService: Auto-verifying user email...');
          // Note: This might require admin privileges, but let's try
          try {
            await supabase.auth.admin.updateUserById(authData.user.id, {
              email_confirm: true
            });
          } catch (verifyError) {
            console.warn('UsersService: Could not auto-verify email:', verifyError);
            // Don't fail the whole operation for this
          }
        }

        return { success: true, error: null };

      } catch (rpcErr) {
        console.error('UsersService: RPC call failed with exception:', rpcErr);

        // Try to delete the auth user if profile creation failed
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('UsersService: Error cleaning up auth user:', cleanupError);
        }

        return { success: false, error: rpcErr };
      }

    } catch (err) {
      console.error('UsersService: Unexpected error creating user:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Update user information
   */
  static async updateUser(
    userId: string,
    userData: UpdateUserData
  ): Promise<{ success: boolean; error: any }> {
    try {
      console.log('UsersService: Updating user:', { userId, userData });

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (userData.fullName !== undefined) {
        updateData.full_name = userData.fullName;
      }

      if (userData.age !== undefined) {
        updateData.age = userData.age;
      }

      if (userData.gender !== undefined) {
        updateData.gender = userData.gender;
      }

      if (userData.country_name !== undefined) {
        updateData.country_name = userData.country_name;
      }

      if (userData.role !== undefined) {
        updateData.role = userData.role;
      }

      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('UsersService: Error updating user:', error);
        return { success: false, error };
      }

      console.log('UsersService: User updated successfully');
      return { success: true, error: null };

    } catch (err) {
      console.error('UsersService: Unexpected error updating user:', err);
      return { success: false, error: err };
    }
  }
}
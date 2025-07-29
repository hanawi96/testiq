import { supabase, supabaseAdmin, TABLES } from '../config/supabase';
import countryData from '../../Country.json';

// ===== HELPER: Country map, types =====
const countryCodeToName = new Map(countryData.map((c: any) => [c.code, c.name]));
const getCountryName = (code: string | null | undefined, fallback?: string) =>
  (code && countryCodeToName.get(code)) || fallback || 'Không rõ';

// ==== TYPES ====
type Role = 'user' | 'admin' | 'mod' | 'editor' | 'author' | 'reviewer';
type UserType = 'registered' | 'anonymous';

export interface UserWithProfile {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string;
  username?: string;
  role: Role;
  is_verified: boolean;
  last_login: string | null;
  age?: number;
  country_name?: string;
  country_code?: string;
  user_type?: UserType;
  avatar_url?: string;
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
  role?: Role | 'all' | UserType;
  search?: string;
  user_status?: 'registered_verified' | 'registered_unverified' | 'anonymous' | 'all';
  gender?: 'male' | 'female' | 'other' | 'unknown';
  sort?: 'age_asc' | 'age_desc' | 'created_asc' | 'created_desc';
}

export interface CreateUserData {
  email: string;
  fullName: string;
  password: string;
  role: Exclude<Role, 'mod'>; // mod không cho tạo thủ công
  isVerified: boolean;
}

export interface UpdateUserData {
  username?: string;
  fullName?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  country_name?: string;
  role?: Role;
}

// ========== GENERAL HELPERS ==========

// Xác định loại user: registered hay anonymous
async function getUserTypeById(userId: string) {
  const [reg, anon] = await Promise.all([
    supabase.from(TABLES.PROFILES).select('id').eq('id', userId).maybeSingle(),
    supabase.from('anonymous_players').select('id').eq('id', userId).maybeSingle()
  ]);
  return reg.data ? 'registered' : anon.data ? 'anonymous' : null;
}

// Lấy userIds là registered
async function getRegisteredUserIds(userIds: string[]) {
  const { data } = await supabase
    .from(TABLES.PROFILES)
    .select('id')
    .in('id', userIds);
  return data?.map((u: any) => u.id) || [];
}

// ========== USERS SERVICE ==========
export class UsersService {
  // Get paginated users list (single RPC)
  static async getUsers(
    page = 1,
    limit = 5,
    filters: UsersFilters = {}
  ): Promise<{ data: UsersListResponse | null; error: any }> {
    try {
      const offset = (page - 1) * limit;
      const { data: rpcData, error } = await supabase.rpc('get_users_with_stats', {
        page_limit: limit,
        page_offset: offset,
        role_filter: filters.role === 'all' ? null : filters.role,
        search_term: filters.search || null,
        user_status_filter: filters.user_status === 'all' ? null : filters.user_status,
        gender_filter: filters.gender || null,
        sort_by: filters.sort || 'created_desc'
      });
      if (error) return { data: null, error };

      const total = rpcData?.[0]?.total_count || 0;
      const users = (rpcData || []).map((u: any): UserWithProfile => ({
        id: u.id,
        email: u.email || `${u.user_type}-${u.id.slice(0, 8)}@${u.user_type}.local`,
        email_confirmed_at: null,
        created_at: u.created_at,
        last_sign_in_at: u.last_login,
        full_name: u.full_name || 'Unknown User',
        username: u.username,
        role: u.role || 'user',
        is_verified: !!u.is_verified,
        last_login: u.last_login,
        age: u.age,
        country_name: u.country_name,
        country_code: u.country_code,
        avatar_url: u.avatar_url,
        user_type: u.user_type,
        gender: u.gender ?? null,
        country: u.country_name ?? null,
        test_count: u.test_count ?? 0
      }));
      const totalPages = Math.ceil(total / limit);
      return {
        data: {
          users,
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Update user role (registered only)
  static async updateUserRole(
    userId: string,
    newRole: Role
  ): Promise<{ success: boolean; error: any }> {
    try {
      const { data } = await supabase
        .from(TABLES.PROFILES)
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      if (!data) return { success: true, error: null };
      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);
      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Toggle verification (registered only)
  static async toggleUserVerification(userId: string) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('is_verified')
        .eq('id', userId)
        .maybeSingle();
      if (error) return { success: true, error: null };
      const { error: updateErr } = await supabase
        .from(TABLES.PROFILES)
        .update({
          is_verified: !data?.is_verified,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      return { success: !updateErr, error: updateErr };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Users by country stats
  static async getUsersByCountry() {
    try {
      const [registered, anonymous] = await Promise.all([
        supabase.from(TABLES.PROFILES)
          .select('country_name, country_code')
          .or('country_code.not.is.null,country_name.not.is.null'),
        supabase.from('anonymous_players')
          .select('country_name, country_code')
          .or('country_code.not.is.null,country_name.not.is.null')
      ]);
      if (registered.error) return { data: null, error: registered.error };
      if (anonymous.error) return { data: null, error: anonymous.error };

      const countryMap = new Map<string, {
        country_name: string;
        country_code: string | null;
        registered_users: number;
        anonymous_users: number;
      }>();
      const add = (user: any, field: 'registered_users' | 'anonymous_users') => {
        const key = user.country_code || user.country_name || 'Unknown';
        if (!countryMap.has(key)) {
          countryMap.set(key, {
            country_name: getCountryName(user.country_code, user.country_name),
            country_code: user.country_code,
            registered_users: 0,
            anonymous_users: 0
          });
        }
        countryMap.get(key)![field]++;
      };
      (registered.data || []).forEach(u => add(u, 'registered_users'));
      (anonymous.data || []).forEach(u => add(u, 'anonymous_users'));
      const result = Array.from(countryMap.values())
        .map(c => ({ ...c, total_users: c.registered_users + c.anonymous_users }))
        .sort((a, b) => b.total_users - a.total_users);
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // User statistics
  static async getUserStats() {
    try {
      const [reg, anon] = await Promise.all([
        supabase.from(TABLES.PROFILES).select('role, is_verified'),
        supabase.from('anonymous_players').select('id')
      ]);
      if (reg.error) return { data: null, error: reg.error };
      if (anon.error) return { data: null, error: anon.error };

      const registered = reg.data || [];
      const anonymous = anon.data || [];
      return {
        data: {
          total: registered.length + anonymous.length,
          admins: registered.filter((u: any) => u.role === 'admin').length,
          mods: registered.filter((u: any) => u.role === 'mod').length,
          users: registered.filter((u: any) => u.role === 'user').length + anonymous.length,
          verified: registered.filter((u: any) => u.is_verified).length,
          unverified: registered.filter((u: any) => !u.is_verified).length + anonymous.length,
          registered: registered.length,
          anonymous: anonymous.length
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Check email exists (registered or anonymous)
  static async checkEmailExists(email: string) {
    try {
      for (const tbl of [TABLES.PROFILES, 'anonymous_players']) {
        const { data, error } = await supabase
          .from(tbl)
          .select('id')
          .eq('email', email)
          .limit(1);
        if (error) return { exists: false, error };
        if (data?.length) return { exists: true, error: null };
      }
      return { exists: false, error: null };
    } catch (error) {
      return { exists: false, error };
    }
  }

  // Create user (signUp + RPC + auto verify if needed)
  static async createUser(userData: CreateUserData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: { data: { full_name: userData.fullName } }
      });
      if (authError || !authData.user) return { success: false, error: authError || { message: 'No user data' } };

      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_profile', {
        user_id: authData.user.id,
        user_email: userData.email,
        display_name: userData.fullName,
        user_role: userData.role
      });

      if (rpcError || (rpcResult && typeof rpcResult === 'object' && !rpcResult.success)) {
        try { await supabase.auth.admin.deleteUser(authData.user.id); } catch {}
        return { success: false, error: rpcError || rpcResult?.error || rpcResult?.message };
      }

      if (userData.isVerified) {
        try {
          await supabase.auth.admin.updateUserById(authData.user.id, { email_confirm: true });
        } catch { /* ignore auto verify error */ }
      }
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Bulk update role (registered only)
  static async bulkUpdateUserRole(userIds: string[], newRole: Role) {
    try {
      if (!userIds.length) return { success: true, error: null };
      const regIds = await getRegisteredUserIds(userIds);
      if (!regIds.length) return { success: true, error: null };
      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .in('id', regIds);
      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Bulk update verification (registered only)
  static async bulkUpdateUserVerification(userIds: string[], verified: boolean) {
    try {
      if (!userIds.length) return { success: true, error: null };
      const regIds = await getRegisteredUserIds(userIds);
      if (!regIds.length) return { success: true, error: null };
      const { error } = await supabase
        .from(TABLES.PROFILES)
        .update({ is_verified: verified, updated_at: new Date().toISOString() })
        .in('id', regIds);
      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Update user (support registered + anonymous)
  static async updateUser(userId: string, userData: UpdateUserData) {
    try {
      const userType = await getUserTypeById(userId);
      if (!userType) return { success: false, error: { message: 'User not found' } };

      const updateData: any = { updated_at: new Date().toISOString() };
      if (userData.username !== undefined) updateData.username = userData.username;
      if (userData.fullName !== undefined) {
        if (userType === 'registered') updateData.full_name = userData.fullName;
        else updateData.name = userData.fullName;
      }
      if (userData.age !== undefined) updateData.age = userData.age;
      if (userData.gender !== undefined) updateData.gender = userData.gender;
      if (userData.country_name !== undefined) updateData.country_name = userData.country_name;
      if (userType === 'registered' && userData.role !== undefined) updateData.role = userData.role;

      const tbl = userType === 'registered' ? TABLES.PROFILES : 'anonymous_players';
      const { error } = await supabase
        .from(tbl)
        .update(updateData)
        .eq('id', userId);
      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Bulk delete users (support registered + anonymous)
  static async bulkDeleteUsers(userIds: string[]) {
    try {
      if (!userIds.length) return { success: false, error: { message: 'Danh sách user ID không hợp lệ' } };
      if (!supabaseAdmin) return { success: false, error: { message: 'Admin client không khả dụng' } };

      const regIds = await getRegisteredUserIds(userIds);
      const anonIds = userIds.filter(id => !regIds.includes(id));

      if (regIds.length) {
        const { error } = await supabaseAdmin.from(TABLES.PROFILES).delete().in('id', regIds);
        if (error) return { success: false, error };
        try {
          for (const userId of regIds) await supabaseAdmin.auth.admin.deleteUser(userId);
        } catch {}
      }
      if (anonIds.length) {
        const { error } = await supabaseAdmin.from('anonymous_players').delete().in('id', anonIds);
        if (error) return { success: false, error };
      }
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  }
}

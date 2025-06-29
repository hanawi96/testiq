import { supabase, TABLES } from '../config/supabase';

interface TestResultData {
  user_id?: string | null;
  test_type?: string;
  score: number;
  accuracy?: number;
  duration_seconds?: number;
  test_data?: any;
  guest_name?: string;
  guest_age?: number;
  guest_location?: string;
  guest_email?: string;
}

interface TestHistoryFilters {
  user_id?: string | null;
  test_type?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Lưu kết quả test vào bảng user_test_results (cho cả user đăng nhập và anonymous)
 */
export async function saveTestResult(data: TestResultData) {
  try {
    console.log('🔄 Saving test result to user_test_results...');
    
    const testRecord = {
      user_id: data.user_id || null, // NULL cho anonymous users
      test_type: data.test_type || 'iq',
      score: data.score,
      accuracy: data.accuracy,
      duration_seconds: data.duration_seconds,
      test_data: {
        ...data.test_data,
        // Lưu email vào test_data để không cần alter table
        guest_email: data.guest_email
      },
      guest_name: data.guest_name,
      guest_age: data.guest_age,
      guest_location: data.guest_location
    };

    const { data: result, error } = await supabase
      .from('user_test_results')
      .insert([testRecord])
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving test result:', error);
      throw error;
    }

    console.log('✅ Test result saved successfully:', result.id);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Failed to save test result:', error);
    return { success: false, error };
  }
}

/**
 * Lấy lịch sử test results (cho cả authenticated và anonymous users)
 */
export async function getUserTestResults(filters: TestHistoryFilters = {}) {
  try {
    console.log('🔄 Fetching test results...', filters);
    
    let query = supabase
      .from('user_test_results')
      .select('*')
      .order('tested_at', { ascending: false });

    // Apply filters
    if (filters.user_id !== undefined) {
      if (filters.user_id === null) {
        // Fetch anonymous users only
        query = query.is('user_id', null);
      } else {
        // Fetch specific user's results
        query = query.eq('user_id', filters.user_id);
      }
    }

    if (filters.test_type) {
      query = query.eq('test_type', filters.test_type);
    }

    if (filters.search) {
      // Search in guest names or user profiles
      query = query.or(`guest_name.ilike.%${filters.search}%`);
    }

    // Apply pagination - increase default limit
    const defaultLimit = filters.limit || 50; // Increase from 50 to better default
    if (defaultLimit) {
      query = query.limit(defaultLimit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + defaultLimit - 1);
    }

    const { data: results, error } = await query;

    if (error) {
      console.error('❌ Error fetching test results:', error);
      throw error;
    }

    console.log('✅ Test results fetched successfully:', results?.length || 0, 'items');
    console.log('📊 Sample result:', results?.[0] ? {
      id: results[0].id,
      user_id: results[0].user_id,
      score: results[0].score,
      tested_at: results[0].tested_at,
      test_type: results[0].test_type
    } : 'No results');
    
    return { success: true, data: results || [] };
  } catch (error) {
    console.error('❌ Failed to fetch test results:', error);
    return { success: false, error, data: [] };
  }
} 
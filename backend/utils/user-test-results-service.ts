import { supabase, TABLES } from '../config/supabase';

interface TestResultData {
  user_id?: string | null;
  test_type?: string;
  score: number;
  accuracy?: number;
  duration_seconds?: number;
  test_data?: any;
  guest_name?: string;
  guest_age?: number | null;
  guest_location?: string;
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
      test_data: data.test_data,
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
 * Helper function để convert từ format cũ sang format mới
 */
export function convertAnonymousPlayerToTestResult(anonymousData: {
  name: string;
  age: number;
  location: string;
  test_result: any;
  test_score: number;
  test_duration: number;
}): TestResultData {
  return {
    user_id: null, // Anonymous user
    test_type: 'iq',
    score: anonymousData.test_score,
    accuracy: anonymousData.test_result?.detailed?.accuracy,
    duration_seconds: anonymousData.test_duration,
    test_data: anonymousData.test_result,
    guest_name: anonymousData.name,
    guest_age: anonymousData.age,
    guest_location: anonymousData.location
  };
} 
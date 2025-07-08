import type { TestResult, UserInfo } from './core';
import { saveTestResult } from './core';

/**
 * Test function để verify chức năng lưu kết quả cho authenticated user
 */
export async function testAuthenticatedUserSave(): Promise<{ success: boolean; message: string }> {
  try {
    // Dynamic import to avoid build issues
    const { AuthService } = await import('@/backend');
    
    // Check if user is authenticated
    const { user } = await AuthService.getCurrentUser();
    
    if (!user) {
      return { 
        success: false, 
        message: '❌ No authenticated user found. Please login to test authenticated functionality.' 
      };
    }

    // Create sample test result
    const sampleResult: TestResult = {
      score: 8,
      iq: 125,
      classification: 'superior',
      percentile: 85,
      answers: [1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
      timeSpent: 1500,
      categoryScores: {
        logic: 80,
        math: 90,
        verbal: 75
      },
      detailed: {
        correct: 8,
        incorrect: 2,
        accuracy: 80
      }
      // No userInfo for authenticated users
    };

    // Save test result
    await saveTestResult(sampleResult);
    
    return {
      success: true,
      message: `✅ Authenticated user test result saved successfully for user: ${user.email} (${user.id})`
    };

  } catch (error) {
    console.error('Test authenticated save error:', error);
    return {
      success: false,
      message: `❌ Error testing authenticated save: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Test function để verify chức năng lưu kết quả cho anonymous user
 */
export async function testAnonymousUserSave(userInfo?: UserInfo): Promise<{ success: boolean; message: string }> {
  try {
    // Create sample test result with user info
    const testUserInfo = userInfo || {
      name: 'Test Anonymous User',
      email: 'test@example.com',
      age: '25',
      location: 'Ho Chi Minh City'
    };

    const sampleResult: TestResult = {
      score: 7,
      iq: 115,
      classification: 'high_average',
      percentile: 75,
      answers: [1, 0, 1, 1, 0, 1, 1, 0, 0, 1],
      timeSpent: 1800,
      categoryScores: {
        logic: 70,
        math: 80,
        verbal: 75
      },
      detailed: {
        correct: 7,
        incorrect: 3,
        accuracy: 70
      },
      userInfo: testUserInfo
    };

    // Save test result
    await saveTestResult(sampleResult);
    
    return {
      success: true,
      message: `✅ Anonymous user test result saved successfully for: ${testUserInfo.name}`
    };

  } catch (error) {
    console.error('Test anonymous save error:', error);
    return {
      success: false,
      message: `❌ Error testing anonymous save: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Test function để verify cả hai chức năng
 */
export async function testUnifiedSaveSystem(): Promise<{ 
  authTest: { success: boolean; message: string };
  anonTest: { success: boolean; message: string };
}> {
  console.log('🧪 Testing unified test results save system...');
  
  const authTest = await testAuthenticatedUserSave();
  const anonTest = await testAnonymousUserSave();
  
  console.log('Auth test result:', authTest);
  console.log('Anonymous test result:', anonTest);
  
  return { authTest, anonTest };
}

// ✅ OPTIMIZED: Validation logic tối ưu, tái sử dụng được
export function validateUserInfo(userInfo: UserInfo): boolean {
  return !!(
    userInfo.name?.trim() && 
    userInfo.email?.trim() && 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email.trim()) &&
    userInfo.age?.trim() && 
    parseInt(userInfo.age) > 0 && 
    parseInt(userInfo.age) <= 120 &&
    userInfo.location?.trim() &&
    userInfo.gender?.trim()
  );
}

// ✅ HELPER: Validation từng field riêng lẻ để hiển thị lỗi cụ thể
export function validateField(field: keyof UserInfo, value: string): { isValid: boolean; error?: string } {
  switch (field) {
    case 'name':
      return { 
        isValid: !!value?.trim(), 
        error: !value?.trim() ? 'Vui lòng nhập họ tên' : undefined 
      };
    
    case 'email':
      const emailValid = !!value?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
      return { 
        isValid: emailValid,
        error: !value?.trim() ? 'Vui lòng nhập email' : !emailValid ? 'Email không hợp lệ' : undefined
      };
    
    case 'age':
      const age = parseInt(value);
      const ageValid = !!value?.trim() && age > 0 && age <= 120;
      return {
        isValid: ageValid,
        error: !value?.trim() ? 'Vui lòng nhập tuổi' : !ageValid ? 'Tuổi phải từ 1-120' : undefined
      };
    
    case 'location':
      return {
        isValid: !!value?.trim(),
        error: !value?.trim() ? 'Vui lòng chọn quốc gia' : undefined
      };
    
    case 'gender':
      return {
        isValid: !!value?.trim(),
        error: !value?.trim() ? 'Vui lòng chọn giới tính' : undefined
      };
    
    default:
      return { isValid: true };
  }
} 
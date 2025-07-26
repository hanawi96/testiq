/**
 * FORMATTERS & UTILITY FUNCTIONS
 * Các hàm utility để format dữ liệu và xử lý logic đơn giản cho Users
 */

import type { UserWithProfile } from '../../../../../backend';

// Format date
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Chưa có';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Format gender
export const formatGender = (gender: string | null | undefined): string => {
  if (!gender || gender.trim() === '') return 'Chưa có';
  // Chuyển đổi giá trị tiếng Anh sang tiếng Việt
  switch (gender.toLowerCase()) {
    case 'male':
      return 'Nam';
    case 'female':
      return 'Nữ';
    case 'other':
      return 'Khác';
    default:
      return gender;
  }
};

// Format test count with styling
export const formatTestCount = (count: number | undefined): { text: string; className: string } => {
  const testCount = count || 0;
  if (testCount === 0) {
    return {
      text: 'Chưa có',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
  } else if (testCount === 1) {
    return {
      text: '1 lần',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    };
  } else if (testCount <= 5) {
    return {
      text: `${testCount} lần`,
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
  } else {
    return {
      text: `${testCount} lần`,
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
  }
};

// Get role badge styling
export const getRoleBadge = (role: string): string => {
  const styles = {
    admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    editor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    author: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    reviewer: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    mod: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    user: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
  };
  return styles[role as keyof typeof styles] || styles.user;
};

// Get user type badge styling
export const getUserTypeBadge = (userType: 'registered' | 'anonymous' | undefined): string => {
  if (userType === 'anonymous') {
    return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
  }
  return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
};

// Check if user is anonymous
export const isAnonymousUser = (user: UserWithProfile): boolean => {
  return user.user_type === 'anonymous';
};

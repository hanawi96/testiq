/**
 * FORMATTERS - TỐI ƯU HÓA
 * Utils gọn gàng với lookup tables và functional approach
 */

import type { UserWithProfile } from '../../../../../backend';

// === LOOKUP TABLES ===
const GENDER_MAP = {
  male: { text: 'Nam', icon: '♂️' },
  female: { text: 'Nữ', icon: '♀️' },
  other: { text: 'Khác', icon: '⚧️' }
} as const;

const ROLE_STYLES = {
  admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  editor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  author: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  reviewer: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  mod: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  user: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
} as const;

const TEST_COUNT_STYLES = [
  { max: 0, text: 'Chưa có', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
  { max: 1, text: '1 lần', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { max: 5, text: (n: number) => `${n} lần`, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { max: Infinity, text: (n: number) => `${n} lần`, className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' }
];

// === FORMATTERS ===
export const formatDate = (dateString: string | null): string =>
  dateString ? new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa có';

export const formatGender = (gender: string | null | undefined): { text: string; icon: string | null } =>
  !gender?.trim() ? { text: 'Chưa có', icon: null } :
  GENDER_MAP[gender.toLowerCase() as keyof typeof GENDER_MAP] || { text: gender, icon: null };

export const formatTestCount = (count: number | undefined): { text: string; className: string } => {
  const testCount = count || 0;
  const style = TEST_COUNT_STYLES.find(s => testCount <= s.max)!;
  return {
    text: typeof style.text === 'function' ? style.text(testCount) : style.text,
    className: style.className
  };
};

export const getRoleBadge = (role: string): string =>
  ROLE_STYLES[role as keyof typeof ROLE_STYLES] || ROLE_STYLES.user;

export const getUserTypeBadge = (userType: 'registered' | 'anonymous' | undefined): string =>
  userType === 'anonymous'
    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';

export const isAnonymousUser = (user: UserWithProfile): boolean => user.user_type === 'anonymous';

// === ERROR HANDLING ===
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
  TIMEOUT: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.',
  UNAUTHORIZED: 'Bạn không có quyền thực hiện hành động này.',
  FORBIDDEN: 'Truy cập bị từ chối.',
  NOT_FOUND: 'Không tìm thấy dữ liệu yêu cầu.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ.',
  DUPLICATE_ERROR: 'Dữ liệu đã tồn tại.',
  SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.'
} as const;

export const handleApiError = (error: unknown, defaultMessage: string) => {
  if (error instanceof Error) return { message: error.message, details: { originalError: error.name } };
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, any>;
    if ('message' in errorObj) return { message: errorObj.message, code: errorObj.code, field: errorObj.field, details: errorObj.details };
    if ('error' in errorObj && typeof errorObj.error === 'string') return { message: errorObj.error, details: errorObj };
  }
  if (typeof error === 'string') return { message: error };
  return { message: defaultMessage, details: { originalError: error } };
};

export const getUserFriendlyMessage = (error: any): string =>
  error.code && ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || error.message;

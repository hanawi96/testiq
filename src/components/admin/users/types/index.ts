/**
 * TYPES - TỐI ƯU HÓA
 * Chỉ giữ lại types thực sự cần thiết
 */

// Re-export backend types
export type { UserWithProfile, UsersListResponse, UsersFilters } from '../../../../../backend';

// API Error interface
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, any>;
}

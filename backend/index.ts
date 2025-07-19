// Main entry point for backend services
// This allows clean imports like: import { AuthService } from './backend'

// Core services
export { AuthService } from './auth/service';
export { UsersService } from './admin/users-service';
export { AdminService } from './admin/service';
export { ResultsService } from './admin/results-service';
export { ArticlesService } from './admin/articles-service';
export { CategoriesService } from './admin/categories-service';
export { TagsService } from './admin/tags-service';
export { MediaService } from './admin/media-service';
export { UserProfilesService } from './admin/user-profiles-service';
export { ImageStorageService } from './storage/image-storage';
export { SettingsService } from './admin/settings-service';

// Configuration
export { supabase, supabaseAdmin, supabaseConfig, TABLES } from './config/supabase';

// Test results service (unified approach)
export { 
  saveTestResult, 
  getUserTestResults
} from './utils/user-test-results-service';

// Export types
export type { UserWithProfile, UsersListResponse, UsersFilters, CreateUserData, UpdateUserData } from './admin/users-service';
export type { TestResult, ResultsStats, ResultsFilters, ResultsListResponse } from './admin/results-service';
export type { Article, ArticleStats, ArticlesFilters, ArticlesListResponse, CreateArticleData } from './admin/articles-service';
export type { Category, CategoryStats, CategoriesFilters, CategoriesListResponse } from './admin/categories-service';
export type { Tag, TagStats, TagsFilters, TagsListResponse } from './admin/tags-service';
export type { MediaFile, MediaFolder, MediaStats, MediaFilters, MediaListResponse } from './admin/media-service';
export type { UserProfile, AuthorOption } from './admin/user-profiles-service';
export type { SiteSettings, SettingsUpdateData } from './admin/settings-service';
export type { AdminStats, AdminAction, WeeklyNewUsersStats, TestTimeRange } from './types';
export * from './types';

// Export leaderboard services
export {
  getLeaderboard,
  getScalableLeaderboard,
  getMaterializedLeaderboard,
  getMaterializedUserRanking,
  refreshMaterializedCache,
  getMaterializedCacheStatus,
  getRecentTopPerformers,
  getQuickStats,
  getUserLocalRanking,
  clearLeaderboardCache,
  clearScalableCache,
  preloadLeaderboardData,
  getCacheStatus,
  getScalableCacheStats
} from './utils/leaderboard-service';
export type { LeaderboardEntry, LeaderboardStats } from './utils/leaderboard-service';

// Export view tracking service
export { ViewTrackingService } from './utils/view-tracking-service';

// Export dashboard stats service - PRODUCTION READY
export { 
  getDashboardStats,
  clearDashboardCache
} from './utils/dashboard-stats-service';
export type { DashboardStats } from './utils/dashboard-stats-service';

// Export other services
export { updateUserProfile, getUserProfile } from './utils/user-profile-service';
export type { UserProfileData } from './utils/user-profile-service';
export { findAnonymousPlayerByEmail, saveAnonymousPlayer } from './utils/anonymous-players-service';
export type { AnonymousPlayer, AnonymousPlayerInput } from './utils/anonymous-players-service';
export { getCountries, getCountriesWithVietnamFirst, clearCountriesCache } from './utils/countries-service';
export type { Country } from './utils/countries-service'; 
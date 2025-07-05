// Main entry point for backend services
// This allows clean imports like: import { AuthService } from './backend'

// Core services
export { AuthService } from './auth/service';
export { UsersService } from './admin/users-service';
export { AdminService } from './admin/service';
export { ResultsService } from './admin/results-service';
export { ArticlesService } from './admin/articles-service';
export { CategoriesService } from './admin/categories-service';

// Configuration
export { supabase, supabaseConfig, TABLES } from './config/supabase';

// Test results service (unified approach)
export { 
  saveTestResult, 
  getUserTestResults
} from './utils/user-test-results-service';

// Export types
export type { UserWithProfile, UsersListResponse, UsersFilters } from './admin/users-service';
export type { TestResult, ResultsStats, ResultsFilters, ResultsListResponse } from './admin/results-service';
export type { Article, ArticleStats, ArticlesFilters, ArticlesListResponse } from './admin/articles-service';
export type { Category, CategoryStats, CategoriesFilters, CategoriesListResponse } from './admin/categories-service';
export type { AdminStats, AdminAction } from './types';
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
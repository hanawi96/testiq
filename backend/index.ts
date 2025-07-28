// Main entry point for backend services
// This allows clean imports like: import { AuthService } from './backend'

// Core services - Always needed
export { AuthService } from './auth/service';
export { AdminService } from './admin/service';
export { ArticlesService } from './admin/articles/service';

// Lazy load heavy services - only needed for specific admin pages
export const loadUsersService = () => import('./admin/users-service').then(m => m.UsersService);
export const loadResultsService = () => import('./admin/results-service').then(m => m.ResultsService);
export const loadAnalyticsService = () => import('./admin/analytics-service').then(m => m.AnalyticsService);
export const loadCategoriesService = () => import('./admin/categories-service').then(m => m.CategoriesService);
export const loadTagsService = () => import('./admin/tags-service').then(m => m.TagsService);
export const loadMediaService = () => import('./admin/media-service').then(m => m.MediaService);
export const loadUserProfilesService = () => import('./admin/user-profiles-service').then(m => m.UserProfilesService);
export const loadImageStorageService = () => import('./storage/image-storage').then(m => m.ImageStorageService);
export const loadSettingsService = () => import('./admin/settings-service').then(m => m.SettingsService);

// Export static utilities that don't need lazy loading
export { SettingsService } from './admin/settings-service';

// Configuration
export { supabase, supabaseAdmin, supabaseConfig, TABLES } from './config/supabase';

// Test results service (unified approach)
export { 
  saveTestResult, 
  getUserTestResults
} from './utils/user-test-results-service';

// Export types - Always available
export type { Article, ArticleStats, ArticlesFilters, ArticlesListResponse, CreateArticleData } from './admin/articles-service';
export type { AdminStats, AdminAction, WeeklyNewUsersStats, TestTimeRange } from './types';
export * from './types';

// Lazy load types - only needed for specific features
export type { UserWithProfile, UsersListResponse, UsersFilters, CreateUserData, UpdateUserData } from './admin/users-service';
export type { TestResult, ResultsStats, ResultsFilters, ResultsListResponse } from './admin/results-service';
export type { Category, CategoryStats, CategoriesFilters, CategoriesListResponse } from './admin/categories-service';
export type { Tag, TagStats, TagsFilters, TagsListResponse } from './admin/tags-service';
export type { MediaFile, MediaFolder, MediaStats, MediaFilters, MediaListResponse } from './admin/media-service';
export type { UserProfile, AuthorOption } from './admin/user-profiles-service';
export type { SiteSettings, SettingsUpdateData } from './admin/settings-service';

// Lazy load utility services - only needed for specific features
export const loadLeaderboardService = () => import('./utils/leaderboard-service');
export const loadViewTrackingService = () => import('./utils/view-tracking-service').then(m => m.ViewTrackingService);
export const loadDashboardStatsService = () => import('./utils/dashboard-stats-service');

// Lazy load other utility services
export const loadUserProfileService = () => import('./utils/user-profile-service');
export const loadAnonymousPlayersService = () => import('./utils/anonymous-players-service');
export const loadCountriesService = () => import('./utils/countries-service');
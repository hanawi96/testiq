// Main entry point for backend services
// This allows clean imports like: import { AuthService } from './backend'

// Core services
export { AuthService } from './auth/service';
export { UsersService } from './admin/users-service';
export { AdminService } from './admin/service';

// Configuration
export { supabase, supabaseConfig, TABLES } from './config/supabase';
export { testSupabaseConnection, checkDatabaseSetup } from './utils/test-connection';

// Test results service (unified approach)
export { 
  saveTestResult, 
  getUserTestResults
} from './utils/user-test-results-service';

// Export types
export type { UserWithProfile, UsersListResponse, UsersFilters } from './admin/users-service';
export type { AdminStats, AdminAction } from './types';

// Additional exports
export { quickSetupDatabase, createTestAdmin } from './utils/setup-database';
export * from './types';

// Export leaderboard services
export { 
  getLeaderboard, 
  getRecentTopPerformers, 
  getQuickStats,
  getUserLocalRanking,
  clearLeaderboardCache,
  preloadLeaderboardData,
  getCacheStatus 
} from './utils/leaderboard-service';
export type { LeaderboardEntry, LeaderboardStats } from './utils/leaderboard-service';

// Export dashboard stats service - SIÊU TỐI ƯU
export { 
  getDashboardStats,
  clearDashboardCache,
  debugDashboardStats
} from './utils/dashboard-stats-service';
export type { DashboardStats } from './utils/dashboard-stats-service';

// Export data analysis service - KIỂM TRA CHÍNH XÁC
export { 
  analyzeCompleteData,
  compareWithDashboard
} from './utils/data-analysis-service';
export type { DataAnalysisResult } from './utils/data-analysis-service';

// Export other services
export { updateUserProfile, getUserProfile } from './utils/user-profile-service';
export type { UserProfileData } from './utils/user-profile-service';
export { findAnonymousPlayerByEmail, saveAnonymousPlayer } from './utils/anonymous-players-service';
export type { AnonymousPlayer, AnonymousPlayerInput } from './utils/anonymous-players-service';
export { getCountries, getCountriesWithVietnamFirst, clearCountriesCache } from './utils/countries-service';
export type { Country } from './utils/countries-service'; 
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
export { saveTestResult, convertAnonymousPlayerToTestResult } from './utils/user-test-results-service';

// Export types
export type { UserWithProfile, UsersListResponse, UsersFilters } from './admin/users-service';
export type { AdminStats, AdminAction } from './types';

// Additional exports
export { quickSetupDatabase, createTestAdmin } from './utils/setup-database';
export * from './types';

// Export new services
export { getLeaderboard, getRecentTopPerformers } from './utils/leaderboard-service';
export type { LeaderboardEntry, LeaderboardStats } from './utils/leaderboard-service';
export { updateUserProfile, getUserProfile } from './utils/user-profile-service';
export type { UserProfileData } from './utils/user-profile-service'; 
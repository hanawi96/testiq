// Main entry point for backend services
// This allows clean imports like: import { AuthService } from './backend'

// Core services
export { AuthService } from './auth/service';
export { UsersService } from './admin/users-service';

// Configuration
export { supabase, supabaseConfig, TABLES } from './config/supabase';
export { testSupabaseConnection, checkDatabaseSetup } from './utils/test-connection';

// New anonymous players service
export { saveAnonymousPlayer, checkAnonymousPlayersTable, createAnonymousPlayersTable } from './utils/anonymous-players-service';

// Export types
export type { UserWithProfile, UsersListResponse, UsersFilters } from './admin/users-service';

// Additional exports
export { quickSetupDatabase, createTestAdmin } from './utils/setup-database';
export * from './types'; 
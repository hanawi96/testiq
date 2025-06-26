// Backend Services Export
export { AuthService } from './auth/service';
export { AdminService } from './admin/service';
export { supabase, supabaseConfig, TABLES } from './config/supabase';
export { testSupabaseConnection, checkDatabaseSetup } from './utils/test-connection';
export { quickSetupDatabase, createTestAdmin } from './utils/setup-database';
export * from './types'; 
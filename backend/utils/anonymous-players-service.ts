import { supabase, TABLES } from '../config/supabase';

interface AnonymousPlayerData {
  name: string;
  age: number;
  location: string;
  test_result: any;
  test_score: number;
  test_duration: number;
}

/**
 * Lưu thông tin và kết quả test của anonymous player vào Supabase
 */
export async function saveAnonymousPlayer(data: AnonymousPlayerData) {
  try {
    console.log('🔄 Saving anonymous player data to Supabase...');
    
    const { data: result, error } = await supabase
      .from(TABLES.ANONYMOUS_PLAYERS)
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving anonymous player:', error);
      throw error;
    }

    console.log('✅ Anonymous player saved successfully:', result.id);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Failed to save anonymous player:', error);
    return { success: false, error };
  }
}

/**
 * Kiểm tra xem bảng anonymous_players đã tồn tại chưa
 */
export async function checkAnonymousPlayersTable() {
  try {
    const { data, error } = await supabase
      .from(TABLES.ANONYMOUS_PLAYERS)
      .select('id')
      .limit(1);

    if (error) {
      console.warn('⚠️ anonymous_players table not found:', error.message);
      return false;
    }

    console.log('✅ anonymous_players table exists');
    return true;
  } catch (error) {
    console.error('❌ Error checking anonymous_players table:', error);
    return false;
  }
}

/**
 * Tạo bảng anonymous_players nếu chưa tồn tại
 */
export async function createAnonymousPlayersTable() {
  try {
    console.log('🔧 Creating anonymous_players table...');
    
    const createTableSQL = `
      create table if not exists public.anonymous_players (
        id uuid not null default gen_random_uuid (),
        name text not null,
        age integer null,
        location text null,
        test_result jsonb not null,
        test_score integer null,
        test_duration integer null,
        created_at timestamp without time zone null default now(),
        constraint anonymous_players_pkey primary key (id),
        constraint anonymous_players_age_check check (
          (
            (age >= 0)
            and (age <= 120)
          )
        )
      ) tablespace pg_default;
    `;

    const { error } = await supabase.rpc('execute_sql', { sql: createTableSQL });

    if (error) {
      console.error('❌ Failed to create anonymous_players table:', error);
      return false;
    }

    console.log('✅ anonymous_players table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating anonymous_players table:', error);
    return false;
  }
} 
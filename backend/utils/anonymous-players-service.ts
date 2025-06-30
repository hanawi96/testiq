import { supabase } from '../config/supabase';

export interface AnonymousPlayer {
  id: string;
  name: string;
  email: string;
  age?: number;
  country_name?: string;
  country_code?: string;
  gender?: string;
  test_result: any;
  test_score?: number;
  test_duration?: number;
  created_at: string;
}

export interface AnonymousPlayerInput {
  name: string;
  email: string;
  age?: number;
  country_name?: string;
  country_code?: string;
  gender?: string;
  test_result: any;
  test_score: number;
  test_duration: number;
}

/**
 * Find anonymous player by email
 */
export async function findAnonymousPlayerByEmail(email: string): Promise<{
  success: boolean;
  data?: AnonymousPlayer;
  error?: any;
}> {
  try {
    console.log('🔍 Looking up anonymous player by email:', email);

    const { data, error } = await supabase
      .from('anonymous_players')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error finding anonymous player:', error);
      return { success: false, error };
    }

    if (data) {
      console.log('✅ Found existing anonymous player:', data.name);
      return { success: true, data };
    }

    console.log('📝 No existing player found with email:', email);
    return { success: true, data: undefined };

  } catch (err) {
    console.error('❌ Unexpected error finding anonymous player:', err);
    return { success: false, error: err };
  }
}

/**
 * Save or update anonymous player
 */
export async function saveAnonymousPlayer(playerData: AnonymousPlayerInput): Promise<{
  success: boolean;
  data?: AnonymousPlayer;
  error?: any;
}> {
  try {
    console.log('💾 Saving anonymous player:', playerData.email);

    // Check if player exists
    const existingResult = await findAnonymousPlayerByEmail(playerData.email);
    
    if (!existingResult.success) {
      return existingResult;
    }

    if (existingResult.data) {
      // Update existing player
      console.log('🔄 Updating existing anonymous player');
      const { data, error } = await supabase
        .from('anonymous_players')
        .update({
          name: playerData.name,
          age: playerData.age,
          country_name: playerData.country_name,
          country_code: playerData.country_code,
          gender: playerData.gender,
          test_result: playerData.test_result,
          test_score: playerData.test_score,
          test_duration: playerData.test_duration
        })
        .eq('id', existingResult.data.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating anonymous player:', error);
        return { success: false, error };
      }

      console.log('✅ Anonymous player updated successfully');
      return { success: true, data };
    } else {
      // Create new player
      console.log('➕ Creating new anonymous player');
      const { data, error } = await supabase
        .from('anonymous_players')
        .insert([playerData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating anonymous player:', error);
        return { success: false, error };
      }

      console.log('✅ New anonymous player created successfully');
      return { success: true, data };
    }

  } catch (err) {
    console.error('❌ Unexpected error saving anonymous player:', err);
    return { success: false, error: err };
  }
} 
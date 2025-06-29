import { supabase } from '../config/supabase';

export interface Country {
  id: string;
  name: string;
  code: string;
}

// Smart cache for countries (they rarely change)
let cachedCountries: Country[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

/**
 * Get all countries with smart caching
 * Ultra-fast after first load
 */
export async function getCountries(): Promise<{
  data: Country[] | null;
  error: any;
}> {
  try {
    // Return cached data if valid
    const now = Date.now();
    if (cachedCountries && (now - cacheTimestamp) < CACHE_DURATION) {
      return { data: cachedCountries, error: null };
    }

    console.log('🌍 Fetching countries from database...');
    
    const { data, error } = await supabase
      .from('countries')
      .select('id, name, code')
      .order('name', { ascending: true });

    console.log('📊 Raw database response:', { 
      dataLength: data?.length, 
      hasError: !!error,
      firstFew: data?.slice(0, 3).map(c => c.name)
    });

    if (error) {
      console.error('❌ Countries fetch error:', error);
      // Return cached data if available, even if stale
      return { data: cachedCountries, error };
    }

    // Update cache
    cachedCountries = data || [];
    cacheTimestamp = now;
    
    console.log(`✅ Loaded ${data?.length || 0} countries`);
    return { data: cachedCountries, error: null };

  } catch (err) {
    console.error('❌ Countries service error:', err);
    // Return cached data as fallback
    return { data: cachedCountries, error: err };
  }
}

/**
 * Get countries with Vietnam first (for Vietnamese users)
 */
export async function getCountriesWithVietnamFirst(): Promise<{
  data: Country[] | null;
  error: any;
}> {
  const result = await getCountries();
  
  if (!result.data) return result;

  // Move Vietnam to first position
  const countries = [...result.data];
  const vietnamIndex = countries.findIndex(c => 
    c.name.toLowerCase().includes('vietnam') || 
    c.name.toLowerCase().includes('việt nam') ||
    c.code === 'VN'
  );

  if (vietnamIndex > 0) {
    const vietnam = countries.splice(vietnamIndex, 1)[0];
    countries.unshift(vietnam);
  }

  return { data: countries, error: null };
}

/**
 * Clear cache (useful for admin updates)
 */
export function clearCountriesCache(): void {
  cachedCountries = null;
  cacheTimestamp = 0;
  console.log('🧹 Countries cache cleared');
} 
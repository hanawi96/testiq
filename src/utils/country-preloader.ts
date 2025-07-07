/**
 * Intelligent Country Data Preloader
 * Ensures country data is available instantly when popups appear
 */

import type { Country } from '../components/common/UnifiedCountrySelector';

// Shared cache state (same as UnifiedCountrySelector)
let countryCache: Country[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
let preloadPromise: Promise<Country[]> | null = null;
let isPreloading = false;

// Fallback countries for instant availability
const INSTANT_COUNTRIES: Country[] = [
  { id: 'VN', name: 'Việt Nam', code: 'VN', emoji: '🇻🇳' },
  { id: 'US', name: 'United States', code: 'US', emoji: '🇺🇸' },
  { id: 'SG', name: 'Singapore', code: 'SG', emoji: '🇸🇬' },
  { id: 'CA', name: 'Canada', code: 'CA', emoji: '🇨🇦' },
  { id: 'AU', name: 'Australia', code: 'AU', emoji: '🇦🇺' },
  { id: 'GB', name: 'United Kingdom', code: 'GB', emoji: '🇬🇧' },
  { id: 'DE', name: 'Germany', code: 'DE', emoji: '🇩🇪' },
  { id: 'FR', name: 'France', code: 'FR', emoji: '🇫🇷' },
  { id: 'JP', name: 'Japan', code: 'JP', emoji: '🇯🇵' },
  { id: 'KR', name: 'South Korea', code: 'KR', emoji: '🇰🇷' }
];

/**
 * Smart country data loader with multiple fallback strategies
 */
async function loadCountryData(): Promise<Country[]> {
  try {
    // Try database first (preferred for consistency)
    const backend = await import('@/backend');
    const result = await backend.getCountriesWithVietnamFirst();
    
    if (result.data && result.data.length > 0) {
      const dbCountries: Country[] = result.data.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        flag: `https://country-code-au6g.vercel.app/${c.code}.svg`
      }));
      
      console.log('🌍 Preloader: Loaded countries from database');
      return dbCountries;
    }
  } catch (dbError) {
    console.warn('🌍 Preloader: Database failed, trying JSON fallback:', dbError);
  }

  try {
    // Fallback to JSON file
    const response = await fetch('/country.json');
    const jsonCountries = await response.json();
    
    if (Array.isArray(jsonCountries) && jsonCountries.length > 0) {
      const processedCountries: Country[] = jsonCountries.map(c => ({
        id: c.code || c.name,
        name: c.name,
        code: c.code,
        emoji: c.emoji,
        flag: `https://country-code-au6g.vercel.app/${c.code}.svg`
      }));
      
      // Move Vietnam to first position
      const vietnamIndex = processedCountries.findIndex(c => 
        c.code === 'VN' || c.name.toLowerCase().includes('việt nam')
      );
      if (vietnamIndex > 0) {
        const vietnam = processedCountries.splice(vietnamIndex, 1)[0];
        processedCountries.unshift(vietnam);
      }
      
      console.log('🌍 Preloader: Loaded countries from JSON');
      return processedCountries;
    }
  } catch (jsonError) {
    console.warn('🌍 Preloader: JSON failed, using instant fallback:', jsonError);
  }

  // Final fallback to instant countries
  console.log('🌍 Preloader: Using instant fallback countries');
  return INSTANT_COUNTRIES;
}

/**
 * Preload country data in background
 * Safe to call multiple times - will only preload once
 */
export async function preloadCountryData(): Promise<Country[]> {
  // Return cached data if valid
  const now = Date.now();
  if (countryCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('🌍 Preloader: Using cached countries');
    return countryCache;
  }

  // Return existing promise if already preloading
  if (preloadPromise) {
    console.log('🌍 Preloader: Waiting for existing preload');
    return preloadPromise;
  }

  // Start preloading
  console.log('🌍 Preloader: Starting country data preload');
  isPreloading = true;
  
  preloadPromise = loadCountryData()
    .then(countries => {
      // Cache the result
      countryCache = countries;
      cacheTimestamp = now;
      isPreloading = false;
      preloadPromise = null;
      
      console.log(`🌍 Preloader: Successfully preloaded ${countries.length} countries`);
      return countries;
    })
    .catch(error => {
      console.error('🌍 Preloader: Failed to preload countries:', error);
      isPreloading = false;
      preloadPromise = null;
      
      // Return instant fallback on error
      countryCache = INSTANT_COUNTRIES;
      cacheTimestamp = now;
      return INSTANT_COUNTRIES;
    });

  return preloadPromise;
}

/**
 * Get instantly available country data
 * Returns cached data immediately or instant fallback
 */
export function getInstantCountryData(): Country[] {
  const now = Date.now();
  
  // Return cached data if valid
  if (countryCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return countryCache;
  }
  
  // Return instant fallback while preloading in background
  if (!isPreloading) {
    preloadCountryData(); // Start background preload
  }
  
  return INSTANT_COUNTRIES;
}

/**
 * Check if country data is ready (cached and fresh)
 */
export function isCountryDataReady(): boolean {
  const now = Date.now();
  return countryCache !== null && (now - cacheTimestamp) < CACHE_DURATION;
}

/**
 * Force refresh country data cache
 */
export function refreshCountryData(): Promise<Country[]> {
  countryCache = null;
  cacheTimestamp = 0;
  preloadPromise = null;
  isPreloading = false;
  
  return preloadCountryData();
}

/**
 * Preload during idle time using requestIdleCallback
 */
export function preloadDuringIdle(): void {
  if (isCountryDataReady()) {
    return; // Already ready
  }

  const preload = () => {
    preloadCountryData().catch(error => {
      console.warn('🌍 Idle preload failed:', error);
    });
  };

  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    requestIdleCallback(preload, { timeout: 5000 });
  } else {
    setTimeout(preload, 100);
  }
}

/**
 * Smart preload triggers for different scenarios
 */
export const preloadTriggers = {
  // Trigger when test starts (user is engaged)
  onTestStart: () => {
    console.log('🌍 Preloader: Triggered by test start');
    preloadDuringIdle();
  },

  // Trigger when user answers questions (indicates engagement)
  onUserInteraction: () => {
    if (!isCountryDataReady()) {
      console.log('🌍 Preloader: Triggered by user interaction');
      preloadDuringIdle();
    }
  },

  // Trigger when approaching test completion
  onTestProgress: (progress: number) => {
    // Start preloading when 50% complete
    if (progress >= 0.5 && !isCountryDataReady()) {
      console.log('🌍 Preloader: Triggered by test progress (50%+)');
      preloadCountryData();
    }
  },

  // Trigger when timer shows low time remaining
  onLowTimeRemaining: (secondsRemaining: number) => {
    // Start preloading when 2 minutes or less remaining
    if (secondsRemaining <= 120 && !isCountryDataReady()) {
      console.log('🌍 Preloader: Triggered by low time remaining');
      preloadCountryData();
    }
  },

  // Trigger on app initialization (low priority)
  onAppInit: () => {
    // Delay to not impact initial load
    setTimeout(() => {
      console.log('🌍 Preloader: Triggered by app init (delayed)');
      preloadDuringIdle();
    }, 3000);
  }
};

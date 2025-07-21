/**
 * Tags Tabs Preloader
 * Preload popular and newest tags for tab interface
 */

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let popularTagsCache: string[] | null = null;
let newestTagsCache: string[] | null = null;
let cacheTimestamp = 0;
let isPreloading = false;
let preloadPromise: Promise<{ popular: string[]; newest: string[] }> | null = null;

/**
 * Load tags data for tabs
 */
async function loadTagsTabsData(): Promise<{ popular: string[]; newest: string[] }> {
  try {
    // Dynamic import to avoid circular dependencies
    const { TagsService } = await import('../../../../backend');
    
    // Load both popular and newest tags in parallel
    const [popularResult, newestResult] = await Promise.all([
      TagsService.getPopularTags(15),
      TagsService.getNewestTags(15)
    ]);

    const popular = popularResult.data || [];
    const newest = newestResult.data || [];

    console.log(`🏷️ Tags Tabs Preloader: Loaded ${popular.length} popular, ${newest.length} newest tags`);
    return { popular, newest };

  } catch (error) {
    console.warn('🏷️ Tags Tabs Preloader: Failed to load data:', error);
    return { popular: [], newest: [] };
  }
}

/**
 * Preload tags tabs data
 */
export async function preloadTagsTabsData(): Promise<{ popular: string[]; newest: string[] }> {
  const now = Date.now();
  
  // Return cached data if valid
  if (popularTagsCache && newestTagsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('🏷️ Tags Tabs Preloader: Using cached data');
    return { popular: popularTagsCache, newest: newestTagsCache };
  }

  // Return existing promise if already preloading
  if (preloadPromise) {
    console.log('🏷️ Tags Tabs Preloader: Waiting for existing preload');
    return preloadPromise;
  }

  // Start preloading
  console.log('🏷️ Tags Tabs Preloader: Starting preload');
  isPreloading = true;
  
  preloadPromise = loadTagsTabsData()
    .then(({ popular, newest }) => {
      // Cache the result
      popularTagsCache = popular;
      newestTagsCache = newest;
      cacheTimestamp = now;
      isPreloading = false;
      preloadPromise = null;
      
      console.log(`🏷️ Tags Tabs Preloader: Successfully preloaded data`);
      return { popular, newest };
    })
    .catch(error => {
      console.error('🏷️ Tags Tabs Preloader: Failed to preload:', error);
      isPreloading = false;
      preloadPromise = null;
      
      // Return empty data on error
      const fallbackData = { popular: [], newest: [] };
      popularTagsCache = fallbackData.popular;
      newestTagsCache = fallbackData.newest;
      cacheTimestamp = now;
      return fallbackData;
    });

  return preloadPromise;
}

/**
 * Get instantly available tags tabs data
 */
export function getInstantTagsTabsData(): { popular: string[]; newest: string[] } {
  const now = Date.now();
  
  // Return cached data if valid
  if (popularTagsCache && newestTagsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return { popular: popularTagsCache, newest: newestTagsCache };
  }
  
  // Start background preload if not already running
  if (!isPreloading) {
    preloadTagsTabsData();
  }
  
  // Return empty data while loading
  return { popular: [], newest: [] };
}

/**
 * Check if tags tabs data is ready
 */
export function isTagsTabsDataReady(): boolean {
  const now = Date.now();
  return popularTagsCache !== null && newestTagsCache !== null && (now - cacheTimestamp) < CACHE_DURATION;
}

/**
 * Clear cache
 */
export function clearTagsTabsCache(): void {
  popularTagsCache = null;
  newestTagsCache = null;
  cacheTimestamp = 0;
  preloadPromise = null;
  isPreloading = false;
  console.log('🏷️ Tags Tabs Preloader: Cache cleared');
}

/**
 * Force refresh data
 */
export function refreshTagsTabsData(): Promise<{ popular: string[]; newest: string[] }> {
  clearTagsTabsCache();
  return preloadTagsTabsData();
}

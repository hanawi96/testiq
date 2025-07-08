/**
 * Tags Admin Preloader
 * Optimized preloading for admin tags management interface
 */

// Cache configuration
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes for admin interface
let tagsCache: any[] | null = null;
let statsCache: any | null = null;
let cacheTimestamp = 0;
let isPreloading = false;
let preloadPromise: Promise<{ tags: any[]; stats: any }> | null = null;

/**
 * Smart tags data loader for admin interface
 */
async function loadAdminTagsData(): Promise<{ tags: any[]; stats: any }> {
  try {
    // Dynamic import to avoid circular dependencies
    const { TagsService } = await import('../../../../backend');
    
    // Load both tags and stats in parallel
    const [tagsResult, statsResult] = await Promise.all([
      TagsService.getTags(1, 50), // Load first 50 tags for admin
      TagsService.getTagStats()
    ]);
    
    const tags = tagsResult.data?.tags || [];
    const stats = statsResult.data || { total: 0, active: 0, inactive: 0, mostUsed: [] };
    
    console.log(`🏷️ Admin Tags Preloader: Loaded ${tags.length} tags and stats`);
    return { tags, stats };
    
  } catch (error) {
    console.warn('🏷️ Admin Tags Preloader: Failed to load data:', error);
    return { 
      tags: [], 
      stats: { total: 0, active: 0, inactive: 0, mostUsed: [] }
    };
  }
}

/**
 * Preload tags data for admin interface
 */
export async function preloadAdminTagsData(): Promise<{ tags: any[]; stats: any }> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (tagsCache && statsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('🏷️ Admin Tags Preloader: Using cached data');
    return { tags: tagsCache, stats: statsCache };
  }
  
  // Return existing promise if already preloading
  if (isPreloading && preloadPromise) {
    console.log('🏷️ Admin Tags Preloader: Waiting for existing preload');
    return preloadPromise;
  }
  
  // Start preloading
  console.log('🏷️ Admin Tags Preloader: Starting admin tags data preload');
  isPreloading = true;
  
  preloadPromise = loadAdminTagsData()
    .then(({ tags, stats }) => {
      // Cache the result
      tagsCache = tags;
      statsCache = stats;
      cacheTimestamp = now;
      isPreloading = false;
      preloadPromise = null;
      
      console.log(`🏷️ Admin Tags Preloader: Successfully preloaded ${tags.length} tags`);
      return { tags, stats };
    })
    .catch(error => {
      console.error('🏷️ Admin Tags Preloader: Failed to preload tags:', error);
      isPreloading = false;
      preloadPromise = null;
      
      // Return empty data on error
      const fallbackData = { 
        tags: [], 
        stats: { total: 0, active: 0, inactive: 0, mostUsed: [] }
      };
      tagsCache = fallbackData.tags;
      statsCache = fallbackData.stats;
      cacheTimestamp = now;
      return fallbackData;
    });

  return preloadPromise;
}

/**
 * Get instantly available admin tags data
 * Returns cached data immediately or empty fallback
 */
export function getInstantAdminTagsData(): { tags: any[]; stats: any } {
  const now = Date.now();
  
  // Return cached data if valid
  if (tagsCache && statsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return { tags: tagsCache, stats: statsCache };
  }
  
  // Start background preload if not already running
  if (!isPreloading) {
    preloadAdminTagsData();
  }
  
  // Return empty fallback
  return { 
    tags: [], 
    stats: { total: 0, active: 0, inactive: 0, mostUsed: [] }
  };
}

/**
 * Check if admin tags data is ready (cached and fresh)
 */
export function isAdminTagsDataReady(): boolean {
  const now = Date.now();
  return tagsCache !== null && statsCache !== null && (now - cacheTimestamp) < CACHE_DURATION;
}

/**
 * Invalidate admin tags cache
 * Call this after creating, updating, or deleting tags
 */
export function invalidateAdminTagsCache(): void {
  console.log('🏷️ Admin Tags Preloader: Invalidating cache');
  tagsCache = null;
  statsCache = null;
  cacheTimestamp = 0;
  
  // Start fresh preload
  if (!isPreloading) {
    preloadAdminTagsData();
  }
}

/**
 * Preload triggers for admin interface interactions
 */
export const adminTagsPreloadTriggers = {
  /**
   * Trigger when user navigates to tags admin page
   */
  onPageLoad: () => {
    preloadAdminTagsData();
  },

  /**
   * Trigger when user hovers over tags menu item
   */
  onMenuHover: () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preloadAdminTagsData(), { timeout: 2000 });
    } else {
      setTimeout(() => preloadAdminTagsData(), 100);
    }
  },

  /**
   * Trigger when user opens create/edit modal
   */
  onModalOpen: () => {
    if (!isAdminTagsDataReady()) {
      preloadAdminTagsData();
    }
  },

  /**
   * Trigger after successful tag operations
   */
  onTagOperation: () => {
    // Invalidate cache and preload fresh data
    invalidateAdminTagsCache();
  }
};

/**
 * Smart cache warming for admin interface
 * Call this on admin app initialization
 */
export function warmAdminTagsCache(): void {
  // Warm cache with low priority after initial page load
  setTimeout(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preloadAdminTagsData(), { timeout: 5000 });
    } else {
      setTimeout(() => preloadAdminTagsData(), 3000);
    }
  }, 2000);
}

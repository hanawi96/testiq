/**
 * Tags Preloader Utility
 * Intelligent preloading strategy for tags data to eliminate loading delays
 * Pattern based on categories-preloader.ts and authors-preloader.ts
 */

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let tagsCache: string[] | null = null;
let cacheTimestamp = 0;
let isPreloading = false;
let preloadPromise: Promise<string[]> | null = null;

/**
 * Instant fallback tags for immediate display
 * Common tags that are likely to exist in most systems
 */
const INSTANT_TAGS: string[] = [
  'JavaScript',
  'TypeScript',
  'React',
  'Vue',
  'Angular',
  'Node.js',
  'Python',
  'Tutorial',
  'Guide',
  'Tips',
  'Best Practices',
  'Performance',
  'IQ Test',
  'Học tập',
  'Kiến thức',
  'Hướng dẫn',
  'Thủ thuật',
  'Phát triển',
  'Công nghệ',
  'Web Development',
  'Security',
  'Testing',
  'Development',
  'Frontend',
  'Backend',
  'Database',
  'API',
  'Web Development'
];

/**
 * Smart tags data loader with fallback strategies
 */
async function loadTagsData(): Promise<string[]> {
  try {
    // Dynamic import to avoid circular dependencies
    const { ArticlesService } = await import('../../../../backend');
    const tags = await ArticlesService.getTags();

    if (tags && tags.length > 0) {
      console.log(`🏷️ Tags Preloader: Loaded ${tags.length} tags from database`);
      return tags;
    } else {
      console.log('🏷️ Tags Preloader: No tags in database, using instant fallback');
      return INSTANT_TAGS;
    }
  } catch (error) {
    console.warn('🏷️ Tags Preloader: Database failed, using instant fallback:', error);
    return INSTANT_TAGS;
  }
}

/**
 * Preload tags data in background
 * Safe to call multiple times - will only preload once
 */
export async function preloadTagsData(): Promise<string[]> {
  // Return cached data if valid
  const now = Date.now();
  if (tagsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('🏷️ Tags Preloader: Using cached tags');
    return tagsCache;
  }

  // Return existing promise if already preloading
  if (preloadPromise) {
    console.log('🏷️ Tags Preloader: Waiting for existing preload');
    return preloadPromise;
  }

  // Start preloading
  console.log('🏷️ Tags Preloader: Starting tags data preload');
  isPreloading = true;
  
  preloadPromise = loadTagsData()
    .then(tags => {
      // Cache the result
      tagsCache = tags;
      cacheTimestamp = now;
      isPreloading = false;
      preloadPromise = null;
      
      console.log(`🏷️ Tags Preloader: Successfully preloaded ${tags.length} tags`);
      return tags;
    })
    .catch(error => {
      console.error('🏷️ Tags Preloader: Failed to preload tags:', error);
      isPreloading = false;
      preloadPromise = null;
      
      // Return instant fallback on error
      tagsCache = INSTANT_TAGS;
      cacheTimestamp = now;
      return INSTANT_TAGS;
    });

  return preloadPromise;
}

/**
 * Get instantly available tags data
 * Returns cached data immediately or instant fallback
 */
export function getInstantTagsData(): string[] {
  const now = Date.now();
  
  // Return cached data if valid
  if (tagsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return tagsCache;
  }
  
  // Return instant fallback while preloading in background
  if (!isPreloading) {
    preloadTagsData(); // Start background preload
  }
  
  return INSTANT_TAGS;
}

/**
 * Check if tags data is ready (cached and fresh)
 */
export function isTagsDataReady(): boolean {
  const now = Date.now();
  return tagsCache !== null && (now - cacheTimestamp) < CACHE_DURATION;
}

/**
 * Clear tags cache (useful for testing or forced refresh)
 */
export function clearTagsCache(): void {
  tagsCache = null;
  cacheTimestamp = 0;
  preloadPromise = null;
  isPreloading = false;
  console.log('🏷️ Tags Preloader: Cache cleared');
}

/**
 * Force refresh tags data cache
 */
export function refreshTagsData(): Promise<string[]> {
  tagsCache = null;
  cacheTimestamp = 0;
  preloadPromise = null;
  isPreloading = false;
  return preloadTagsData();
}

/**
 * Preload triggers for different user interactions
 */
export const tagsPreloadTriggers = {
  /**
   * Trigger when user hovers over edit tags button
   */
  onEditHover: () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preloadTagsData(), { timeout: 2000 });
    } else {
      setTimeout(() => preloadTagsData(), 100);
    }
  },

  /**
   * Trigger when user interacts with tags
   */
  onUserInteraction: () => {
    if (!isTagsDataReady()) {
      preloadTagsData();
    }
  },

  /**
   * Trigger on app initialization (low priority)
   */
  onAppInit: () => {
    setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => preloadTagsData(), { timeout: 5000 });
      } else {
        setTimeout(() => preloadTagsData(), 3000);
      }
    }, 3000);
  }
};

/**
 * Get preloader status for debugging
 */
export function getTagsPreloaderStatus() {
  return {
    isPreloading,
    isCached: tagsCache !== null,
    cacheAge: tagsCache ? Date.now() - cacheTimestamp : 0,
    cacheSize: tagsCache?.length || 0
  };
}

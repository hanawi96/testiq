import type { AuthorOption } from '../../../../backend';

// Cache configuration
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let authorsCache: AuthorOption[] | null = null;
let cacheTimestamp = 0;
let preloadPromise: Promise<AuthorOption[]> | null = null;
let isPreloading = false;

// Instant fallback authors for immediate response
const INSTANT_AUTHORS: AuthorOption[] = [
  {
    id: 'instant-1',
    full_name: 'Admin',
    email: 'admin@example.com',
    article_count: 0
  },
  {
    id: 'instant-2',
    full_name: 'Editor',
    email: 'editor@example.com',
    article_count: 0
  },
  {
    id: 'instant-3',
    full_name: 'Author',
    email: 'author@example.com',
    article_count: 0
  },
  {
    id: 'instant-4',
    full_name: 'Contributor',
    email: 'contributor@example.com',
    article_count: 0
  },
  {
    id: 'instant-5',
    full_name: 'Guest Writer',
    email: 'guest@example.com',
    article_count: 0
  }
];

/**
 * Smart authors data loader with fallback strategies
 */
async function loadAuthorsData(): Promise<AuthorOption[]> {
  try {
    // Dynamic import to avoid circular dependencies
    const { UserProfilesService } = await import('../../../../backend');
    const result = await UserProfilesService.getAuthorOptions();
    
    if (result.data && result.data.length > 0) {
      console.log('👤 Authors Preloader: Loaded from database');
      return result.data;
    }
  } catch (error) {
    console.warn('👤 Authors Preloader: Database failed, using instant fallback:', error);
  }

  // Final fallback to instant authors
  console.log('👤 Authors Preloader: Using instant fallback authors');
  return INSTANT_AUTHORS;
}

/**
 * Preload authors data in background
 * Safe to call multiple times - will only preload once
 */
export async function preloadAuthorsData(): Promise<AuthorOption[]> {
  // Return cached data if valid
  const now = Date.now();
  if (authorsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('👤 Authors Preloader: Using cached authors');
    return authorsCache;
  }

  // Return existing promise if already preloading
  if (preloadPromise) {
    console.log('👤 Authors Preloader: Waiting for existing preload');
    return preloadPromise;
  }

  // Start preloading
  console.log('👤 Authors Preloader: Starting authors data preload');
  isPreloading = true;
  
  preloadPromise = loadAuthorsData()
    .then(authors => {
      // Cache the result
      authorsCache = authors;
      cacheTimestamp = now;
      isPreloading = false;
      preloadPromise = null;
      
      console.log(`👤 Authors Preloader: Successfully preloaded ${authors.length} authors`);
      return authors;
    })
    .catch(error => {
      console.error('👤 Authors Preloader: Failed to preload authors:', error);
      isPreloading = false;
      preloadPromise = null;
      
      // Return instant fallback on error
      authorsCache = INSTANT_AUTHORS;
      cacheTimestamp = now;
      return INSTANT_AUTHORS;
    });

  return preloadPromise;
}

/**
 * Get instantly available authors data
 * Returns cached data immediately or instant fallback
 */
export function getInstantAuthorsData(): AuthorOption[] {
  const now = Date.now();
  
  // Return cached data if valid
  if (authorsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return authorsCache;
  }
  
  // Return instant fallback while preloading in background
  if (!isPreloading) {
    preloadAuthorsData(); // Start background preload
  }
  
  return INSTANT_AUTHORS;
}

/**
 * Check if authors data is ready (cached and fresh)
 */
export function isAuthorsDataReady(): boolean {
  const now = Date.now();
  return authorsCache !== null && (now - cacheTimestamp) < CACHE_DURATION;
}

/**
 * Force refresh authors data cache
 */
export function refreshAuthorsData(): Promise<AuthorOption[]> {
  authorsCache = null;
  cacheTimestamp = 0;
  preloadPromise = null;
  isPreloading = false;
  return preloadAuthorsData();
}

/**
 * Preload triggers for different user interactions
 */
export const authorsPreloadTriggers = {
  /**
   * Trigger when user hovers over edit author button
   */
  onEditHover: () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preloadAuthorsData(), { timeout: 2000 });
    } else {
      setTimeout(() => preloadAuthorsData(), 100);
    }
  },

  /**
   * Trigger when user interacts with authors
   */
  onUserInteraction: () => {
    if (!isAuthorsDataReady()) {
      preloadAuthorsData();
    }
  },

  /**
   * Trigger on app initialization (low priority)
   */
  onAppInit: () => {
    setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => preloadAuthorsData(), { timeout: 5000 });
      } else {
        setTimeout(() => preloadAuthorsData(), 3000);
      }
    }, 3000);
  }
};

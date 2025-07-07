import type { Category } from '../../backend';

// Cache configuration
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let categoriesCache: Category[] | null = null;
let cacheTimestamp = 0;
let preloadPromise: Promise<Category[]> | null = null;
let isPreloading = false;

// Instant fallback categories for immediate response
const INSTANT_CATEGORIES: Category[] = [
  {
    id: 'instant-1',
    name: 'Tâm lý học',
    slug: 'tam-ly-hoc',
    description: 'Các bài viết về tâm lý học',
    status: 'active',
    article_count: 0,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    color: '#3B82F6'
  },
  {
    id: 'instant-2', 
    name: 'Trí tuệ nhân tạo',
    slug: 'tri-tue-nhan-tao',
    description: 'Các bài viết về AI và machine learning',
    status: 'active',
    article_count: 0,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    color: '#10B981'
  },
  {
    id: 'instant-3',
    name: 'Giáo dục',
    slug: 'giao-duc',
    description: 'Các bài viết về giáo dục và học tập',
    status: 'active',
    article_count: 0,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    color: '#F59E0B'
  },
  {
    id: 'instant-4',
    name: 'Khoa học',
    slug: 'khoa-hoc',
    description: 'Các bài viết về khoa học và nghiên cứu',
    status: 'active',
    article_count: 0,
    display_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    color: '#8B5CF6'
  },
  {
    id: 'instant-5',
    name: 'Công nghệ',
    slug: 'cong-nghe',
    description: 'Các bài viết về công nghệ mới',
    status: 'active',
    article_count: 0,
    display_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    color: '#EF4444'
  }
];

/**
 * Smart categories data loader with fallback strategies
 */
async function loadCategoriesData(): Promise<Category[]> {
  try {
    // Dynamic import to avoid circular dependencies
    const { CategoriesService } = await import('../../backend/admin/categories-service');
    const result = await CategoriesService.getCategories();
    
    if (result.data && result.data.length > 0) {
      console.log('📂 Categories Preloader: Loaded from database');
      return result.data;
    }
  } catch (error) {
    console.warn('📂 Categories Preloader: Database failed, using instant fallback:', error);
  }

  // Final fallback to instant categories
  console.log('📂 Categories Preloader: Using instant fallback categories');
  return INSTANT_CATEGORIES;
}

/**
 * Preload categories data in background
 * Safe to call multiple times - will only preload once
 */
export async function preloadCategoriesData(): Promise<Category[]> {
  // Return cached data if valid
  const now = Date.now();
  if (categoriesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('📂 Categories Preloader: Using cached categories');
    return categoriesCache;
  }

  // Return existing promise if already preloading
  if (preloadPromise) {
    console.log('📂 Categories Preloader: Waiting for existing preload');
    return preloadPromise;
  }

  // Start preloading
  console.log('📂 Categories Preloader: Starting categories data preload');
  isPreloading = true;
  
  preloadPromise = loadCategoriesData()
    .then(categories => {
      // Cache the result
      categoriesCache = categories;
      cacheTimestamp = now;
      isPreloading = false;
      preloadPromise = null;
      
      console.log(`📂 Categories Preloader: Successfully preloaded ${categories.length} categories`);
      return categories;
    })
    .catch(error => {
      console.error('📂 Categories Preloader: Failed to preload categories:', error);
      isPreloading = false;
      preloadPromise = null;
      
      // Return instant fallback on error
      categoriesCache = INSTANT_CATEGORIES;
      cacheTimestamp = now;
      return INSTANT_CATEGORIES;
    });

  return preloadPromise;
}

/**
 * Get instantly available categories data
 * Returns cached data immediately or instant fallback
 */
export function getInstantCategoriesData(): Category[] {
  const now = Date.now();
  
  // Return cached data if valid
  if (categoriesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return categoriesCache;
  }
  
  // Return instant fallback while preloading in background
  if (!isPreloading) {
    preloadCategoriesData(); // Start background preload
  }
  
  return INSTANT_CATEGORIES;
}

/**
 * Check if categories data is ready (cached and fresh)
 */
export function isCategoriesDataReady(): boolean {
  const now = Date.now();
  return categoriesCache !== null && (now - cacheTimestamp) < CACHE_DURATION;
}

/**
 * Force refresh categories data cache
 */
export function refreshCategoriesData(): Promise<Category[]> {
  categoriesCache = null;
  cacheTimestamp = 0;
  preloadPromise = null;
  isPreloading = false;
  return preloadCategoriesData();
}

/**
 * Preload triggers for different user interactions
 */
export const categoriesPreloadTriggers = {
  /**
   * Trigger when user hovers over edit category button
   */
  onEditHover: () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preloadCategoriesData(), { timeout: 2000 });
    } else {
      setTimeout(() => preloadCategoriesData(), 100);
    }
  },

  /**
   * Trigger when user interacts with categories
   */
  onUserInteraction: () => {
    if (!isCategoriesDataReady()) {
      preloadCategoriesData();
    }
  },

  /**
   * Trigger on app initialization (low priority)
   */
  onAppInit: () => {
    setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => preloadCategoriesData(), { timeout: 5000 });
      } else {
        setTimeout(() => preloadCategoriesData(), 3000);
      }
    }, 3000);
  }
};

/**
 * Unified Preload Manager
 * Coordinates all preloading strategies for optimal performance
 */

import { preloadCategoriesData, isCategoriesDataReady } from './categories-preloader';
import { preloadAuthorsData, isAuthorsDataReady } from './authors-preloader';
import { preloadTagsData, isTagsDataReady } from './tags-preloader';
import { preloadTagsTabsData, isTagsTabsDataReady } from './tags-tabs-preloader';

/**
 * Preload all critical data for article editing
 * Returns immediately with instant data, continues loading in background
 */
export async function preloadArticleEditData() {
  console.log('🚀 Preload Manager: Starting article edit data preload');
  
  // Start all preloads in parallel (non-blocking)
  const preloadPromises = [
    preloadCategoriesData(),
    preloadAuthorsData(),
    preloadTagsData(),
    preloadTagsTabsData()
  ];

  // Don't wait for completion - let them load in background
  Promise.all(preloadPromises)
    .then(() => {
      console.log('✅ Preload Manager: All article edit data preloaded successfully');
    })
    .catch(error => {
      console.warn('⚠️ Preload Manager: Some preloads failed:', error);
    });

  // Return immediately - components can use instant data
  return {
    categoriesReady: isCategoriesDataReady(),
    authorsReady: isAuthorsDataReady(),
    tagsReady: isTagsDataReady()
  };
}

/**
 * Check if all critical data is ready
 */
export function isArticleEditDataReady(): boolean {
  return isCategoriesDataReady() && isAuthorsDataReady() && isTagsDataReady() && isTagsTabsDataReady();
}

/**
 * Preload triggers for different scenarios
 */
export const preloadTriggers = {
  /**
   * Trigger when user navigates to admin articles section
   */
  onAdminArticlesNavigation: () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preloadArticleEditData(), { timeout: 1000 });
    } else {
      setTimeout(() => preloadArticleEditData(), 100);
    }
  },

  /**
   * Trigger when user hovers over "Edit" button
   */
  onEditButtonHover: () => {
    if (!isArticleEditDataReady()) {
      preloadArticleEditData();
    }
  },

  /**
   * Trigger when user clicks "Create Article" button
   */
  onCreateArticleClick: () => {
    preloadArticleEditData();
  },

  /**
   * Trigger on app initialization (low priority)
   */
  onAppInit: () => {
    setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => preloadArticleEditData(), { timeout: 5000 });
      } else {
        setTimeout(() => preloadArticleEditData(), 3000);
      }
    }, 2000);
  }
};

/**
 * Smart preloading based on user behavior
 */
export class SmartPreloader {
  private static hasPreloaded = false;
  private static preloadTimeout: NodeJS.Timeout | null = null;

  /**
   * Intelligent preload based on user interaction patterns
   */
  static triggerSmartPreload(trigger: 'navigation' | 'hover' | 'click' | 'init') {
    // Avoid duplicate preloads
    if (this.hasPreloaded && isArticleEditDataReady()) {
      return;
    }

    // Clear existing timeout
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
    }

    // Different strategies based on trigger
    switch (trigger) {
      case 'click':
        // Immediate preload on click
        preloadArticleEditData();
        this.hasPreloaded = true;
        break;
        
      case 'hover':
        // Quick preload on hover
        this.preloadTimeout = setTimeout(() => {
          preloadArticleEditData();
          this.hasPreloaded = true;
        }, 200);
        break;
        
      case 'navigation':
        // Delayed preload on navigation
        this.preloadTimeout = setTimeout(() => {
          preloadArticleEditData();
          this.hasPreloaded = true;
        }, 500);
        break;
        
      case 'init':
        // Low priority preload on app init
        this.preloadTimeout = setTimeout(() => {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              preloadArticleEditData();
              this.hasPreloaded = true;
            }, { timeout: 5000 });
          } else {
            setTimeout(() => {
              preloadArticleEditData();
              this.hasPreloaded = true;
            }, 3000);
          }
        }, 2000);
        break;
    }
  }

  /**
   * Reset preload state (useful for testing or cache invalidation)
   */
  static reset() {
    this.hasPreloaded = false;
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
      this.preloadTimeout = null;
    }
  }
}

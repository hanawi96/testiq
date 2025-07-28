/**
 * Utils Main Index
 * Centralized exports for all utility modules
 */

// Admin utilities
export * from './admin';

// Testing utilities
export * from './testing';

// Performance utilities
export * from './performance';

// SEO utilities
export * from './seo';

// Lazy load heavy utilities - only needed when actually used
export const loadImageOptimization = () => import('./image-optimization');
export const loadSlugGenerator = () => import('./slug-generator');
export const loadTagProcessing = () => import('./tag-processing');

// All imports have been updated to use the new structure
// Legacy exports removed - use specific imports instead

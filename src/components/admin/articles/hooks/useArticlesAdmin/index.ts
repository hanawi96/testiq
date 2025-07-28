/**
 * ARTICLES ADMIN MODULES
 * Modular components for the unified articles admin hook
 */

export * from './types';
export * from './reducer';
export * from './operations';

// Lazy load optimistic updates - only needed for editing
export const loadOptimisticUpdates = () => import('./optimistic');

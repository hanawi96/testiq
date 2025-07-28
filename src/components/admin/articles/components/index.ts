/**
 * Article Components
 * Centralized exports for reusable display components
 */

export { default as CategoryDisplay } from './CategoryDisplay';

// Lazy load heavy components - only needed for editing
export const loadCategoryDropdown = () => import('./CategoryDropdown');
export const loadAuthorDropdown = () => import('./AuthorDropdown');

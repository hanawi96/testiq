/**
 * Admin Articles - LIST ONLY
 * ONLY exports components needed for articles list page
 * Editors are imported separately to avoid bundle bloat
 */

// Main component
export { default as AdminArticles } from './AdminArticles';

// Essential components for list view only
export { default as ArticlesStats } from './components/ArticlesStats';
export { default as ArticlesTable } from './components/ArticlesTable';
export { default as ArticlesFilters } from './components/ArticlesFilters';

// NOTE: Editors, Modals, Heavy components are imported separately
// to avoid loading them in the articles list bundle
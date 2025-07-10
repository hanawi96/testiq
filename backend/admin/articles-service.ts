/**
 * @deprecated This file has been refactored. Use import from './articles' instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 */

// Re-export everything from the new articles module
export * from './articles';

// For backward compatibility, also export with original names
export { ArticlesService } from './articles';
export type {
  Article,
  ArticleStats,
  ArticlesFilters,
  ArticlesListResponse,
  CreateArticleData,
  LinkAnalysis
} from './articles';
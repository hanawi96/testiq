/**
 * Articles Module - Public API
 * Barrel file để export tất cả public APIs của articles module
 */

// Export service class
export { ArticlesService } from './service';

// Export all types
export type {
  Article,
  ArticleStats,
  ArticlesFilters,
  ArticlesListResponse,
  CreateArticleData,
  LinkAnalysis,
  RelatedData
} from './types';

// Export queries class (for advanced usage)
export { ArticleQueries } from './queries';

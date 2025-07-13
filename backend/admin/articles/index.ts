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

// Export validation utilities
export { ValidationUtils, ERROR_MESSAGES } from './validation';

// Export processing utilities
export { ProcessingUtils } from './processing';

// Export relationships utilities
export { RelationshipsUtils } from './relationships';

// Export bulk operations utilities
export { BulkOperationsUtils } from './bulk-operations';

// Export performance utilities (SIMPLIFIED)
export { PerformanceUtils, SimpleTimer } from './performance';

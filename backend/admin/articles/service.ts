/**
 * Articles Module - Business Logic Service (PERFORMANCE OPTIMIZED & REFINED)
 * Đảm bảo: Logic cũ, UI giữ nguyên, tối ưu code, best practice, cực dễ maintain.
 */

import { ArticleQueries } from './queries';
import type {
  Article,
  ArticleStats,
  ArticlesFilters,
  ArticlesListResponse,
  CreateArticleData,
  LinkAnalysis
} from './types';

import { ValidationUtils, ERROR_MESSAGES } from './validation';
import { ProcessingUtils } from './processing';
import { RelationshipsUtils } from './relationships';
import { BulkOperationsUtils } from './bulk-operations';

// ===== REFACTORED UTILITIES =====

const nowISO = () => new Date().toISOString();

/**
 * REUSABLE: Create paginated response structure
 */
function createPaginatedResponse(articles: any[], count: number, page: number, limit: number): ArticlesListResponse {
  const totalPages = Math.ceil(count / limit);
  return {
    articles,
    total: count,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * GENERIC: Service wrapper để eliminate duplicate try-catch patterns
 */
async function serviceWrapper<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  fallbackError?: string,
  shouldInvalidateCache = false
): Promise<{ data: T | null; error: any }> {
  try {
    const result = await operation();
    if (result.error) return { data: null, error: result.error };
    if (!result.data && fallbackError) return { data: null, error: new Error(fallbackError) };

    if (shouldInvalidateCache && !result.error) {
      ArticleQueries.invalidateArticlesCacheOptimized();
    }

    return result;
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * OPTIMIZED: Proper backend cache invalidation
 */
function invalidateCache() {
  ArticleQueries.invalidateArticlesCacheOptimized();
}

export class ArticlesService {

  // ---------------- GETTERS ----------------

  /** REFACTORED: Get articles with pagination and filters - Unified Pattern */
  static async getArticles(
    page: number = 1,
    limit: number = 20,
    filters: ArticlesFilters = {}
  ): Promise<{ data: ArticlesListResponse | null; error: any }> {
    return serviceWrapper(async () => {
      const { data: articles, error, count } = await ArticleQueries.getArticles(page, limit, filters);
      if (error || !articles) {
        return { data: null, error: error || new Error('Không thể lấy danh sách bài viết') };
      }

      return {
        data: createPaginatedResponse(articles, count || 0, page, limit),
        error: null
      };
    });
  }

  // ===== REFACTORED GETTERS - Compact & Reusable =====

  static async getStats(): Promise<{ data: ArticleStats | null; error: any }> {
    return serviceWrapper(() => ArticleQueries.getArticlesStats());
  }

  static async getArticleById(articleId: string): Promise<{ data: Article | null; error: any }> {
    return serviceWrapper(
      () => ArticleQueries.getArticleById(articleId),
      ERROR_MESSAGES.ARTICLE_NOT_FOUND
    );
  }

  static async getArticleBySlug(slug: string): Promise<{ data: Article | null; error: any }> {
    return serviceWrapper(
      () => ArticleQueries.getArticleBySlug(slug),
      ERROR_MESSAGES.ARTICLE_NOT_FOUND
    );
  }

  static async getArticleForEdit(articleId: string): Promise<{ data: Article | null; error: any }> {
    return serviceWrapper<Article>(
      () => ArticleQueries.getArticleForEditOptimized(articleId),
      ERROR_MESSAGES.ARTICLE_NOT_FOUND
    );
  }

  // ---------------- CREATE / UPDATE ----------------

  // ===== REFACTORED CREATE/UPDATE - Compact & Efficient =====

  static async createArticle(
    articleData: CreateArticleData,
    authorId: string,
    isAutosave: boolean = false
  ): Promise<{ data: Article | null; error: any }> {
    return serviceWrapper(async () => {
      const validation = ValidationUtils.validateArticleData(articleData, isAutosave);
      if (!validation.isValid) return { data: null, error: new Error(validation.error) };

      const { processedData } = await ProcessingUtils.processArticleData(articleData, authorId);
      return ArticleQueries.createArticle(processedData);
    }, ERROR_MESSAGES.ARTICLE_CREATE_FAILED, true);
  }

  static async updateArticle(
    articleId: string,
    updateData: Partial<CreateArticleData>
  ): Promise<{ data: Article | null; error: any }> {
    return serviceWrapper(async () => {
      const { categories, tags, ...articleUpdateData } = updateData;
      const processedUpdateData = await ProcessingUtils.processUpdateData(articleUpdateData, articleId);
      const result = await ArticleQueries.updateArticle(articleId, processedUpdateData);

      if (result.error || !result.data) return result;

      // Parallel relationship updates if needed
      if (categories !== undefined || tags !== undefined) {
        await Promise.all([
          categories !== undefined ? RelationshipsUtils.updateCategories(articleId, [...categories]) : undefined,
          tags !== undefined ? RelationshipsUtils.updateTags(articleId, [...tags]) : undefined,
        ].filter(Boolean));
      }

      return result;
    }, ERROR_MESSAGES.ARTICLE_UPDATE_FAILED, true);
  }

  static async updateStatus(
    articleId: string,
    status: 'published' | 'draft' | 'archived'
  ): Promise<{ data: Article | null; error: any }> {
    const updateData: any = { status, updated_at: nowISO() };
    if (status === 'published') updateData.published_at = nowISO();

    return serviceWrapper(
      () => ArticleQueries.updateArticle(articleId, updateData),
      ERROR_MESSAGES.STATUS_UPDATE_FAILED,
      true
    );
  }

  // ===== REFACTORED BULK & RELATIONSHIP - Compact & Consistent =====

  static async bulkUpdateStatus(
    articleIds: string[],
    status: 'published' | 'draft' | 'archived'
  ): Promise<{ data: number; error: any }> {
    const result = await BulkOperationsUtils.bulkUpdateStatus(articleIds, status);
    if (!result.error) invalidateCache();
    return result;
  }

  static async deleteArticle(articleId: string): Promise<{ error: any }> {
    return serviceWrapper(async () => {
      const result = await ArticleQueries.deleteArticle(articleId);
      return { data: true, error: result.error };
    }, undefined, true).then(result => ({ error: result.error }));
  }

  static async updateTags(articleId: string, tags: string[]): Promise<{ data?: { tags: any[], tag_names: string[] }; error: any }> {
    const result = await RelationshipsUtils.updateTags(articleId, tags);
    if (!result.error) invalidateCache();
    return result;
  }

  static async updateAuthorById(articleId: string, authorId: string): Promise<{ error: any }> {
    const result = await RelationshipsUtils.updateAuthorById(articleId, authorId);
    if (!result.error) invalidateCache();
    return result;
  }

  static async updateTitle(articleId: string, title: string): Promise<{ error: any }> {
    const updateData = { title: title.trim(), updated_at: nowISO() };
    return serviceWrapper(async () => {
      const result = await ArticleQueries.updateArticle(articleId, updateData);
      return { data: true, error: result.error };
    }, undefined, true).then(result => ({ error: result.error }));
  }

  static async updateCategory(articleId: string, categoryId: string | null): Promise<{ error: any }> {
    const result = await RelationshipsUtils.updateCategory(articleId, categoryId);
    if (!result.error) invalidateCache();
    return result;
  }

  static async updateCategories(articleId: string, categoryIds: string[]): Promise<{ error: any }> {
    const result = await RelationshipsUtils.updateCategories(articleId, categoryIds);
    if (!result.error) invalidateCache();
    return result;
  }

  // ===== MISC/UTILS - Clean & Efficient =====

  static async validateSlug(slug: string, excludeId?: string): Promise<{ data: boolean; error: any }> {
    return ValidationUtils.validateSlug(slug, excludeId);
  }

  static async getTags(): Promise<string[]> {
    return RelationshipsUtils.getTags();
  }

  static async addSampleViewData(): Promise<{ success: boolean; error?: any }> {
    const result = await BulkOperationsUtils.addSampleViewData();
    if (result.success) invalidateCache();
    return result;
  }

  static async analyzeArticleLinks(articleId: string): Promise<{ data: LinkAnalysis | null; error: any }> {
    return serviceWrapper(async () => {
      const { data: article, error: fetchError } = await ArticleQueries.getArticleById(articleId);
      if (fetchError || !article) return { data: null, error: fetchError || new Error('Article not found') };

      const baseDomain = ProcessingUtils.getBaseDomain();
      const linkAnalysis = ProcessingUtils.analyzeContentLinks(article.content, baseDomain);

      const updateData = {
        internal_links: linkAnalysis.internal_links,
        external_links: linkAnalysis.external_links,
        updated_at: nowISO()
      };

      const { error: updateError } = await ArticleQueries.updateArticle(articleId, updateData);
      return { data: linkAnalysis, error: updateError };
    }, 'Failed to analyze article links', true);
  }


}

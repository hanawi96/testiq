/**
 * Articles Module - Business Logic Service (PERFORMANCE OPTIMIZED & REFINED)
 * Đảm bảo: Logic cũ, UI giữ nguyên, tối ưu code, best practice, cực dễ maintain.
 */

import { ArticleQueries } from './queries';
import { supabase } from '../../config/supabase';
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

// Utility helpers
const nowISO = () => new Date().toISOString();

function handleResult<T>(data: T | null, error: any, fallbackError: string): { data: T | null, error: any } {
  if (error) return { data: null, error };
  if (!data) return { data: null, error: new Error(fallbackError) };
  return { data, error: null };
}

// Invalidate articles cache everywhere with async option
function invalidateArticlesCacheAsync() {
  if (typeof window !== 'undefined' && (window as any).__articlesCache) {
    setTimeout(() => {
      delete (window as any).__articlesCache;
    }, 0);
  }
}

export class ArticlesService {

  // ---------------- GETTERS ----------------

  /** Get articles with pagination and filters - HIGH PERFORMANCE */
  static async getArticles(
    page: number = 1,
    limit: number = 20,
    filters: ArticlesFilters = {}
  ): Promise<{ data: ArticlesListResponse | null; error: any }> {
    try {
      const { data: articles, error, count } = await ArticleQueries.getArticles(page, limit, filters);
      if (error || !articles)
        return { data: null, error: error || new Error('Không thể lấy danh sách bài viết') };

      const totalPages = Math.ceil((count || 0) / limit);
      return {
        data: {
          articles,
          total: count || 0,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        error: null
      };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  static async getStats(): Promise<{ data: ArticleStats | null; error: any }> {
    try {
      return await ArticleQueries.getArticlesStats();
    } catch (err) {
      return { data: null, error: err };
    }
  }

  static async getArticleById(articleId: string): Promise<{ data: Article | null; error: any }> {
    try {
      const { data, error } = await ArticleQueries.getArticleById(articleId);
      return handleResult(data, error, ERROR_MESSAGES.ARTICLE_NOT_FOUND);
    } catch (err) {
      return { data: null, error: err };
    }
  }

  static async getArticleBySlug(slug: string): Promise<{ data: Article | null; error: any }> {
    try {
      const { data, error } = await ArticleQueries.getArticleBySlug(slug);
      return handleResult(data, error, ERROR_MESSAGES.ARTICLE_NOT_FOUND);
    } catch (err) {
      return { data: null, error: err };
    }
  }

  static async getArticleForEdit(articleId: string): Promise<{ data: Article | null; error: any }> {
    try {
      const { data, error } = await ArticleQueries.getArticleForEditOptimized(articleId);
      return handleResult(data, error, ERROR_MESSAGES.ARTICLE_NOT_FOUND);
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // ---------------- CREATE / UPDATE ----------------

  static async createArticle(
    articleData: CreateArticleData,
    authorId: string
  ): Promise<{ data: Article | null; error: any }> {
    try {
      const validation = ValidationUtils.validateArticleData(articleData);
      if (!validation.isValid) return { data: null, error: new Error(validation.error) };

      const { processedData } = await ProcessingUtils.processArticleData(articleData, authorId);
      const { data, error } = await ArticleQueries.createArticle(processedData);

      if (!error) invalidateArticlesCacheAsync();
      return handleResult(data, error, ERROR_MESSAGES.ARTICLE_CREATE_FAILED);
    } catch (err) {
      return { data: null, error: err };
    }
  }

  static async updateArticle(
    articleId: string,
    updateData: Partial<CreateArticleData>
  ): Promise<{ data: Article | null; error: any }> {
    try {
      const { categories, tags, ...articleUpdateData } = updateData;
      const processedUpdateData = await ProcessingUtils.processUpdateData(articleUpdateData, articleId);
      const { data, error } = await ArticleQueries.updateArticle(articleId, processedUpdateData);

      if (error || !data)
        return { data: null, error: error || new Error(ERROR_MESSAGES.ARTICLE_UPDATE_FAILED) };

      // Relationship updates chạy song song nếu có
      if (categories !== undefined || tags !== undefined) {
        await Promise.all([
          categories !== undefined ? RelationshipsUtils.updateCategories(articleId, categories) : undefined,
          tags !== undefined ? RelationshipsUtils.updateTags(articleId, tags) : undefined,
        ]);
      }
      invalidateArticlesCacheAsync();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  static async updateStatus(
    articleId: string,
    status: 'published' | 'draft' | 'archived'
  ): Promise<{ data: Article | null; error: any }> {
    try {
      const updateData: any = { status, updated_at: nowISO() };
      if (status === 'published') updateData.published_at = nowISO();
      const { data, error } = await ArticleQueries.updateArticle(articleId, updateData);

      if (!error) invalidateArticlesCacheAsync();
      return handleResult(data, error, ERROR_MESSAGES.STATUS_UPDATE_FAILED);
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // ---------------- BULK & RELATIONSHIP ----------------

  static async bulkUpdateStatus(
    articleIds: string[],
    status: 'published' | 'draft' | 'archived'
  ): Promise<{ data: number; error: any }> {
    const result = await BulkOperationsUtils.bulkUpdateStatus(articleIds, status);
    if (!result.error) invalidateArticlesCacheAsync();
    return result;
  }

  static async deleteArticle(articleId: string): Promise<{ error: any }> {
    try {
      const { error } = await ArticleQueries.deleteArticle(articleId);
      if (!error) invalidateArticlesCacheAsync();
      return { error };
    } catch (err) {
      return { error: err };
    }
  }

  static async updateTags(articleId: string, tags: string[]): Promise<{ data?: { tags: any[], tag_names: string[] }; error: any }> {
    const result = await RelationshipsUtils.updateTags(articleId, tags);
    if (result.error) return { error: result.error };

    try {
      await new Promise(r => setTimeout(r, 50));
      const { data: updatedTags } = await supabase
        .from('article_tags').select('tags(id, name, slug)').eq('article_id', articleId);

      const tagsArray = updatedTags?.map((item: any) => item.tags).filter(Boolean) || [];
      const tagNames = tagsArray.map((tag: any) => tag.name);

      invalidateArticlesCacheAsync();
      return { data: { tags: tagsArray, tag_names: tagNames }, error: null };
    } catch {
      invalidateArticlesCacheAsync();
      return { error: null };
    }
  }

  static async updateAuthorById(articleId: string, authorId: string): Promise<{ error: any }> {
    const result = await RelationshipsUtils.updateAuthorById(articleId, authorId);
    if (!result.error) invalidateArticlesCacheAsync();
    return result;
  }

  static async updateTitle(articleId: string, title: string): Promise<{ error: any }> {
    try {
      const updateData = { title: title.trim(), updated_at: nowISO() };
      const { error } = await ArticleQueries.updateArticle(articleId, updateData);
      if (!error) invalidateArticlesCacheAsync();
      return { error };
    } catch (err) {
      return { error: err };
    }
  }

  static async updateCategory(articleId: string, categoryId: string | null): Promise<{ error: any }> {
    const result = await RelationshipsUtils.updateCategory(articleId, categoryId);
    if (!result.error) invalidateArticlesCacheAsync();
    return result;
  }

  static async updateCategories(articleId: string, categoryIds: string[]): Promise<{ error: any }> {
    const result = await RelationshipsUtils.updateCategories(articleId, categoryIds);
    if (!result.error) invalidateArticlesCacheAsync();
    return result;
  }

  // ---------------- MISC/UTILS ----------------

  static async validateSlug(slug: string, excludeId?: string): Promise<{ data: boolean; error: any }> {
    return ValidationUtils.validateSlug(slug, excludeId);
  }

  static async getTags(): Promise<string[]> {
    return RelationshipsUtils.getTags();
  }

  static async addSampleViewData(): Promise<{ success: boolean; error?: any }> {
    const result = await BulkOperationsUtils.addSampleViewData();
    if (result.success) invalidateArticlesCacheAsync();
    return result;
  }

  static async analyzeArticleLinks(articleId: string): Promise<{ data: LinkAnalysis | null; error: any }> {
    try {
      const { data: article, error: fetchError } = await ArticleQueries.getArticleById(articleId);
      if (fetchError || !article)
        return { data: null, error: fetchError || new Error('Article not found') };

      const baseDomain = ProcessingUtils.getBaseDomain();
      const linkAnalysis = ProcessingUtils.analyzeContentLinks(article.content, baseDomain);

      const updateData = {
        internal_links: linkAnalysis.internal_links,
        external_links: linkAnalysis.external_links,
        updated_at: nowISO()
      };
      const { error: updateError } = await ArticleQueries.updateArticle(articleId, updateData);

      return { data: linkAnalysis, error: updateError || null };
    } catch (err) {
      return { data: null, error: err };
    }
  }
}

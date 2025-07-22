/**
 * Articles Module - Business Logic Service (PERFORMANCE OPTIMIZED & REFINED)
 * Đảm bảo: Logic cũ, UI giữ nguyên, tối ưu code, best practice, cực dễ maintain.
 */


import { ArticleQueries } from './queries';
import { supabase, supabaseAdmin } from '../../config/supabase';
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

  static async getArticleForEdit(articleId: string, userId?: string): Promise<{ data: Article | null; error: any }> {
    return serviceWrapper<Article>(
      () => ArticleQueries.getArticleForEditOptimized(articleId, userId),
      ERROR_MESSAGES.ARTICLE_NOT_FOUND
    );
  }

  // ---------------- CREATE / UPDATE ----------------

  // ===== REFACTORED CREATE/UPDATE - Compact & Efficient =====

  static async createArticle(
    articleData: CreateArticleData,
    authorId: string | null,
    isAutosave: boolean = false
  ): Promise<{ data: Article | null; error: any }> {
    return serviceWrapper(async () => {
      const validation = ValidationUtils.validateArticleData(articleData, isAutosave);
      if (!validation.isValid) return { data: null, error: new Error(validation.error) };

      const { processedData } = await ProcessingUtils.processArticleData(articleData, authorId);
      return ArticleQueries.createArticle(processedData);
    }, ERROR_MESSAGES.ARTICLE_CREATE_FAILED, true);
  }

  /**
   * 💾 AUTOSAVE: Lưu đầy đủ dữ liệu vào bảng article_drafts
   */
  static async autosaveContent(
    articleId: string | null,
    contentData: {
      // Core content
      title?: string;
      content?: string;
      excerpt?: string;
      slug?: string;

      // SEO fields
      meta_title?: string;
      meta_description?: string;
      focus_keyword?: string;
      keywords?: string[];
      canonical_url?: string;

      // OpenGraph
      og_title?: string;
      og_description?: string;
      og_image?: string;
      og_type?: string;

      // Media
      cover_image?: string;
      cover_image_alt?: string;

      // Settings
      lang?: string;
      article_type?: string;
      status?: string;

      featured?: boolean;
      category_id?: string;
      author_id?: string | null;
      schema_type?: string;
      robots_directive?: string;

      // Publishing
      published_date?: string; // Custom published date for SEO
      scheduled_at?: string;

      // Links
      internal_links?: any;
      external_links?: any;

      // Tags - NEW
      tags?: string[];
      // Categories - NEW
      categories?: string[];
    },
    userId: string
  ): Promise<{ data: any | null; error: any }> {


    // Nếu không có articleId, gọi autosaveNewArticle cho bài viết mới
    if (!articleId) {
      return this.autosaveNewArticle(contentData, userId);
    }

    try {
      if (!supabaseAdmin) {
        return { data: null, error: { message: 'Supabase admin client not initialized' } };
      }
      
      if (!userId) {
        return { data: null, error: { message: 'User ID is required' } };
      }
      
      // Step 1: Lưu content vào article_drafts
      const result = await ArticleQueries.upsertDraft(articleId, userId, contentData);

      // Step 1.5: Nếu có thay đổi status, cập nhật luôn vào main article
      if (result.data && contentData.status) {
        await ArticleQueries.updateArticle(articleId, {
          status: contentData.status,
          updated_at: new Date().toISOString()
        });
      }

      // Step 2: Xử lý relationships (categories & tags)
      if (result.data) {
        await this.processRelationships(result.data.id, contentData);
      }
      
      return result;
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Autosave failed' } };
    }
  }

  /**
   * 💾 AUTOSAVE NEW ARTICLE: Tạo article draft để hiển thị trong danh sách
   */
  static async autosaveNewArticle(
    contentData: {
      title?: string;
      content?: string;
      excerpt?: string;
      slug?: string;
      meta_title?: string;
      meta_description?: string;
      focus_keyword?: string;
      keywords?: string[];
      canonical_url?: string;
      og_title?: string;
      og_description?: string;
      og_image?: string;
      og_type?: string;
      cover_image?: string;
      cover_image_alt?: string;
      lang?: string;
      article_type?: string;
      status?: string;
      featured?: boolean;
      category_id?: string;
      author_id?: string;
      schema_type?: string;
      robots_directive?: string;
      published_date?: string; // Custom published date for SEO
      scheduled_at?: string;
      internal_links?: any;
      external_links?: any;
      tags?: string[];
      categories?: string[];
    },
    userId: string
  ): Promise<{ data: any | null; error: any }> {
    return serviceWrapper(async () => {
      if (!userId) {
        throw new Error('User ID is required for autosave');
      }

      // Kiểm tra xem đã có draft chưa
      const existingDraftId = await ArticleQueries.findNewArticleDraft(userId);
      const draftWithArticle = await ArticleQueries.findDraftWithArticle(userId);

      if (draftWithArticle) {
        // 🔄 CẬP NHẬT DRAFT + ARTICLE HIỆN TẠI
        console.log(`🔍 Autosave: Updating existing draft ${draftWithArticle.draftId} and article ${draftWithArticle.articleId} for user ${userId}`);

        // Update both draft and article
        const [draftResult, articleResult] = await Promise.all([
          ArticleQueries.upsertDraft(draftWithArticle.articleId, userId, contentData, draftWithArticle.draftId),
          ArticleQueries.updateArticle(draftWithArticle.articleId, {
            title: contentData.title || 'Untitled',
            content: contentData.content || '',
            excerpt: contentData.excerpt || '',
            meta_title: contentData.meta_title || '',
            meta_description: contentData.meta_description || '',
            slug: contentData.slug || '',
            published_at: contentData.published_date ? new Date(contentData.published_date).toISOString() : undefined,
            updated_at: new Date().toISOString()
          })
        ]);

        if (draftResult.data) {
          await this.processRelationships(draftResult.data.id, contentData);
        }

        // Return article data for frontend redirect
        return {
          data: {
            ...articleResult.data,
            draft_id: draftResult.data?.id
          },
          error: articleResult.error || draftResult.error
        };
      } else if (existingDraftId) {
        // 🔄 CẬP NHẬT DRAFT CHƯA CÓ ARTICLE
        console.log(`🔍 Autosave: Updating existing draft ${existingDraftId} for user ${userId}`);

        const result = await ArticleQueries.upsertDraft(null, userId, contentData, existingDraftId);

        if (result.data) {
          await this.processRelationships(result.data.id, contentData);
        }

        return result;
      } else {
        // 🚀 TẠO ARTICLE MỚI + DRAFT để hiển thị trong danh sách
        console.log(`🔍 Autosave: Creating new article for user ${userId}`);

        // Chuẩn bị dữ liệu article với status draft
        const articleData = {
          title: contentData.title || 'Untitled',
          content: contentData.content || '',
          excerpt: contentData.excerpt || '',
          slug: contentData.slug || '',
          meta_title: contentData.meta_title || '',
          meta_description: contentData.meta_description || '',
          focus_keyword: contentData.focus_keyword || '',
          keywords: contentData.keywords || [],
          canonical_url: contentData.canonical_url || '',
          og_title: contentData.og_title || '',
          og_description: contentData.og_description || '',
          og_image: contentData.og_image || '',
          og_type: contentData.og_type || 'article',
          cover_image: contentData.cover_image || '',
          cover_image_alt: contentData.cover_image_alt || '',
          lang: contentData.lang || 'vi',
          article_type: contentData.article_type || 'article',
          status: 'draft', // Luôn là draft khi autosave
          featured: contentData.featured || false,
          category_id: contentData.category_id || null,
          author_id: contentData.author_id || userId,
          schema_type: contentData.schema_type || 'Article',
          robots_directive: contentData.robots_directive || 'index,follow',
          scheduled_at: contentData.scheduled_at || null,
          internal_links: contentData.internal_links || [],
          external_links: contentData.external_links || []
        };

        // Tạo article mới thông qua service để có validation và processing
        const articleResult = await this.createArticle(articleData as any, contentData.author_id || userId, true);

        if (articleResult.error || !articleResult.data) {
          return articleResult;
        }

        const newArticleId = articleResult.data.id;

        // Tạo draft liên kết với article vừa tạo
        const draftResult = await ArticleQueries.upsertDraft(newArticleId, userId, contentData);

        // Xử lý relationships
        if (draftResult.data) {
          await this.processRelationships(draftResult.data.id, contentData);
        }

        // Trả về article data để frontend có thể redirect
        return {
          data: {
            ...articleResult.data,
            draft_id: draftResult.data?.id
          },
          error: null
        };
      }
    }, 'Autosave new article failed', true);
  }
  
  /**
   * 📖 LOAD DRAFT: Load draft data for editing
   */
  static async loadDraft(draftId: string): Promise<{ data: any | null; error: any }> {
    return serviceWrapper(async () => {
      const { data: draft, error } = await supabaseAdmin
        .from('article_drafts')
        .select('*')
        .eq('id', draftId)
        .eq('is_active', true)
        .single();

      if (error || !draft) {
        throw new Error('Draft not found or inactive');
      }

      return { data: draft, error: null };
    }, 'Load draft failed', true);
  }

  /**
   * 🗑️ DEACTIVATE ALL DRAFTS: Soft delete all drafts for an article
   */
  static async deactivateAllDrafts(articleId: string): Promise<{ data: any | null; error: any }> {
    return serviceWrapper(async () => {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not initialized');
      }

      const { data, error } = await supabaseAdmin
        .from('article_drafts')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('article_id', articleId)
        .eq('is_active', true); // Only deactivate currently active drafts

      if (error) {
        throw new Error(`Failed to deactivate drafts: ${error.message}`);
      }

      return { data, error: null };
    }, 'Deactivate drafts failed', true);
  }

  /**
   * Tách riêng việc xử lý relationships để code gọn hơn
   */
  private static async processRelationships(
    draftId: string,
    contentData: { categories?: string[], tags?: string[], keywords?: string[] }
  ): Promise<void> {
    if (!supabaseAdmin) return;

    try {
      // Xử lý categories
      if (contentData.categories && contentData.categories.length > 0) {
        // Xóa old category relationships
        await supabaseAdmin
          .from('article_draft_categories')
          .delete()
          .eq('article_draft_id', draftId);

        // Thêm new category relationships
        const categoryRelationships = contentData.categories.map((categoryId, index) => ({
          article_draft_id: draftId,
          category_id: categoryId,
          sort_order: index + 1
        }));

        await supabaseAdmin
          .from('article_draft_categories')
          .insert(categoryRelationships);
      }

      // FIXED: Xử lý tags - CHỈ XỬ LÝ KHI CÓ TAGS THỰC SỰ
      // Không tự động thêm tags từ keywords nữa
      if (contentData.tags && contentData.tags.length > 0) {
        console.log(`🏷️ Processing ${contentData.tags.length} tags for draft ${draftId}:`, contentData.tags);

        const tagIds = await RelationshipsUtils.processTagsToIds(contentData.tags);

        if (tagIds.length > 0) {
          // Xóa old tag relationships
          await supabaseAdmin
            .from('article_draft_tags')
            .delete()
            .eq('article_draft_id', draftId);

          // Thêm new tag relationships
          const tagRelationships = tagIds.map((tagId, index) => ({
            article_draft_id: draftId,
            tag_id: tagId,
            sort_order: index + 1
          }));

          await supabaseAdmin
            .from('article_draft_tags')
            .insert(tagRelationships);

          console.log(`✅ Successfully processed ${tagIds.length} tag relationships for draft ${draftId}`);
        }
      } else {
        console.log(`🏷️ No tags to process for draft ${draftId}`);

        // FIXED: Xóa tất cả draft tags nếu không có tags
        await supabaseAdmin
          .from('article_draft_tags')
          .delete()
          .eq('article_draft_id', draftId);

        console.log(`🗑️ Cleared all draft tags for draft ${draftId}`);
      }
    } catch (error) {
      console.error('Error processing relationships:', error);
      // Không fail toàn bộ quá trình nếu chỉ có lỗi khi xử lý relationships
    }
  }

  /**
   * 🚀 CONVERT DRAFT TO ARTICLE: Chuyển đổi draft thành bài viết chính thức
   */
  static async convertDraftToArticle(
    draftId: string
  ): Promise<{ data: Article | null; error: any }> {
    return serviceWrapper(async () => {
      // 1. Lấy thông tin draft
      const { data: draft, error: draftError } = await supabaseAdmin
        .from('article_drafts')
        .select('*')
        .eq('id', draftId)
        .single();

      if (draftError || !draft) {
        throw new Error(draftError?.message || 'Draft not found');
      }

      // 2. Chuẩn bị dữ liệu article
      const {
        id, article_id, user_id, is_active, auto_saved, created_at, updated_at,
        ...articleData
      } = draft;

      // 3. Tạo bài viết mới
      const { data: article, error: articleError } = await ArticleQueries.createArticle({
        ...articleData,
        status: articleData.status || 'draft',
      });

      if (articleError || !article) {
        throw new Error(articleError?.message || 'Failed to create article from draft');
      }

      // 4. Xử lý relationships (categories & tags)
      const articleId = article.id;

      try {
        // 4a. Xử lý categories
        const { data: draftCategories } = await supabaseAdmin
          .from('article_draft_categories')
          .select('category_id, sort_order')
          .eq('article_draft_id', draftId);

        if (draftCategories && draftCategories.length > 0) {
          const categoryIds = draftCategories.map(c => c.category_id);
          await RelationshipsUtils.updateCategories(articleId, categoryIds);
        }

        // 4b. Xử lý tags
        const { data: draftTags } = await supabaseAdmin
          .from('article_draft_tags')
          .select('tag_id, sort_order')
          .eq('article_draft_id', draftId);

        if (draftTags && draftTags.length > 0) {
          const tagIds = draftTags.map(t => t.tag_id);
          await RelationshipsUtils.updateTags(articleId, tagIds);
        }
      } catch (relError) {
        console.error('❌ Error processing relationships:', relError);
        // Không fail toàn bộ quá trình nếu chỉ có lỗi khi xử lý relationships
      }

      // 5. Xóa draft sau khi đã chuyển đổi thành công
      await supabaseAdmin
        .from('article_drafts')
        .delete()
        .eq('id', draftId);

      return { data: article, error: null };
    }, 'Failed to convert draft to article', true);
  }

  /**
   * 🚀 MANUAL SAVE: Full update với status, relationships, etc.
   */
  static async updateArticle(
    articleId: string,
    updateData: Partial<CreateArticleData>,
    authorId?: string | null,
    userId?: string
  ): Promise<{ data: Article | null; error: any }> {
    return serviceWrapper(async () => {
      const { categories, tags, ...articleUpdateData } = updateData;

      // Add author_id to update data if provided
      if (authorId !== undefined) {
        articleUpdateData.author_id = authorId;
      }

      console.log('🚀 MANUAL SAVE: Full update with status:', articleUpdateData.status);

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

      // Publish draft tags và xóa draft sau khi save thành công
      if (userId) {
        try {
          // Get draft ID trước khi xóa
          const { data: draftData } = await supabase
            .from('article_drafts')
            .select('id')
            .eq('article_id', articleId)
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

          if (draftData) {
            // Xóa draft categories và tags sau khi publish
            try {
              await Promise.all([
                supabaseAdmin
                  .from('article_draft_categories')
                  .delete()
                  .eq('article_draft_id', draftData.id),
                supabaseAdmin
                  .from('article_draft_tags')
                  .delete()
                  .eq('article_draft_id', draftData.id)
              ]);

              console.log(`🗑️ Cleaned up draft categories and tags for article ${articleId}`);
            } catch (error) {
              console.error('❌ Error cleaning up draft relationships:', error);
            }
          }
        } catch (error) {
          console.error('❌ Error publishing draft tags:', error);
        }

        await ArticleQueries.deleteDraft(articleId, userId);
        console.log(`🗑️ Deleted draft for article ${articleId}`);
      }

      // Full cache invalidation for manual saves
      ArticleQueries.clearCachePattern(`article:edit:${articleId}`);
      invalidateCache(); // Clear all caches

      return result;
    }, ERROR_MESSAGES.ARTICLE_UPDATE_FAILED, true);
  }

  static async updateStatus(
    articleId: string,
    status: 'published' | 'draft' | 'archived' | 'scheduled'
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
    status: 'published' | 'draft' | 'archived' | 'scheduled'
  ): Promise<{ data: number; error: any }> {
    const result = await BulkOperationsUtils.bulkUpdateStatus(articleIds, status);
    if (!result.error) invalidateCache();
    return result;
  }

  static async bulkDeleteArticles(
    articleIds: string[]
  ): Promise<{ data: number; error: any }> {
    const result = await BulkOperationsUtils.bulkDeleteArticles(articleIds);
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

  /**
   * 🔍 FIND NEW ARTICLE DRAFT: Tìm draft chưa liên kết với bài viết
   */
  static async findNewArticleDraft(userId: string): Promise<string | null> {
    try {
      if (!userId) return null;

      return await ArticleQueries.findNewArticleDraft(userId);
    } catch (error) {
      console.error('Error finding new article draft:', error);
      return null;
    }
  }

  // Cache management methods
  static clearCache(): void {
    ArticleQueries.clearCache();
  }

  static clearCachePattern(pattern: string): void {
    ArticleQueries.clearCachePattern(pattern);
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

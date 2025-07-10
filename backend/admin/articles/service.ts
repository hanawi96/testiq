/**
 * Articles Module - Business Logic Service
 * Chứa business logic và orchestration, sử dụng queries từ file riêng
 */

import { generateSlug } from '../../../src/utils/slug-generator';
import { supabase } from '../../config/supabase';
import { ArticleQueries } from './queries';
import type {
  Article,
  ArticleStats,
  ArticlesFilters,
  ArticlesListResponse,
  CreateArticleData,
  LinkAnalysis
} from './types';

export class ArticlesService {
  /**
   * Get base domain for link analysis (environment-aware)
   */
  private static getBaseDomain(): string {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }

    // Check if we're in Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      return process.env.SITE_URL || 'localhost:4321';
    }

    // Fallback
    return 'localhost:4321';
  }

  /**
   * Invalidate articles cache
   */
  private static invalidateArticlesCache(): void {
    if (typeof window !== 'undefined' && (window as any).__articlesCache) {
      console.log('🗑️ ArticlesService: Invalidating articles cache');
      delete (window as any).__articlesCache;
    }
  }

  /**
   * Generate unique slug for article
   */
  private static generateSlug(title: string): string {
    return generateSlug(title);
  }

  /**
   * Validate article data
   */
  private static validateArticleData(articleData: CreateArticleData): { isValid: boolean; error?: string } {
    if (!articleData.title?.trim()) {
      return { isValid: false, error: 'Tiêu đề không được để trống' };
    }

    if (!articleData.content?.trim()) {
      return { isValid: false, error: 'Nội dung không được để trống' };
    }

    return { isValid: true };
  }

  /**
   * Process article data before saving
   */
  private static async processArticleData(articleData: CreateArticleData, authorId: string) {
    // Generate slug if not provided
    let slug = articleData.slug?.trim();
    if (!slug) {
      slug = this.generateSlug(articleData.title);
    }

    // Check if slug exists and make it unique
    const { exists } = await ArticleQueries.checkSlugExists(slug);
    if (exists) {
      slug = `${slug}-${Date.now()}`;
    }

    // Calculate reading time (rough estimate: 200 words per minute)
    const wordCount = articleData.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Prepare article data for database
    const processedData = {
      title: articleData.title.trim(),
      slug,
      content: articleData.content.trim(),
      excerpt: articleData.excerpt?.trim() || null,
      lang: articleData.lang || 'vi',
      article_type: articleData.article_type || 'article',
      status: articleData.status || 'draft',
      featured: articleData.featured || false,
      author_id: authorId,
      category_id: articleData.category_id || null,
      parent_id: articleData.parent_id || null,

      // SEO fields
      meta_title: articleData.meta_title || null,
      meta_description: articleData.meta_description || null,
      focus_keyword: articleData.focus_keyword || null,
      keywords: articleData.keywords || null,
      canonical_url: articleData.canonical_url || null,

      // Open Graph fields
      og_title: articleData.og_title || null,
      og_description: articleData.og_description || null,
      og_image: articleData.og_image || null,
      og_type: articleData.og_type || 'article',

      // Twitter fields
      twitter_title: articleData.twitter_title || null,
      twitter_description: articleData.twitter_description || null,
      twitter_image: articleData.twitter_image || null,
      twitter_card_type: articleData.twitter_card_type || 'summary_large_image',

      // Media fields
      cover_image: articleData.cover_image || null,
      cover_image_alt: articleData.cover_image_alt || null,
      gallery_images: articleData.gallery_images || null,

      // Schema fields
      schema_type: articleData.schema_type || 'Article',
      author_schema: articleData.author_schema || null,
      organization_schema: articleData.organization_schema || null,
      faq_schema: articleData.faq_schema || null,
      howto_schema: articleData.howto_schema || null,
      breadcrumb_schema: articleData.breadcrumb_schema || null,

      // SEO settings
      robots_directive: articleData.robots_directive || 'index,follow',
      sitemap_include: articleData.sitemap_include !== false,
      sitemap_priority: articleData.sitemap_priority || 0.5,
      sitemap_changefreq: articleData.sitemap_changefreq || 'weekly',

      // Content analysis
      word_count: wordCount,
      reading_time: readingTime,

      // Publishing
      published_at: articleData.status === 'published' ? new Date().toISOString() : null,
      scheduled_at: articleData.scheduled_at || null,
      expires_at: articleData.expires_at || null,

      // Versioning
      revision_notes: articleData.revision_notes || null,

      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return { processedData, slug };
  }

  /**
   * Enrich articles with related data
   */
  private static async enrichArticlesWithRelatedData(articles: Article[]): Promise<Article[]> {
    if (!articles || articles.length === 0) {
      return [];
    }

    const articleIds = articles.map(a => a.id);
    const { data: relatedData } = await ArticleQueries.getRelatedDataOptimized(articleIds);

    if (!relatedData) {
      return articles;
    }

    // Create lookup maps for efficient data joining
    const categoriesMap = new Map();
    const tagsMap = new Map();
    const profilesMap = new Map();
    const categoriesLookupMap = new Map();

    // Build categories map
    relatedData.categories.forEach(item => {
      if (!categoriesMap.has(item.article_id)) {
        categoriesMap.set(item.article_id, []);
      }
      categoriesMap.get(item.article_id).push(item.categories);

      // Also build lookup map for category id -> category object
      if (item.categories && item.categories.id) {
        categoriesLookupMap.set(item.categories.id, item.categories);
      }
    });

    // Build tags map with proper null handling
    if (relatedData.tags && Array.isArray(relatedData.tags)) {
      relatedData.tags.forEach(item => {
        if (item && item.article_id) {
          if (!tagsMap.has(item.article_id)) {
            tagsMap.set(item.article_id, []);
          }
          if (item.tags && item.tags.name) {
            tagsMap.get(item.article_id).push(item.tags);
          }
        }
      });
    }

    // Build profiles map
    relatedData.profiles.forEach(profile => {
      profilesMap.set(profile.id, profile);
    });

    // Enrich articles with related data
    return articles.map(article => {
      const articleCategories = categoriesMap.get(article.id) || [];
      const articleTags = tagsMap.get(article.id) || [];

      // Process categories with deduplication
      const categoryIds: string[] = [];
      const categoryNames: string[] = [];
      const seenCategoryIds = new Set<string>();

      // Add primary category first (if exists)
      if (article.category_id && categoriesLookupMap.has(article.category_id)) {
        const primaryCategory = categoriesLookupMap.get(article.category_id);
        categoryIds.push(article.category_id);
        categoryNames.push(primaryCategory.name);
        seenCategoryIds.add(article.category_id);
      }

      // Add additional categories from junction table (avoid duplicates)
      articleCategories.forEach((cat: any) => {
        const catId = typeof cat === 'string' ? cat : (cat?.id || String(cat));
        const catName = typeof cat === 'string' ? cat : (cat?.name || String(cat));

        if (catId && !seenCategoryIds.has(catId)) {
          categoryIds.push(catId);
          categoryNames.push(catName);
          seenCategoryIds.add(catId);
        }
      });

      return {
        ...article,
        categories: articleCategories,
        tags: articleTags,
        user_profiles: article.author_id ? profilesMap.get(article.author_id) : null,
        // Computed fields for backward compatibility
        author: article.author_id ? profilesMap.get(article.author_id)?.full_name : null,
        tag_names: articleTags.map((tag: any) => typeof tag === 'string' ? tag : (tag?.name || String(tag))).filter(Boolean),
        category_ids: categoryIds,
        category_names: categoryNames
      };
    });
  }

  /**
   * Get articles with pagination and filters
   */
  static async getArticles(
    page: number = 1,
    limit: number = 20,
    filters: ArticlesFilters = {}
  ): Promise<{ data: ArticlesListResponse | null; error: any }> {
    try {
      console.log('ArticlesService: Getting articles with filters', { page, limit, filters });

      // Get articles from database
      const { data: articles, error, count } = await ArticleQueries.getArticles(page, limit, filters);

      if (error) {
        console.error('ArticlesService: Error fetching articles:', error);
        
        // Fallback to demo data if table doesn't exist
        const demoResponse = {
          articles: [
            {
              id: '1',
              title: 'Demo: Hướng dẫn làm bài test IQ hiệu quả',
              slug: 'demo-huong-dan-lam-bai-test-iq-hieu-qua',
              excerpt: 'Đây là dữ liệu demo. Vui lòng tạo bảng articles trong database.',
              content: 'Nội dung demo...',
              author: 'Demo Author',
              status: 'published' as const,
              tags: [],
              tag_names: ['Demo', 'IQ Test'],
              categories: [],
              category_ids: [],
              category_names: [],
              view_count: 100,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              published_at: new Date().toISOString(),
              reading_time: 5
            }
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        };

        return { data: demoResponse, error: null };
      }

      if (!articles) {
        return { data: null, error: new Error('Không thể lấy danh sách bài viết') };
      }

      // Enrich articles with related data
      const enrichedArticles = await this.enrichArticlesWithRelatedData(articles);

      // Calculate pagination
      const totalPages = Math.ceil((count || 0) / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const response: ArticlesListResponse = {
        articles: enrichedArticles,
        total: count || 0,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev
      };

      console.log('ArticlesService: Successfully retrieved articles');
      return { data: response, error: null };

    } catch (err) {
      console.error('ArticlesService: Unexpected error getting articles:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get article statistics
   */
  static async getStats(): Promise<{ data: ArticleStats | null; error: any }> {
    try {
      console.log('ArticlesService: Getting articles statistics');

      const { data: stats, error } = await ArticleQueries.getArticlesStats();

      if (error) {
        console.error('ArticlesService: Error getting statistics:', error);
        return { data: null, error };
      }

      console.log('ArticlesService: Successfully retrieved statistics');
      return { data: stats, error: null };

    } catch (err) {
      console.error('ArticlesService: Unexpected error getting statistics:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get article by ID
   */
  static async getArticleById(articleId: string): Promise<{ data: Article | null; error: any }> {
    try {
      console.log('ArticlesService: Getting article by ID:', articleId);

      const { data: article, error } = await ArticleQueries.getArticleById(articleId);

      if (error) {
        console.error('ArticlesService: Error getting article by ID:', error);
        return { data: null, error };
      }

      if (!article) {
        return { data: null, error: new Error('Không tìm thấy bài viết') };
      }

      // Enrich with related data
      const enrichedArticles = await this.enrichArticlesWithRelatedData([article]);

      console.log('ArticlesService: Successfully retrieved article by ID');
      return { data: enrichedArticles[0], error: null };

    } catch (err) {
      console.error('ArticlesService: Unexpected error getting article by ID:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get article by slug
   */
  static async getArticleBySlug(slug: string): Promise<{ data: Article | null; error: any }> {
    try {
      console.log('ArticlesService: Getting article by slug:', slug);

      const { data: article, error } = await ArticleQueries.getArticleBySlug(slug);

      if (error) {
        console.error('ArticlesService: Error getting article by slug:', error);
        return { data: null, error };
      }

      if (!article) {
        return { data: null, error: new Error('Không tìm thấy bài viết') };
      }

      // Enrich with related data
      const enrichedArticles = await this.enrichArticlesWithRelatedData([article]);

      console.log('ArticlesService: Successfully retrieved article by slug');
      return { data: enrichedArticles[0], error: null };

    } catch (err) {
      console.error('ArticlesService: Unexpected error getting article by slug:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Create new article
   */
  static async createArticle(
    articleData: CreateArticleData,
    authorId: string
  ): Promise<{ data: Article | null; error: any }> {
    try {
      console.log('ArticlesService: Creating new article:', articleData);

      // Validate article data
      const validation = this.validateArticleData(articleData);
      if (!validation.isValid) {
        return { data: null, error: new Error(validation.error) };
      }

      // Process article data
      const { processedData } = await this.processArticleData(articleData, authorId);

      // Create article in database
      const { data: createdArticle, error } = await ArticleQueries.createArticle(processedData);

      if (error) {
        console.error('ArticlesService: Error creating article:', error);
        return { data: null, error };
      }

      if (!createdArticle) {
        return { data: null, error: new Error('Không thể tạo bài viết') };
      }

      // Invalidate cache
      this.invalidateArticlesCache();

      // Enrich with related data
      const enrichedArticles = await this.enrichArticlesWithRelatedData([createdArticle]);

      console.log('ArticlesService: Successfully created article');
      return { data: enrichedArticles[0], error: null };

    } catch (err) {
      console.error('ArticlesService: Unexpected error creating article:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update article
   */
  static async updateArticle(
    articleId: string,
    updateData: Partial<CreateArticleData>
  ): Promise<{ data: Article | null; error: any }> {
    try {

      // Extract categories and tags for separate processing
      const { categories, tags, ...articleUpdateData } = updateData;

      // Prepare update data for articles table only
      const processedUpdateData: any = {
        ...articleUpdateData,
        updated_at: new Date().toISOString()
      };

      // Handle slug update
      if (updateData.slug) {
        const { exists } = await ArticleQueries.checkSlugExists(updateData.slug, articleId);
        if (exists) {
          return { data: null, error: new Error('Slug đã tồn tại') };
        }
      }

      // Update reading time if content changed
      if (updateData.content) {
        const wordCount = updateData.content.split(/\s+/).length;
        processedUpdateData.reading_time = Math.ceil(wordCount / 200);
        processedUpdateData.word_count = wordCount;
      }

      // Set published_at when publishing
      if (updateData.status === 'published') {
        processedUpdateData.published_at = new Date().toISOString();
      }

      // Update article in database
      const { data: updatedArticle, error } = await ArticleQueries.updateArticle(articleId, processedUpdateData);

      if (error) {
        return { data: null, error };
      }

      if (!updatedArticle) {
        return { data: null, error: new Error('Không thể cập nhật bài viết') };
      }

      // Handle categories update if provided
      if (categories !== undefined) {
        await this.updateArticleCategories(articleId, categories);
      }

      // Handle tags update if provided
      if (tags !== undefined) {
        await this.updateArticleTags(articleId, tags);
      }

      // Invalidate cache
      this.invalidateArticlesCache();

      // Enrich with related data
      const enrichedArticles = await this.enrichArticlesWithRelatedData([updatedArticle]);

      return { data: enrichedArticles[0], error: null };

    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Update article status
   */
  static async updateStatus(
    articleId: string,
    status: 'published' | 'draft' | 'archived'
  ): Promise<{ data: Article | null; error: any }> {
    try {
      console.log('ArticlesService: Updating article status:', { articleId, status });

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Set published_at when publishing
      if (status === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { data: updatedArticle, error } = await ArticleQueries.updateArticle(articleId, updateData);

      if (error) {
        console.error('ArticlesService: Error updating article status:', error);
        return { data: null, error };
      }

      if (!updatedArticle) {
        return { data: null, error: new Error('Không thể cập nhật trạng thái bài viết') };
      }

      // Invalidate cache
      this.invalidateArticlesCache();

      // Enrich with related data
      const enrichedArticles = await this.enrichArticlesWithRelatedData([updatedArticle]);

      console.log('ArticlesService: Successfully updated article status');
      return { data: enrichedArticles[0], error: null };

    } catch (err) {
      console.error('ArticlesService: Unexpected error updating article status:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Bulk update articles status
   */
  static async bulkUpdateStatus(
    articleIds: string[],
    status: 'published' | 'draft' | 'archived'
  ): Promise<{ data: number; error: any }> {
    try {
      console.log('ArticlesService: Bulk updating articles status:', { articleIds, status });

      if (!articleIds || articleIds.length === 0) {
        return { data: 0, error: null };
      }

      const { data: updatedArticles, error } = await ArticleQueries.bulkUpdateStatus(articleIds, status);

      if (error) {
        console.error('ArticlesService: Error bulk updating articles status:', error);
        return { data: 0, error };
      }

      // Invalidate cache
      this.invalidateArticlesCache();

      const updatedCount = updatedArticles?.length || 0;
      console.log('ArticlesService: Successfully bulk updated articles status:', updatedCount);
      return { data: updatedCount, error: null };

    } catch (err) {
      console.error('ArticlesService: Unexpected error bulk updating articles status:', err);
      return { data: 0, error: err };
    }
  }

  /**
   * Delete article
   */
  static async deleteArticle(articleId: string): Promise<{ error: any }> {
    try {
      console.log('ArticlesService: Deleting article:', articleId);

      const { error } = await ArticleQueries.deleteArticle(articleId);

      if (error) {
        console.error('ArticlesService: Error deleting article:', error);
        return { error };
      }

      // Invalidate cache
      this.invalidateArticlesCache();

      console.log('ArticlesService: Successfully deleted article');
      return { error: null };

    } catch (err) {
      console.error('ArticlesService: Unexpected error deleting article:', err);
      return { error: err };
    }
  }

  /**
   * Get article for editing (with all related data)
   */
  static async getArticleForEdit(articleId: string): Promise<{ data: Article | null; error: any }> {
    try {
      console.log('ArticlesService: Getting article for edit:', articleId);

      // Get article by ID with full data
      const result = await this.getArticleById(articleId);

      if (result.error || !result.data) {
        console.error('ArticlesService: Error getting article for edit:', result.error);
        return { data: null, error: result.error || new Error('Không tìm thấy bài viết') };
      }

      console.log('ArticlesService: Successfully retrieved article for edit');
      return { data: result.data, error: null };

    } catch (err) {
      console.error('ArticlesService: Unexpected error getting article for edit:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Analyze article links
   */
  static async analyzeArticleLinks(articleId: string): Promise<{ data: LinkAnalysis | null; error: any }> {
    try {
      console.log('ArticlesService: Analyzing links for article:', articleId);

      // Get article content
      const { data: article, error: fetchError } = await ArticleQueries.getArticleById(articleId);

      if (fetchError || !article) {
        console.error('ArticlesService: Error fetching article for link analysis:', fetchError);
        return { data: null, error: fetchError || new Error('Article not found') };
      }

      // Analyze links in content (simplified version)
      const baseDomain = this.getBaseDomain();
      const linkAnalysis = this.analyzeContentLinks(article.content, baseDomain);

      // Update article with link analysis
      const updateData = {
        internal_links: linkAnalysis.internal_links,
        external_links: linkAnalysis.external_links,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await ArticleQueries.updateArticle(articleId, updateData);

      if (updateError) {
        console.error('ArticlesService: Error updating article with link analysis:', updateError);
        return { data: linkAnalysis, error: updateError };
      }

      console.log('ArticlesService: Successfully analyzed article links');
      return { data: linkAnalysis, error: null };

    } catch (err) {
      console.error('ArticlesService: Unexpected error analyzing article links:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Simple link analysis helper
   */
  private static analyzeContentLinks(content: string, baseDomain: string): LinkAnalysis {
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    const links = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        url: match[1],
        text: match[2]
      });
    }

    const internal_links = links.filter(link =>
      link.url.includes(baseDomain) || link.url.startsWith('/')
    );

    const external_links = links.filter(link =>
      !link.url.includes(baseDomain) && !link.url.startsWith('/')
    ).map(link => ({
      ...link,
      domain: new URL(link.url).hostname
    }));

    return {
      internal_links,
      external_links,
      total_links: links.length,
      internal_count: internal_links.length,
      external_count: external_links.length
    };
  }

  /**
   * Update article tags (for quick edit)
   */
  static async updateTags(articleId: string, tags: string[]): Promise<{ error: any }> {
    try {

      // 1. Update article timestamp
      const { error: updateError } = await ArticleQueries.updateArticle(articleId, {
        updated_at: new Date().toISOString()
      });

      if (updateError) {
        return { error: updateError };
      }

      // 2. Handle tags if provided
      if (tags && tags.length > 0) {
        // Create tags that don't exist
        const tagIds: string[] = [];

        for (const tagName of tags) {
          if (!tagName.trim()) continue;

          // Try to find existing tag
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName.trim())
            .single();

          if (existingTag) {
            tagIds.push(existingTag.id);
          } else {
            // Create new tag
            const { data: newTag, error: createError } = await supabase
              .from('tags')
              .insert({
                name: tagName.trim(),
                slug: tagName.trim().toLowerCase().replace(/\s+/g, '-'),
                usage_count: 1
              })
              .select('id')
              .single();

            if (createError) {
              continue;
            }

            if (newTag) {
              tagIds.push(newTag.id);
            }
          }
        }

        // 3. Delete existing article_tags relationships
        const { error: deleteError } = await supabase
          .from('article_tags')
          .delete()
          .eq('article_id', articleId);

        if (deleteError) {
          // Continue anyway
        }

        // 4. Insert new article_tags relationships
        if (tagIds.length > 0) {
          const tagRelations = tagIds.map(tagId => ({
            article_id: articleId,
            tag_id: tagId
          }));

          const { error: insertError } = await supabase
            .from('article_tags')
            .insert(tagRelations);

          if (insertError) {
            return { error: insertError };
          }
        }
      } else {
        // No tags provided - delete all existing tags for this article
        const { error: deleteError } = await supabase
          .from('article_tags')
          .delete()
          .eq('article_id', articleId);

        if (deleteError) {
          // Continue anyway
        }
      }

      // Invalidate cache
      this.invalidateArticlesCache();

      return { error: null };

    } catch (err) {
      return { error: err };
    }
  }

  /**
   * Update article author (for quick edit)
   */
  static async updateAuthorById(articleId: string, authorId: string): Promise<{ error: any }> {
    try {
      console.log('ArticlesService: Updating article author:', { articleId, authorId });

      const updateData = {
        author_id: authorId,
        updated_at: new Date().toISOString()
      };

      const { error } = await ArticleQueries.updateArticle(articleId, updateData);

      if (error) {
        console.error('ArticlesService: Error updating article author:', error);
        return { error };
      }

      // Invalidate cache
      this.invalidateArticlesCache();

      console.log('ArticlesService: Successfully updated article author');
      return { error: null };

    } catch (err) {
      console.error('ArticlesService: Unexpected error updating article author:', err);
      return { error: err };
    }
  }

  /**
   * Update article categories (for quick edit)
   */
  static async updateCategories(articleId: string, categoryIds: string[]): Promise<{ error: any }> {
    try {
      console.log('ArticlesService: Updating article categories:', { articleId, categoryIds });

      // Set primary category (first one) - this field exists in articles table
      const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;

      // 1. Update primary category in articles table
      const { error: updateError } = await ArticleQueries.updateArticle(articleId, {
        category_id: primaryCategoryId,
        updated_at: new Date().toISOString()
      });

      if (updateError) {
        console.error('ArticlesService: Error updating primary category:', updateError);
        return { error: updateError };
      }

      // 2. Delete existing categories for this article from article_categories
      const { error: deleteError } = await supabase
        .from('article_categories')
        .delete()
        .eq('article_id', articleId);

      if (deleteError) {
        console.error('ArticlesService: Error deleting existing categories:', deleteError);
        // Continue anyway - this is not critical
      }

      // 3. Insert new article_categories relationships for all categories
      if (categoryIds.length > 0) {
        const categoryRelations = categoryIds.map(categoryId => ({
          article_id: articleId,
          category_id: categoryId
        }));

        const { error: insertError } = await supabase
          .from('article_categories')
          .insert(categoryRelations);

        if (insertError) {
          console.error('ArticlesService: Error inserting new categories:', insertError);
          // Continue anyway - primary category is already updated
        }
      }

      // Invalidate cache
      this.invalidateArticlesCache();

      console.log('ArticlesService: Successfully updated article categories');
      return { error: null };

    } catch (err) {
      console.error('ArticlesService: Unexpected error updating article categories:', err);
      return { error: err };
    }
  }

  /**
   * Update article categories (junction table)
   */
  private static async updateArticleCategories(articleId: string, categoryIds: string[]): Promise<void> {
    try {
      // Delete existing category relationships
      await supabase
        .from('article_categories')
        .delete()
        .eq('article_id', articleId);

      // Insert new category relationships
      if (categoryIds.length > 0) {
        const categoryRelations = categoryIds.map(categoryId => ({
          article_id: articleId,
          category_id: categoryId
        }));

        await supabase
          .from('article_categories')
          .insert(categoryRelations);
      }
    } catch (err) {
      console.error('ArticlesService: Error updating article categories:', err);
      // Don't throw - continue with article update
    }
  }

  /**
   * Update article tags (junction table)
   */
  private static async updateArticleTags(articleId: string, tagNames: string[]): Promise<void> {
    try {
      // Delete existing tag relationships
      await supabase
        .from('article_tags')
        .delete()
        .eq('article_id', articleId);

      // Process tags if provided
      if (tagNames.length > 0) {
        const tagIds: string[] = [];

        for (const tagName of tagNames) {
          if (!tagName.trim()) continue;

          // Try to find existing tag
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName.trim())
            .single();

          if (existingTag) {
            tagIds.push(existingTag.id);
          } else {
            // Create new tag
            const { data: newTag, error: createError } = await supabase
              .from('tags')
              .insert({
                name: tagName.trim(),
                slug: tagName.trim().toLowerCase().replace(/\s+/g, '-'),
                usage_count: 1
              })
              .select('id')
              .single();

            if (!createError && newTag) {
              tagIds.push(newTag.id);
            }
          }
        }

        // Insert new tag relationships
        if (tagIds.length > 0) {
          const tagRelations = tagIds.map(tagId => ({
            article_id: articleId,
            tag_id: tagId
          }));

          await supabase
            .from('article_tags')
            .insert(tagRelations);
        }
      }
    } catch (err) {
      console.error('ArticlesService: Error updating article tags:', err);
      // Don't throw - continue with article update
    }
  }

  /**
   * Validate slug (for ArticleEditor)
   */
  static async validateSlug(slug: string, excludeId?: string): Promise<{ data: boolean; error: any }> {
    try {
      const { exists, error } = await ArticleQueries.checkSlugExists(slug, excludeId);

      if (error) {
        return { data: false, error };
      }

      // Return true if slug is available (not exists), false if taken
      return { data: !exists, error: null };

    } catch (err) {
      return { data: false, error: err };
    }
  }

  /**
   * Get all tags (for preloader and quick edit)
   */
  static async getTags(): Promise<string[]> {
    try {
      const { data: tags, error } = await supabase
        .from('tags')
        .select('name')
        .order('usage_count', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('ArticlesService: Error fetching tags:', error);
        return [];
      }

      if (!tags || tags.length === 0) {
        return [];
      }

      return tags.map(tag => tag.name).filter(Boolean);

    } catch (err) {
      console.error('ArticlesService: Unexpected error fetching tags:', err);
      return [];
    }
  }
}

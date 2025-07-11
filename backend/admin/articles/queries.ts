/**
 * Articles Module - Database Queries (OPTIMIZED)
 * Tất cả database operations cho articles module
 *
 * QUERIES OPTIMIZATION:
 * ✅ Removed unused query builders
 * ✅ Simplified query construction
 * ✅ Consistent error handling
 * ✅ Reduced code duplication
 * ✅ Improved type safety
 */

import { supabase } from '../../config/supabase';
import type { ArticlesFilters, RelatedData, Article, ArticleStatus } from './types';

// Query field selections for consistency
const ARTICLE_FIELDS = `
  id, title, slug, excerpt, content, author_id, category_id, status, featured,
  view_count, like_count, created_at, updated_at, published_at, reading_time,
  internal_links, external_links
` as const;

const CATEGORY_FIELDS = `id, name, slug, description` as const;
const TAG_FIELDS = `id, name, slug, description` as const;
const USER_FIELDS = `id, full_name, email, role` as const;

export class ArticleQueries {
  /**
   * OPTIMIZED: Build query with filters and sorting
   */
  private static applyFilters(query: any, filters: ArticlesFilters) {
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.author) {
      query = query.eq('author_id', filters.author);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Apply sorting
    const sortField = filters.sort_by || 'created_at';
    const ascending = filters.sort_order === 'asc';
    return query.order(sortField, { ascending });
  }

  /**
   * OPTIMIZED: Get articles with all related data
   */
  static async getArticles(
    page: number = 1,
    limit: number = 20,
    filters: ArticlesFilters = {}
  ) {
    try {
      const startTime = Date.now();
      const offset = (page - 1) * limit;

      // Build optimized query with primary category join
      let query = supabase
        .from('articles')
        .select(`
          ${ARTICLE_FIELDS},
          primary_category:categories!category_id (${CATEGORY_FIELDS})
        `, { count: 'exact' });

      // Apply filters and sorting
      query = this.applyFilters(query, filters);

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Execute the main query
      const { data: articles, error, count } = await query;

      if (error) {
        return { data: null, error, count: 0 };
      }

      if (!articles || articles.length === 0) {
        return { data: [], error: null, count: count || 0 };
      }

      // Get related data in parallel
      const articleIds = articles.map(article => article.id);
      const authorIds = [...new Set(articles.map(article => article.author_id).filter(Boolean))];

      const [categoriesResult, tagsResult, authorsResult] = await Promise.all([
        supabase
          .from('article_categories')
          .select(`article_id, categories:category_id (${CATEGORY_FIELDS})`)
          .in('article_id', articleIds),
        supabase
          .from('article_tags')
          .select(`article_id, tags:tag_id (${TAG_FIELDS})`)
          .in('article_id', articleIds),
        authorIds.length > 0
          ? supabase.from('user_profiles').select(USER_FIELDS).in('id', authorIds)
          : Promise.resolve({ data: [] })
      ]);

      // Build lookup maps for efficient joining
      const categoriesMap = new Map<string, any[]>();
      const tagsMap = new Map<string, any[]>();
      const authorsMap = new Map<string, any>();

      // Process related data
      categoriesResult.data?.forEach((item: any) => {
        if (item.categories) {
          if (!categoriesMap.has(item.article_id)) {
            categoriesMap.set(item.article_id, []);
          }
          categoriesMap.get(item.article_id)!.push(item.categories);
        }
      });

      tagsResult.data?.forEach((item: any) => {
        if (item.tags) {
          if (!tagsMap.has(item.article_id)) {
            tagsMap.set(item.article_id, []);
          }
          tagsMap.get(item.article_id)!.push(item.tags);
        }
      });

      authorsResult.data?.forEach((author: any) => {
        authorsMap.set(author.id, author);
      });

      // Enrich articles with related data
      const enrichedArticles = articles.map(article => {
        const articleCategories = categoriesMap.get(article.id) || [];
        const articleTags = tagsMap.get(article.id) || [];
        const authorProfile = article.author_id ? authorsMap.get(article.author_id) : null;

        // Handle primary category
        const primaryCategory = Array.isArray(article.primary_category) && article.primary_category.length > 0
          ? article.primary_category[0] : null;

        // Build category arrays
        const allCategories = [...articleCategories];
        if (primaryCategory && !allCategories.find(cat => cat.id === primaryCategory.id)) {
          allCategories.unshift(primaryCategory);
        }

        return {
          ...article,
          categories: allCategories,
          tags: articleTags,
          user_profiles: authorProfile,
          author: authorProfile?.full_name || null,
          category: primaryCategory?.name || null,
          tag_names: articleTags.map(tag => tag.name),
          category_ids: allCategories.map(cat => cat.id),
          category_names: allCategories.map(cat => cat.name)
        };
      });

      const queryTime = Date.now() - startTime;
      console.log(`ArticleQueries: Fetched ${enrichedArticles.length} articles in ${queryTime}ms`);
      return { data: enrichedArticles, error: null, count: count || 0 };

    } catch (err) {
      console.error('ArticleQueries: Unexpected error fetching articles:', err);
      return { data: null, error: err, count: 0 };
    }
  }

  /**
   * Get article by ID
   */
  static async getArticleById(articleId: string) {
    try {
      const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      return { data: article, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Get article for editing with all related data
   */
  static async getArticleForEditOptimized(articleId: string) {
    try {
      // Get article
      const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error || !article) {
        return { data: null, error: error || new Error('Article not found') };
      }

      // Get related data in parallel
      const [categoriesResult, tagsResult, authorResult] = await Promise.all([
        supabase
          .from('article_categories')
          .select(`categories:category_id (${CATEGORY_FIELDS})`)
          .eq('article_id', articleId),
        supabase
          .from('article_tags')
          .select(`tags:tag_id (${TAG_FIELDS})`)
          .eq('article_id', articleId),
        article.author_id
          ? supabase.from('user_profiles').select(USER_FIELDS).eq('id', article.author_id).single()
          : Promise.resolve({ data: null, error: null })
      ]);

      // Process related data
      const categories = categoriesResult.data?.map((item: any) => item.categories).filter(Boolean) || [];
      const tags = tagsResult.data?.map((item: any) => item.tags).filter(Boolean) || [];

      return {
        data: {
          ...article,
          categories,
          tags,
          tag_names: tags.map((tag: any) => tag.name),
          user_profiles: authorResult.data || null
        },
        error: null
      };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Get article by slug
   */
  static async getArticleBySlug(slug: string) {
    try {
      const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single();

      return { data: article, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Create new article
   */
  static async createArticle(articleData: any) {
    try {
      const { data: insertedData, error } = await supabase
        .from('articles')
        .insert(articleData)
        .select()
        .single();

      return { data: insertedData, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Update article
   */
  static async updateArticle(articleId: string, updateData: any) {
    try {
      const { data: updatedData, error } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', articleId)
        .select()
        .single();

      return { data: updatedData, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Delete article
   */
  static async deleteArticle(articleId: string) {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);

      return { error };
    } catch (err) {
      return { error: err };
    }
  }

  /**
   * Bulk update articles status
   */
  static async bulkUpdateStatus(articleIds: string[], status: string) {
    try {
      console.log('ArticleQueries: Bulk updating articles status:', { articleIds, status });

      if (!articleIds || articleIds.length === 0) {
        return { data: [], error: null };
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Set published_at when publishing
      if (status === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { data: updatedData, error: updateError } = await supabase
        .from('articles')
        .update(updateData)
        .in('id', articleIds)
        .select('id');

      if (updateError) {
        console.error('ArticleQueries: Error bulk updating articles status:', updateError);
        return { data: null, error: updateError };
      }

      console.log('ArticleQueries: Successfully bulk updated articles status');
      return { data: updatedData || [], error: null };

    } catch (err) {
      console.error('ArticleQueries: Unexpected error bulk updating articles status:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get articles statistics
   */
  static async getArticlesStats() {
    try {
      console.log('ArticleQueries: Fetching articles statistics from database');

      // Get counts by status
      const { data: statusCounts, error: statusError } = await supabase
        .from('articles')
        .select('status')
        .not('status', 'is', null);

      if (statusError) {
        console.error('ArticleQueries: Error getting status counts:', statusError);
        return { data: null, error: statusError };
      }

      // Count by status
      const total = statusCounts?.length || 0;
      const published = statusCounts?.filter(a => a.status === 'published').length || 0;
      const draft = statusCounts?.filter(a => a.status === 'draft').length || 0;
      const archived = statusCounts?.filter(a => a.status === 'archived').length || 0;

      // Get total views
      const { data: viewsData, error: viewsError } = await supabase
        .from('articles')
        .select('view_count')
        .not('view_count', 'is', null);

      if (viewsError) {
        console.error('ArticleQueries: Error getting views:', viewsError);
        return { data: null, error: viewsError };
      }

      const totalViews = viewsData?.reduce((sum, article) => sum + (article.view_count || 0), 0) || 0;

      // Get reading times
      const { data: readingData, error: readingError } = await supabase
        .from('articles')
        .select('reading_time')
        .not('reading_time', 'is', null);

      if (readingError) {
        console.error('ArticleQueries: Error getting reading times:', readingError);
        return { data: null, error: readingError };
      }

      const avgReadingTime = readingData?.length > 0
        ? Math.round(readingData.reduce((sum, article) => sum + (article.reading_time || 0), 0) / readingData.length)
        : 0;

      // Get recent articles (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count: recentCount, error: recentError } = await supabase
        .from('articles')
        .select('id', { count: 'exact' })
        .gte('created_at', weekAgo.toISOString());

      if (recentError) {
        console.error('ArticleQueries: Error getting recent articles count:', recentError);
        return { data: null, error: recentError };
      }

      const stats = {
        total,
        published,
        draft,
        archived,
        totalViews,
        avgReadingTime,
        recentArticles: recentCount || 0
      };

      console.log('ArticleQueries: Successfully fetched articles statistics');
      return { data: stats, error: null };

    } catch (err) {
      console.error('ArticleQueries: Unexpected error fetching articles statistics:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get all related data in minimal queries
   */
  static async getRelatedDataOptimized(articleIds: string[]): Promise<{ data: RelatedData | null; error: any }> {
    if (articleIds.length === 0) {
      return { data: { categories: [], tags: [], profiles: [] }, error: null };
    }

    try {
      // Fetch all related data in parallel with single queries
      const [categoriesResult, primaryCategoriesResult, tagsResult, profilesResult] = await Promise.all([
        // Get categories from junction table (many-to-many)
        supabase
          .from('article_categories')
          .select(`
            article_id,
            categories:category_id (
              id,
              name,
              slug,
              description
            )
          `)
          .in('article_id', articleIds),

        // Get primary categories from articles table (one-to-one)
        supabase
          .from('articles')
          .select(`
            id,
            categories:category_id (
              id,
              name,
              slug,
              description
            )
          `)
          .in('id', articleIds)
          .not('category_id', 'is', null),

        // Get tags for all articles in one query
        supabase
          .from('article_tags')
          .select(`
            article_id,
            tags:tag_id (
              id,
              name,
              slug,
              description
            )
          `)
          .in('article_id', articleIds),

        // Get unique author profiles
        supabase
          .from('user_profiles')
          .select(USER_FIELDS)
      ]);

      // Merge categories from both sources with deduplication
      const allCategories: any[] = [];
      const seenCombinations = new Set<string>(); // Track article_id + category_id combinations

      // Add categories from junction table
      if (categoriesResult.data) {
        categoriesResult.data.forEach((item: any) => {
          if (item.categories && item.categories.id) {
            const key = `${item.article_id}-${item.categories.id}`;
            if (!seenCombinations.has(key)) {
              seenCombinations.add(key);
              allCategories.push(item);
            }
          }
        });
      }

      // Add primary categories from articles table (avoid duplicates)
      if (primaryCategoriesResult.data) {
        primaryCategoriesResult.data.forEach((article: any) => {
          if (article.categories && article.categories.id) {
            const key = `${article.id}-${article.categories.id}`;
            if (!seenCombinations.has(key)) {
              seenCombinations.add(key);
              allCategories.push({
                article_id: article.id,
                categories: article.categories
              });
            }
          }
        });
      }

      return {
        data: {
          categories: allCategories as any,
          tags: tagsResult.data as any || [],
          profiles: profilesResult.data || []
        },
        error: null
      };

    } catch (err) {
      console.error('ArticleQueries: Error fetching related data:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Check if slug exists
   */
  static async checkSlugExists(slug: string, excludeId?: string) {
    try {
      let query = supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .eq('slug', slug);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { count, error } = await query;
      return { exists: (count || 0) > 0, error };
    } catch (err) {
      return { exists: false, error: err };
    }
  }
}

/**
 * Articles Module - Database Queries
 * Tất cả database operations cho articles module
 */

import { supabase } from '../../config/supabase';
import type { ArticlesFilters, RelatedData } from './types';

export class ArticleQueries {
  /**
   * Helper method to build article query with joins
   */
  static buildArticleQuery() {
    console.log('ArticleQueries: Building article query with joins...');

    // Since there's no direct FK between articles.author_id and user_profiles.id,
    // we need to fetch user_profiles separately and join manually in the service layer
    const query = supabase
      .from('articles')
      .select(`
        *,
        categories!category_id (
          name,
          slug
        )
      `);

    console.log('ArticleQueries: Article query built successfully');
    return query;
  }

  /**
   * Optimized method to get articles with single query and minimal joins
   * Reduces database round trips from 4+ to 1-2 queries
   */
  static buildOptimizedArticleQuery() {
    console.log('ArticleQueries: Building optimized article query...');

    // Use a more efficient approach with minimal data fetching
    const query = supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        author_id,
        status,
        view_count,
        like_count,
        created_at,
        updated_at,
        published_at,
        reading_time,
        internal_links,
        external_links
      `);

    console.log('ArticleQueries: Optimized article query built successfully');
    return query;
  }

  /**
   * Get articles with pagination and filters
   */
  static async getArticles(
    page: number = 1,
    limit: number = 20,
    filters: ArticlesFilters = {}
  ) {
    try {
      console.log('ArticleQueries: Fetching articles from database', { page, limit, filters });

      const offset = (page - 1) * limit;

      // Build optimized query
      let query = this.buildOptimizedArticleQuery()
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
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
      if (filters.sort_by) {
        const ascending = filters.sort_order === 'asc';
        query = query.order(filters.sort_by, { ascending });
      }

      // Execute query with count
      const { data: articles, error, count } = await supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('ArticleQueries: Error fetching articles:', error);
        return { data: null, error, count: 0 };
      }

      console.log(`ArticleQueries: Successfully fetched ${articles?.length || 0} articles`);
      return { data: articles || [], error: null, count: count || 0 };

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
      console.log('ArticleQueries: Fetching article by ID:', articleId);

      const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) {
        console.error('ArticleQueries: Error fetching article by ID:', error);
        return { data: null, error };
      }

      console.log('ArticleQueries: Successfully fetched article by ID');
      return { data: article, error: null };

    } catch (err) {
      console.error('ArticleQueries: Unexpected error fetching article by ID:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get article by slug
   */
  static async getArticleBySlug(slug: string) {
    try {
      console.log('ArticleQueries: Fetching article by slug:', slug);

      const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('ArticleQueries: Error fetching article by slug:', error);
        return { data: null, error };
      }

      console.log('ArticleQueries: Successfully fetched article by slug');
      return { data: article, error: null };

    } catch (err) {
      console.error('ArticleQueries: Unexpected error fetching article by slug:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Create new article
   */
  static async createArticle(articleData: any) {
    try {
      console.log('ArticleQueries: Creating article in database:', articleData);

      const { data: insertedData, error: insertError } = await supabase
        .from('articles')
        .insert(articleData)
        .select()
        .single();

      if (insertError) {
        console.error('ArticleQueries: Error creating article:', insertError);
        return { data: null, error: insertError };
      }

      console.log('ArticleQueries: Successfully created article');
      return { data: insertedData, error: null };

    } catch (err) {
      console.error('ArticleQueries: Unexpected error creating article:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update article
   */
  static async updateArticle(articleId: string, updateData: any) {
    try {

      const { data: updatedData, error: updateError } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', articleId)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: updateError };
      }

      return { data: updatedData, error: null };

    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Delete article
   */
  static async deleteArticle(articleId: string) {
    try {
      console.log('ArticleQueries: Deleting article from database:', articleId);

      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);

      if (deleteError) {
        console.error('ArticleQueries: Error deleting article:', deleteError);
        return { error: deleteError };
      }

      console.log('ArticleQueries: Successfully deleted article');
      return { error: null };

    } catch (err) {
      console.error('ArticleQueries: Unexpected error deleting article:', err);
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
          .select('id, full_name, email, avatar_url')
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

      if (error) {
        return { exists: false, error };
      }

      // Check if any rows exist
      return { exists: (count || 0) > 0, error: null };

    } catch (err) {
      return { exists: false, error: err };
    }
  }
}

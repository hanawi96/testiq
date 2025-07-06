export interface Article {
  id: string;
  title: string;
  slug: string;
  slug_history?: string[];
  content: string;
  excerpt?: string;
  lang?: string;
  article_type?: 'article' | 'page' | 'post';
  status: 'published' | 'draft' | 'archived';
  featured?: boolean;
  author_id?: string;
  category_id?: string;
  parent_id?: string;

  // SEO fields
  meta_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  keywords?: string[];
  canonical_url?: string;

  // Open Graph fields
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;

  // Twitter fields
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_card_type?: string;

  // Media fields
  cover_image?: string;
  cover_image_alt?: string;
  gallery_images?: any;

  // Schema fields
  schema_type?: string;
  author_schema?: any;
  organization_schema?: any;
  faq_schema?: any;
  howto_schema?: any;
  breadcrumb_schema?: any;

  // Content analysis
  word_count?: number;
  character_count?: number;
  reading_time?: number; // in minutes
  paragraph_count?: number;
  heading_count?: any;
  content_score?: number;
  readability_score?: number;
  keyword_density?: number;

  // SEO settings
  robots_directive?: string;
  sitemap_include?: boolean;
  sitemap_priority?: number;
  sitemap_changefreq?: string;

  // Links and relations
  internal_links?: any;
  external_links?: any;
  related_articles?: string[];

  // Analytics
  view_count?: number;
  unique_views?: number;
  bounce_rate?: number;
  avg_time_on_page?: number;
  social_shares?: any;
  backlinks_count?: number;

  // Search
  search_index?: any;
  indexed_at?: string;
  last_crawled_at?: string;

  // Publishing
  published_at?: string;
  scheduled_at?: string;
  expires_at?: string;

  // Versioning
  version?: number;
  revision_notes?: string;
  last_modified_by?: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Computed fields for UI (will be joined from other tables)
  author_name?: string;
  category_name?: string;
  category_slug?: string;
}

export interface ArticleStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  totalViews: number;
  avgReadingTime: number;
  recentArticles: number; // articles in last 7 days
}

export interface ArticlesFilters {
  search?: string;
  status?: 'published' | 'draft' | 'archived' | 'all';
  author?: string;
  tag?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'updated_at' | 'views' | 'likes' | 'title';
  sort_order?: 'asc' | 'desc';
}

export interface ArticlesListResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

import { supabase } from '../config/supabase';

export class ArticlesService {
  /**
   * Helper method to build article query with joins
   */
  private static buildArticleQuery() {
    return supabase
      .from('articles')
      .select(`
        *,
        categories!category_id (
          name,
          slug
        )
      `);
  }

  /**
   * Transform database article to UI format
   */
  private static transformArticle(dbArticle: any): Article {
    return {
      ...dbArticle,
      author: dbArticle.author_name || dbArticle.author || 'Unknown Author',
      tags: Array.isArray(dbArticle.keywords) ? dbArticle.keywords : (Array.isArray(dbArticle.tags) ? dbArticle.tags : []),
      views: dbArticle.view_count || dbArticle.views || 0,
      likes: dbArticle.like_count || dbArticle.likes || 0,
      excerpt: dbArticle.excerpt || '',
      status: dbArticle.status || 'draft',
      created_at: dbArticle.created_at || new Date().toISOString(),
      updated_at: dbArticle.updated_at || new Date().toISOString(),
      // Handle category data from join
      category_name: dbArticle.categories?.name || null,
      category_slug: dbArticle.categories?.slug || null
    };
  }

  /**
   * Get articles statistics
   */

  /**
   * Get articles statistics
   */
  static async getStats(): Promise<{ data: ArticleStats | null; error: any }> {
    try {
      console.log('ArticlesService: Calculating statistics from database');

      // Get total count by status
      const { data: statusCounts, error: statusError } = await supabase
        .from('articles')
        .select('status')
        .not('status', 'is', null);

      if (statusError) {
        console.error('ArticlesService: Error getting status counts:', statusError);
        return { data: null, error: statusError };
      }

      // Get total views
      const { data: viewsData, error: viewsError } = await supabase
        .from('articles')
        .select('view_count')
        .not('view_count', 'is', null);

      if (viewsError) {
        console.error('ArticlesService: Error getting views:', viewsError);
        return { data: null, error: viewsError };
      }

      // Get reading times
      const { data: readingData, error: readingError } = await supabase
        .from('articles')
        .select('reading_time')
        .not('reading_time', 'is', null);

      if (readingError) {
        console.error('ArticlesService: Error getting reading times:', readingError);
        return { data: null, error: readingError };
      }

      // Get recent articles (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count: recentCount, error: recentError } = await supabase
        .from('articles')
        .select('id', { count: 'exact' })
        .gte('created_at', weekAgo.toISOString());

      if (recentError) {
        console.error('ArticlesService: Error getting recent articles:', recentError);
        return { data: null, error: recentError };
      }

      // Calculate statistics
      const total = statusCounts?.length || 0;
      const published = statusCounts?.filter(a => a.status === 'published').length || 0;
      const draft = statusCounts?.filter(a => a.status === 'draft').length || 0;
      const archived = statusCounts?.filter(a => a.status === 'archived').length || 0;
      const totalViews = viewsData?.reduce((sum, a) => sum + (a.view_count || 0), 0) || 0;
      const avgReadingTime = readingData?.length > 0
        ? Math.round(readingData.reduce((sum, a) => sum + (a.reading_time || 0), 0) / readingData.length)
        : 0;

      const stats: ArticleStats = {
        total,
        published,
        draft,
        archived,
        totalViews,
        avgReadingTime,
        recentArticles: recentCount || 0
      };

      console.log('ArticlesService: Stats calculated successfully from database:', stats);
      return { data: stats, error: null };

    } catch (err) {
      console.error('ArticlesService: Error calculating stats:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get articles with pagination and filters
   */
  static async getArticles(
    page: number = 1,
    limit: number = 10,
    filters: ArticlesFilters = {}
  ): Promise<{ data: ArticlesListResponse | null; error: any }> {
    try {
      console.log('ArticlesService: Fetching articles from database', { page, limit, filters });

      // Build base query with joins
      let query = this.buildArticleQuery();

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.trim();
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply author filter
      if (filters.author) {
        query = query.ilike('author.raw_user_meta_data->>full_name', `%${filters.author}%`);
      }

      // Apply date filters
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'desc';

      // Map UI sort fields to database fields
      const dbSortBy = sortBy === 'views' ? 'view_count' : sortBy;
      query = query.order(dbSortBy, { ascending: sortOrder === 'asc' });

      // Get total count for pagination
      const { count: totalCount, error: countError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('ArticlesService: Error getting total count:', countError);
        console.log('ArticlesService: Falling back to demo data due to database error');

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
              status: 'published',
              tags: ['Demo', 'IQ Test'],
              views: 100,
              likes: 10,
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

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      // Execute query
      const { data: articlesData, error: articlesError } = await query;

      if (articlesError) {
        console.error('ArticlesService: Error fetching articles:', articlesError);
        return { data: null, error: articlesError };
      }

      if (!articlesData) {
        return { data: null, error: new Error('Không thể tải danh sách bài viết') };
      }

      // Transform articles
      const articles = articlesData.map(article => this.transformArticle(article));

      const total = totalCount || 0;
      const totalPages = Math.ceil(total / limit);

      const response: ArticlesListResponse = {
        articles,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      console.log('ArticlesService: Articles fetched successfully from database:', {
        returned: articles.length,
        total,
        page,
        totalPages
      });

      return { data: response, error: null };

    } catch (err) {
      console.error('ArticlesService: Error fetching articles:', err);
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
      console.log('ArticlesService: Updating article status in database:', { articleId, status });

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
        .eq('id', articleId)
        .select()
        .single();

      if (updateError) {
        console.error('ArticlesService: Error updating article status:', updateError);
        return { data: null, error: updateError };
      }

      if (!updatedData) {
        return { data: null, error: new Error('Không thể cập nhật trạng thái bài viết') };
      }

      const transformedArticle = this.transformArticle(updatedData);
      console.log('ArticlesService: Article status updated successfully in database');
      return { data: transformedArticle, error: null };

    } catch (err) {
      console.error('ArticlesService: Error updating article status:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Delete article
   */
  static async deleteArticle(articleId: string): Promise<{ data: boolean; error: any }> {
    try {
      console.log('ArticlesService: Deleting article from database:', articleId);

      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);

      if (deleteError) {
        console.error('ArticlesService: Error deleting article:', deleteError);
        return { data: false, error: deleteError };
      }

      console.log('ArticlesService: Article deleted successfully from database');
      return { data: true, error: null };

    } catch (err) {
      console.error('ArticlesService: Error deleting article:', err);
      return { data: false, error: err };
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
      console.log('ArticlesService: Bulk updating articles status in database:', { articleIds, status });

      if (!articleIds || articleIds.length === 0) {
        return { data: 0, error: null };
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
        console.error('ArticlesService: Error in bulk update:', updateError);
        return { data: 0, error: updateError };
      }

      const updatedCount = updatedData?.length || 0;
      console.log('ArticlesService: Bulk update completed in database:', updatedCount, 'articles updated');
      return { data: updatedCount, error: null };

    } catch (err) {
      console.error('ArticlesService: Error in bulk update:', err);
      return { data: 0, error: err };
    }
  }

  /**
   * Get unique authors
   */
  static async getAuthors(): Promise<string[]> {
    try {
      const { data: authorsData, error } = await supabase
        .from('articles')
        .select(`
          author:auth.users!articles_author_id_fkey(
            raw_user_meta_data
          )
        `)
        .not('author_id', 'is', null);

      if (error) {
        console.error('ArticlesService: Error getting authors:', error);
        return [];
      }

      const authors = authorsData
        ?.map(a => a.author?.raw_user_meta_data?.full_name || 'Unknown Author')
        .filter((author, index, self) => self.indexOf(author) === index)
        .sort() || [];

      return authors;
    } catch (err) {
      console.error('ArticlesService: Error getting authors:', err);
      return [];
    }
  }

  /**
   * Get unique tags
   */
  static async getTags(): Promise<string[]> {
    try {
      const { data: tagsData, error } = await supabase
        .from('articles')
        .select('keywords')
        .not('keywords', 'is', null);

      if (error) {
        console.error('ArticlesService: Error getting tags:', error);
        return [];
      }

      const tags = tagsData
        ?.flatMap(a => a.keywords || [])
        .filter((tag, index, self) => self.indexOf(tag) === index)
        .sort() || [];

      return tags;
    } catch (err) {
      console.error('ArticlesService: Error getting tags:', err);
      return [];
    }
  }

  /**
   * Update article tags
   */
  static async updateTags(
    articleId: string,
    tags: string[]
  ): Promise<{ data: Article | null; error: any }> {
    try {
      console.log('ArticlesService: Updating article tags in database:', { articleId, tags });

      const { data: updatedData, error: updateError } = await supabase
        .from('articles')
        .update({
          keywords: tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId)
        .select()
        .single();

      if (updateError) {
        console.error('ArticlesService: Error updating article tags:', updateError);
        return { data: null, error: updateError };
      }

      if (!updatedData) {
        return { data: null, error: new Error('Không thể cập nhật tags bài viết') };
      }

      const transformedArticle = this.transformArticle(updatedData);

      console.log('ArticlesService: Article tags updated successfully in database');
      return { data: transformedArticle, error: null };

    } catch (err) {
      console.error('ArticlesService: Error updating article tags:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update article author
   */
  static async updateAuthor(
    articleId: string,
    authorName: string
  ): Promise<{ data: Article | null; error: any }> {
    try {
      console.log('ArticlesService: Updating article author in database:', { articleId, authorName });

      // For now, we'll store the author name in a custom field
      // In the future, this should be linked to actual user IDs
      const { data: updatedData, error: updateError } = await supabase
        .from('articles')
        .update({
          author_name: authorName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId)
        .select()
        .single();

      if (updateError) {
        console.error('ArticlesService: Error updating article author:', updateError);
        return { data: null, error: updateError };
      }

      if (!updatedData) {
        return { data: null, error: new Error('Không thể cập nhật tác giả bài viết') };
      }

      const transformedArticle = this.transformArticle(updatedData);
      console.log('ArticlesService: Article author updated successfully in database');
      return { data: transformedArticle, error: null };

    } catch (err) {
      console.error('ArticlesService: Error updating article author:', err);
      return { data: null, error: err };
    }
  }
}

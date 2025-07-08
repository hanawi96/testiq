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

  // Author profile information from join
  user_profiles?: {
    id: string;
    full_name: string;
    email?: string;
    role: string;
  };

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
  author?: string; // Legacy author field for backward compatibility
  author_name?: string;
  category_name?: string;
  category_slug?: string;
  tags?: string[]; // Tags/keywords for UI
  views?: number; // View count for UI

  // Multiple categories support
  category_ids?: string[];
  category_names?: string[];
  categories?: any[];
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
  sort_by?: 'created_at' | 'updated_at' | 'views' | 'title';
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
import { LinkAnalyzer, type LinkAnalysis } from '../utils/link-analyzer';

export class ArticlesService {
  /**
   * Helper method to build article query with joins
   */
  private static buildArticleQuery() {
    console.log('ArticlesService: Building article query with joins...');

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

    console.log('ArticlesService: Article query built successfully');
    return query;
  }

  /**
   * Optimized method to get articles with single query and minimal joins
   * Reduces database round trips from 4+ to 1-2 queries
   */
  private static buildOptimizedArticleQuery() {
    console.log('ArticlesService: Building optimized article query...');

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
        created_at,
        updated_at,
        published_at,
        reading_time
      `);

    console.log('ArticlesService: Optimized article query built successfully');
    return query;
  }

  /**
   * Get tags for articles efficiently using junction table (batch operation)
   */
  private static async getTagsForArticles(articles: any[]): Promise<any[]> {
    if (!articles || articles.length === 0) {
      return [];
    }

    const articleIds = articles.map(article => article.id);

    // Fetch all article-tag relationships in one query
    const { data: articleTags, error: tagError } = await supabase
      .from('article_tags')
      .select(`
        article_id,
        tag_id,
        tags:tag_id (
          id,
          name,
          slug
        )
      `)
      .in('article_id', articleIds);

    if (tagError) {
      console.error('ArticlesService: Error fetching article tags:', tagError);
      return articles;
    }

    // Group tags by article_id
    const tagsByArticle = articleTags?.reduce((acc, relation) => {
      if (!acc[relation.article_id]) {
        acc[relation.article_id] = [];
      }
      if (relation.tags) {
        acc[relation.article_id].push(relation.tags.name);
      }
      return acc;
    }, {} as Record<string, string[]>) || {};

    // Add tags to articles
    return articles.map(article => ({
      ...article,
      tags: tagsByArticle[article.id] || []
    }));
  }

  /**
   * Get categories for articles efficiently using junction table (batch operation)
   */
  private static async getCategoriesForArticles(articles: any[]): Promise<any[]> {
    if (!articles || articles.length === 0) {
      return [];
    }

    const articleIds = articles.map(article => article.id);

    // Fetch all article-category relationships in one query
    const { data: articleCategories, error: relationError } = await supabase
      .from('article_categories')
      .select(`
        article_id,
        category_id,
        categories:category_id (
          id,
          name,
          slug,
          description
        )
      `)
      .in('article_id', articleIds);

    if (relationError) {
      console.error('ArticlesService: Error fetching article categories:', relationError);
      return articles;
    }

    // Group categories by article ID
    const articleCategoriesMap = new Map<string, any[]>();

    articleCategories?.forEach(relation => {
      const articleId = relation.article_id;
      if (!articleCategoriesMap.has(articleId)) {
        articleCategoriesMap.set(articleId, []);
      }
      if (relation.categories) {
        articleCategoriesMap.get(articleId)!.push(relation.categories);
      }
    });

    // Map categories to articles
    return articles.map(article => {
      const categories = articleCategoriesMap.get(article.id) || [];
      const categoryNames = categories.map(cat => cat.name);
      const categoryIds = categories.map(cat => cat.id);

      return {
        ...article,
        categories,
        category_names: categoryNames,
        category_ids: categoryIds,
        // Keep backward compatibility
        category_name: categoryNames.length > 0 ? categoryNames[0] : (article.category_name || null),
        category_id: categoryIds.length > 0 ? categoryIds[0] : (article.category_id || null)
      };
    });
  }

  /**
   * Get user profiles for articles efficiently (batch operation)
   */
  private static async getUserProfilesForArticles(articles: any[]): Promise<any[]> {
    if (!articles || articles.length === 0) {
      return [];
    }

    // Get unique author IDs
    const authorIds = [...new Set(articles
      .map(article => article.author_id)
      .filter(id => id)
    )];

    if (authorIds.length === 0) {
      return articles;
    }

    // Fetch all user profiles in one query
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .in('id', authorIds);

    if (profilesError) {
      console.error('ArticlesService: Error fetching user profiles:', profilesError);
      return articles;
    }

    // Create a map for quick lookup
    const profilesMap = new Map();
    userProfiles?.forEach(profile => {
      profilesMap.set(profile.id, profile);
    });

    // Map profiles to articles
    return articles.map(article => {
      const userProfile = profilesMap.get(article.author_id);
      return {
        ...article,
        user_profiles: userProfile || null
      };
    });
  }

  /**
   * Phân tích links trong content của bài viết
   */
  static async analyzeArticleLinks(articleId: string): Promise<{ data: LinkAnalysis | null; error: any }> {
    try {
      console.log('ArticlesService: Analyzing links for article:', articleId);

      // Fetch article content
      const { data: article, error: fetchError } = await supabase
        .from('articles')
        .select('content, slug')
        .eq('id', articleId)
        .single();

      if (fetchError) {
        console.error('ArticlesService: Error fetching article for link analysis:', fetchError);
        return { data: null, error: fetchError };
      }

      if (!article) {
        return { data: null, error: new Error('Article not found') };
      }

      // Analyze links in content
      const baseDomain = process.env.SITE_URL || 'localhost:4322';
      const linkAnalysis = LinkAnalyzer.analyzeContent(article.content, baseDomain);

      // Update article with link analysis
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          internal_links: linkAnalysis.internal_links,
          external_links: linkAnalysis.external_links,
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId);

      if (updateError) {
        console.error('ArticlesService: Error updating article with link analysis:', updateError);
        return { data: linkAnalysis, error: updateError };
      }

      console.log(`ArticlesService: Link analysis completed - ${linkAnalysis.total_internal} internal, ${linkAnalysis.total_external} external links`);
      return { data: linkAnalysis, error: null };

    } catch (err) {
      console.error('ArticlesService: Error analyzing article links:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Optimized method to transform multiple articles with pre-fetched related data
   */
  private static transformArticlesOptimized(
    articles: any[],
    categories: any[],
    tags: any[],
    profiles: any[]
  ): Article[] {
    // Create lookup maps for O(1) access
    const categoriesMap = new Map<string, any[]>();
    const tagsMap = new Map<string, any[]>();
    const profilesMap = new Map<string, any>();

    // Build categories map
    categories.forEach(relation => {
      const articleId = relation.article_id;
      if (!categoriesMap.has(articleId)) {
        categoriesMap.set(articleId, []);
      }
      if (relation.categories) {
        categoriesMap.get(articleId)!.push(relation.categories);
      }
    });

    // Build tags map
    tags.forEach(relation => {
      const articleId = relation.article_id;
      if (!tagsMap.has(articleId)) {
        tagsMap.set(articleId, []);
      }
      if (relation.tags) {
        tagsMap.get(articleId)!.push(relation.tags);
      }
    });

    // Build profiles map
    profiles.forEach(profile => {
      profilesMap.set(profile.id, profile);
    });

    // Transform all articles efficiently
    return articles.map(article => {
      const articleCategories = categoriesMap.get(article.id) || [];
      const articleTags = tagsMap.get(article.id) || [];
      const authorProfile = profilesMap.get(article.author_id);

      return {
        id: article.id,
        title: article.title || '',
        slug: article.slug || '',
        excerpt: article.excerpt || '',
        content: article.content || '',
        author: authorProfile?.full_name || 'Unknown Author',
        author_id: article.author_id,
        author_email: authorProfile?.email || '',
        author_avatar: authorProfile?.avatar_url || '',
        status: article.status || 'draft',
        categories: articleCategories,
        tags: articleTags.map(tag => tag.name || tag), // Extract name from tag objects
        category_names: articleCategories.map(cat => cat.name || cat), // Extract name from category objects
        views: article.view_count || 0,
        created_at: article.created_at,
        updated_at: article.updated_at,
        published_at: article.published_at,
        reading_time: article.reading_time || 0
      };
    });
  }

  /**
   * Transform database article to UI format
   */
  private static transformArticle(dbArticle: any): Article {
    return {
      ...dbArticle,
      // Use user_profiles data if available, fallback to existing author field
      author: dbArticle.user_profiles?.full_name || dbArticle.author_name || dbArticle.author || 'Unknown Author',
      tags: Array.isArray(dbArticle.tags) ? dbArticle.tags : (Array.isArray(dbArticle.keywords) ? dbArticle.keywords : []),
      views: dbArticle.view_count || dbArticle.views || 0,
      excerpt: dbArticle.excerpt || '',
      status: dbArticle.status || 'draft',
      created_at: dbArticle.created_at || new Date().toISOString(),
      updated_at: dbArticle.updated_at || new Date().toISOString(),
      // Handle category data from join
      category_name: dbArticle.categories?.name || null,
      category_slug: dbArticle.categories?.slug || null,
      // Include user_profiles data for admin interface
      user_profiles: dbArticle.user_profiles || null
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
   * Optimized method to get all related data in minimal queries
   */
  private static async getRelatedDataOptimized(articleIds: string[]) {
    if (articleIds.length === 0) {
      return { categories: [], tags: [], profiles: [] };
    }

    // Fetch all related data in parallel with single queries
    const [categoriesResult, tagsResult, profilesResult] = await Promise.all([
      // Get categories for all articles in one query
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

    return {
      categories: categoriesResult.data || [],
      tags: tagsResult.data || [],
      profiles: profilesResult.data || []
    };
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
      const startTime = performance.now();
      console.log('🚀 ArticlesService: Starting fetch articles', { page, limit, filters });

      // Check cache first (only for non-search requests to avoid stale search results)
      if (!filters.search) {
        const cacheKey = `articles:${page}:${limit}:${JSON.stringify(filters)}`;

        // Simple in-memory cache check (you can replace with Redis in production)
        if (typeof window !== 'undefined' && (window as any).__articlesCache) {
          const cached = (window as any).__articlesCache[cacheKey];
          if (cached && (Date.now() - cached.timestamp) < 60000) { // 1 minute cache
            console.log('📦 Cache hit for articles');
            return { data: cached.data, error: null };
          }
        }
      }

      // Use optimized query approach
      let query = this.buildOptimizedArticleQuery();

      // Apply search filter - optimized approach
      if (filters.search) {
        const searchStartTime = performance.now();
        const searchTerm = filters.search.trim();

        // Simple search in main fields first (fastest)
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);

        const searchEndTime = performance.now();
        console.log(`⏱️ Optimized search completed in ${(searchEndTime - searchStartTime).toFixed(2)}ms`);
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
      const countStartTime = performance.now();
      const { count: totalCount, error: countError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true });

      const countEndTime = performance.now();
      console.log(`⏱️ Count query completed in ${(countEndTime - countStartTime).toFixed(2)}ms`);

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
      const queryStartTime = performance.now();
      console.log('ArticlesService: Executing main query with offset:', offset, 'limit:', limit);
      const { data: articlesData, error: articlesError } = await query;

      const queryEndTime = performance.now();
      console.log(`⏱️ Main articles query completed in ${(queryEndTime - queryStartTime).toFixed(2)}ms`);

      if (articlesError) {
        console.error('ArticlesService: Error fetching articles - DETAILED:', {
          error: articlesError,
          message: articlesError.message,
          details: articlesError.details,
          hint: articlesError.hint,
          code: articlesError.code,
          query_info: {
            offset,
            limit,
            filters,
            page
          },
          // Serialize the full error object
          full_error: JSON.stringify(articlesError, Object.getOwnPropertyNames(articlesError))
        });
        return { data: null, error: articlesError };
      }

      if (!articlesData) {
        return { data: null, error: new Error('Không thể tải danh sách bài viết') };
      }

      // Get all related data in optimized way (parallel queries)
      const relatedDataStartTime = performance.now();
      const articleIds = articlesData.map(article => article.id);
      const { categories, tags, profiles } = await this.getRelatedDataOptimized(articleIds);
      const relatedDataEndTime = performance.now();
      console.log(`⏱️ All related data fetched in ${(relatedDataEndTime - relatedDataStartTime).toFixed(2)}ms`);

      // Transform articles with optimized data mapping
      const transformStartTime = performance.now();
      const articles = this.transformArticlesOptimized(articlesData, categories, tags, profiles);
      const transformEndTime = performance.now();
      console.log(`⏱️ Optimized articles transformation completed in ${(transformEndTime - transformStartTime).toFixed(2)}ms`);

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

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log('🎯 ArticlesService: Articles fetched successfully from database:', {
        returned: articles.length,
        total,
        page,
        totalPages,
        totalTime: `${totalTime.toFixed(2)}ms`
      });

      // Cache the result (only for non-search requests)
      if (!filters.search && typeof window !== 'undefined') {
        const cacheKey = `articles:${page}:${limit}:${JSON.stringify(filters)}`;
        if (!(window as any).__articlesCache) {
          (window as any).__articlesCache = {};
        }
        (window as any).__articlesCache[cacheKey] = {
          data: response,
          timestamp: Date.now()
        };
        console.log('📦 Cached articles result');
      }

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
   * Get unique tags from tags table
   */
  static async getTags(): Promise<string[]> {
    try {
      const { data: tagsData, error } = await supabase
        .from('tags')
        .select('name')
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('ArticlesService: Error getting tags:', error);
        return [];
      }

      return tagsData?.map(tag => tag.name) || [];
    } catch (err) {
      console.error('ArticlesService: Error getting tags:', err);
      return [];
    }
  }

  /**
   * Update article tags using tags and article_tags tables
   */
  static async updateTags(
    articleId: string,
    tags: string[]
  ): Promise<{ data: Article | null; error: any }> {
    try {
      console.log('ArticlesService: Updating article tags in database:', { articleId, tags });

      // 1. Create new tags if they don't exist
      for (const tagName of tags) {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-');
        await supabase
          .from('tags')
          .upsert({
            name: tagName,
            slug: slug
          }, {
            onConflict: 'name',
            ignoreDuplicates: true
          });
      }

      // 2. Get tag IDs
      const { data: tagIds, error: tagError } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', tags);

      if (tagError) {
        console.error('ArticlesService: Error getting tag IDs:', tagError);
        return { data: null, error: tagError };
      }

      // 3. Delete existing article_tags relationships
      await supabase
        .from('article_tags')
        .delete()
        .eq('article_id', articleId);

      // 4. Insert new relationships
      if (tagIds && tagIds.length > 0) {
        const relationships = tagIds.map(tag => ({
          article_id: articleId,
          tag_id: tag.id
        }));

        const { error: insertError } = await supabase
          .from('article_tags')
          .insert(relationships);

        if (insertError) {
          console.error('ArticlesService: Error inserting article_tags:', insertError);
          return { data: null, error: insertError };
        }
      }

      // 5. Update article updated_at
      const { data: updatedData, error: updateError } = await supabase
        .from('articles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', articleId)
        .select()
        .single();

      if (updateError) {
        console.error('ArticlesService: Error updating article:', updateError);
        return { data: null, error: updateError };
      }

      if (!updatedData) {
        return { data: null, error: new Error('Không thể cập nhật bài viết') };
      }

      // Get tags with full details
      const articlesWithTags = await this.getTagsForArticles([updatedData]);
      const transformedArticle = this.transformArticle(articlesWithTags[0]);

      console.log('ArticlesService: Article tags updated successfully in database');
      return { data: transformedArticle, error: null };

    } catch (err) {
      console.error('ArticlesService: Error updating article tags:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update article author (DEPRECATED - use updateAuthorById instead)
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

  /**
   * Update article author by user profile ID
   */
  static async updateAuthorById(
    articleId: string,
    authorId: string
  ): Promise<{ data: Article | null; error: any }> {
    try {
      console.log('ArticlesService: Updating article author by ID in database:', { articleId, authorId });

      // Step 1: Update the article
      const { data: updatedData, error: updateError } = await supabase
        .from('articles')
        .update({
          author_id: authorId,
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId)
        .select(`
          *,
          categories!category_id (
            name,
            slug
          )
        `)
        .single();

      if (updateError) {
        console.error('ArticlesService: Error updating article author by ID:', updateError);
        return { data: null, error: updateError };
      }

      if (!updatedData) {
        return { data: null, error: new Error('Không thể cập nhật tác giả bài viết') };
      }

      // Step 2: Fetch user profile separately if author_id exists
      if (updatedData.author_id) {
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, role')
          .eq('id', updatedData.author_id)
          .single();

        if (!profileError && userProfile) {
          updatedData.user_profiles = userProfile;
        }
      }

      const transformedArticle = this.transformArticle(updatedData);
      console.log('ArticlesService: Article author updated successfully by ID in database');
      return { data: transformedArticle, error: null };

    } catch (err) {
      console.error('ArticlesService: Error updating article author by ID:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update article category
   */
  static async updateCategory(
    articleId: string,
    categoryId: string | null
  ): Promise<{ data: Article | null; error: any }> {
    try {
      console.log('ArticlesService: Updating article category in database:', { articleId, categoryId });

      const { data: updatedData, error: updateError } = await supabase
        .from('articles')
        .update({
          category_id: categoryId,
          updated_at: new Date().toISOString()
        })
        .eq('id', articleId)
        .select(`
          *,
          categories!category_id (
            name,
            slug
          )
        `)
        .single();

      if (updateError) {
        console.error('ArticlesService: Error updating article category:', updateError);
        return { data: null, error: updateError };
      }

      if (!updatedData) {
        return { data: null, error: new Error('Không thể cập nhật danh mục bài viết') };
      }

      const transformedArticle = this.transformArticle(updatedData);

      console.log('ArticlesService: Article category updated successfully:', articleId);
      return { data: transformedArticle, error: null };

    } catch (err) {
      console.error('ArticlesService: Error updating article category:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update article categories using junction table (multiple categories)
   */
  static async updateCategories(
    articleId: string,
    categoryIds: string[]
  ): Promise<{ data: Article | null; error: any }> {
    try {
      console.log('ArticlesService: Updating article categories using junction table:', { articleId, categoryIds });

      // Validate category IDs exist and are active
      if (categoryIds.length > 0) {
        const { data: validCategories, error: validationError } = await supabase
          .from('categories')
          .select('id')
          .in('id', categoryIds)
          .eq('is_active', true);

        if (validationError) {
          console.error('ArticlesService: Error validating categories:', validationError);
          return { data: null, error: validationError };
        }

        const validCategoryIds = validCategories?.map(c => c.id) || [];
        const invalidIds = categoryIds.filter(id => !validCategoryIds.includes(id));

        if (invalidIds.length > 0) {
          return { data: null, error: new Error(`Danh mục không hợp lệ: ${invalidIds.join(', ')}`) };
        }
      }

      // Use the database function to update categories atomically
      const { error: updateError } = await supabase.rpc('update_article_categories', {
        article_uuid: articleId,
        new_category_ids: categoryIds
      });

      if (updateError) {
        console.error('ArticlesService: Error updating article categories:', updateError);
        return { data: null, error: updateError };
      }

      // Update article's updated_at timestamp
      const { data: updatedData, error: timestampError } = await supabase
        .from('articles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', articleId)
        .select('*')
        .single();

      if (timestampError) {
        console.error('ArticlesService: Error updating article timestamp:', timestampError);
        return { data: null, error: timestampError };
      }

      if (!updatedData) {
        return { data: null, error: new Error('Không thể cập nhật bài viết') };
      }

      // Get categories and tags with full details
      const articlesWithCategories = await this.getCategoriesForArticles([updatedData]);
      const articlesWithTags = await this.getTagsForArticles(articlesWithCategories);
      const transformedArticle = this.transformArticle(articlesWithTags[0]);

      console.log('ArticlesService: Article categories updated successfully:', articleId);

      return { data: transformedArticle, error: null };
    } catch (err) {
      console.error('ArticlesService: Exception in updateCategories:', err);
      return { data: null, error: err };
    }
  }
}

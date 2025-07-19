import { supabase } from '../config/supabase';

interface ViewTrackingResult {
  success: boolean;
  error?: string;
}

interface DailyViewsData {
  date: string;
  views: number;
}

export class ViewTrackingService {
  
  /**
   * Track article view - Simple approach với single RPC call
   */
  static async trackArticleView(
    articleId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<ViewTrackingResult> {
    try {
      // Single RPC call để increment cả daily và total views
      const { error } = await supabase.rpc('track_article_view', {
        p_article_id: articleId
      });

      if (error) {
        console.error('ViewTracking: Error tracking view:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('ViewTracking: Unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get daily views for last N days - Simplified
   */
  static async getDailyViews(days: number = 7): Promise<{
    data: DailyViewsData[] | null;
    error: any;
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('article_views_daily')
        .select('date, view_count')
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (error) return { data: null, error };

      // Aggregate by date
      const aggregated = data.reduce((acc: Record<string, number>, row) => {
        acc[row.date] = (acc[row.date] || 0) + row.view_count;
        return acc;
      }, {});

      const result: DailyViewsData[] = Object.entries(aggregated).map(([date, views]) => ({
        date,
        views
      }));

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get article views analytics - Simplified
   */
  static async getArticleViewsAnalytics(): Promise<{
    data: {
      totalViews: number;
      dailyViews: DailyViewsData[];
      topArticles: Array<{
        id: string;
        title: string;
        slug: string;
        views: number;
      }>;
      growthRate: number;
    } | null;
    error: any;
  }> {
    try {
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Parallel fetch for better performance
      const [dailyResult, allArticlesResult, topArticlesResult] = await Promise.all([
        this.getDailyViews(7),
        supabase
          .from('articles')
          .select('view_count')
          .eq('status', 'published'),
        // Top 5 articles in last 7 days using aggregated daily views
        supabase
          .from('article_views_daily')
          .select(`
            article_id,
            articles!inner(id, title, slug, status),
            view_count
          `)
          .eq('articles.status', 'published')
          .gte('date', sevenDaysAgo)
      ]);

      if (dailyResult.error) return { data: null, error: dailyResult.error };
      if (allArticlesResult.error) return { data: null, error: allArticlesResult.error };
      if (topArticlesResult.error) return { data: null, error: topArticlesResult.error };

      const dailyViews = dailyResult.data || [];
      const allArticles = allArticlesResult.data || [];
      const weeklyViewsData = topArticlesResult.data || [];

      // Aggregate views by article for last 7 days
      const articleViewsMap = new Map<string, { article: any; totalViews: number }>();

      weeklyViewsData.forEach(record => {
        const articleId = record.article_id;
        const article = record.articles;
        const views = record.view_count || 0;

        if (articleViewsMap.has(articleId)) {
          articleViewsMap.get(articleId)!.totalViews += views;
        } else {
          articleViewsMap.set(articleId, { article, totalViews: views });
        }
      });

      // Sort and get top 5
      const topArticles = Array.from(articleViewsMap.values())
        .sort((a, b) => b.totalViews - a.totalViews)
        .slice(0, 5)
        .map(item => ({
          id: item.article.id,
          title: item.article.title,
          slug: item.article.slug,
          views: item.totalViews
        }));

      // Calculate total views from ALL articles, not just top 5
      const totalViews = allArticles.reduce((sum, article) => sum + (article.view_count || 0), 0);

      // Simple growth calculation
      let growthRate = 0;
      if (dailyViews.length >= 6) {
        const firstHalf = dailyViews.slice(0, 3).reduce((sum, day) => sum + day.views, 0);
        const lastHalf = dailyViews.slice(-3).reduce((sum, day) => sum + day.views, 0);
        growthRate = firstHalf > 0 ? Math.round(((lastHalf - firstHalf) / firstHalf) * 100) : 0;
      }



      return {
        data: {
          totalViews,
          dailyViews,
          topArticles, // Already processed above
          growthRate,
          articlesCount: allArticles.length
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }


}

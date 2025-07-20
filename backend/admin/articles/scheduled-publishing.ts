/**
 * 🚀 SCHEDULED PUBLISHING SERVICE
 * Đơn giản, hiệu quả, tối ưu performance
 */

import { supabase } from '../../config/supabase';

export class ScheduledPublishingService {
  
  /**
   * 📅 Tìm và xuất bản các bài viết đã đến hạn
   * Chạy mỗi phút bởi cron job
   */
  static async processScheduledArticles(): Promise<{
    published: number;
    errors: string[];
  }> {
    console.log('🔄 Processing scheduled articles...');
    
    try {
      // 1. Tìm các bài viết scheduled đã đến hạn
      const { data: scheduledArticles, error: fetchError } = await supabase
        .from('articles')
        .select('id, title, scheduled_at')
        .eq('status', 'scheduled')
        .not('scheduled_at', 'is', null)
        .lte('scheduled_at', new Date().toISOString())
        .limit(50); // Giới hạn 50 bài/lần để tránh overload

      if (fetchError) {
        console.error('❌ Error fetching scheduled articles:', fetchError);
        return { published: 0, errors: [fetchError.message] };
      }

      if (!scheduledArticles || scheduledArticles.length === 0) {
        console.log('✅ No scheduled articles to publish');
        return { published: 0, errors: [] };
      }

      console.log(`📋 Found ${scheduledArticles.length} articles to publish`);

      // 2. Batch update để publish tất cả
      const articleIds = scheduledArticles.map(article => article.id);
      const now = new Date().toISOString();

      const { data: updatedArticles, error: updateError } = await supabase
        .from('articles')
        .update({
          status: 'published',
          published_at: now,
          updated_at: now
        })
        .in('id', articleIds)
        .select('id, title');

      if (updateError) {
        console.error('❌ Error publishing articles:', updateError);
        return { published: 0, errors: [updateError.message] };
      }

      const publishedCount = updatedArticles?.length || 0;
      console.log(`✅ Successfully published ${publishedCount} articles`);

      // 3. Log chi tiết các bài đã publish
      updatedArticles?.forEach(article => {
        console.log(`📰 Published: "${article.title}" (ID: ${article.id})`);
      });

      return { published: publishedCount, errors: [] };

    } catch (error) {
      console.error('💥 Unexpected error in processScheduledArticles:', error);
      return { 
        published: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  /**
   * 📊 Lấy thống kê các bài viết scheduled
   */
  static async getScheduledStats(): Promise<{
    total: number;
    upcoming: number;
    overdue: number;
  }> {
    try {
      const now = new Date().toISOString();

      // Đếm tổng số bài scheduled
      const { count: total } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .not('scheduled_at', 'is', null);

      // Đếm bài sắp tới (trong tương lai)
      const { count: upcoming } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gt('scheduled_at', now);

      // Đếm bài quá hạn (đáng lẽ đã publish)
      const { count: overdue } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .lte('scheduled_at', now);

      return {
        total: total || 0,
        upcoming: upcoming || 0,
        overdue: overdue || 0
      };

    } catch (error) {
      console.error('❌ Error getting scheduled stats:', error);
      return { total: 0, upcoming: 0, overdue: 0 };
    }
  }

  /**
   * 🔍 Lấy danh sách bài viết scheduled sắp tới
   */
  static async getUpcomingScheduled(limit: number = 10): Promise<{
    data: Array<{
      id: string;
      title: string;
      scheduled_at: string;
      author_name?: string;
    }>;
    error: any;
  }> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          scheduled_at,
          user_profiles!articles_author_id_fkey(full_name)
        `)
        .eq('status', 'scheduled')
        .not('scheduled_at', 'is', null)
        .gt('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(limit);

      if (error) {
        return { data: [], error };
      }

      const formattedData = data?.map(article => ({
        id: article.id,
        title: article.title,
        scheduled_at: article.scheduled_at,
        author_name: (article.user_profiles as any)?.full_name || 'Unknown'
      })) || [];

      return { data: formattedData, error: null };

    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * ⚡ Health check cho scheduled publishing
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    message: string;
    stats: any;
  }> {
    try {
      const stats = await this.getScheduledStats();
      
      if (stats.overdue > 0) {
        return {
          status: 'warning',
          message: `${stats.overdue} bài viết quá hạn chưa được publish`,
          stats
        };
      }

      return {
        status: 'healthy',
        message: 'Scheduled publishing hoạt động bình thường',
        stats
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Lỗi khi kiểm tra scheduled publishing',
        stats: null
      };
    }
  }
}

/**
 * 🎯 MAIN CRON JOB FUNCTION
 * Gọi function này từ cron job hoặc serverless function
 */
export async function runScheduledPublishing() {
  console.log('🚀 Starting scheduled publishing job...');
  
  const startTime = Date.now();
  const result = await ScheduledPublishingService.processScheduledArticles();
  const duration = Date.now() - startTime;
  
  console.log(`⏱️ Job completed in ${duration}ms`);
  console.log(`📊 Results: ${result.published} published, ${result.errors.length} errors`);
  
  if (result.errors.length > 0) {
    console.error('❌ Errors:', result.errors);
  }
  
  return result;
}

/**
 * 📋 EXPORT FOR API ENDPOINTS
 */
export const ScheduledPublishingAPI = {
  process: () => ScheduledPublishingService.processScheduledArticles(),
  stats: () => ScheduledPublishingService.getScheduledStats(),
  upcoming: (limit?: number) => ScheduledPublishingService.getUpcomingScheduled(limit),
  health: () => ScheduledPublishingService.healthCheck()
};

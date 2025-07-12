/**
 * Articles Module - Bulk Operations
 * Chứa tất cả logic bulk operations và batch processing cho articles module
 */

import { supabase } from '../../config/supabase';
import { ArticleQueries } from './queries';
import { ProcessingUtils } from './processing';

export class BulkOperationsUtils {
  /**
   * Bulk update articles status
   */
  static async bulkUpdateStatus(
    articleIds: string[],
    status: 'published' | 'draft' | 'archived'
  ): Promise<{ data: number; error: any }> {
    try {
      console.log('BulkOperationsUtils: Bulk updating articles status:', { articleIds, status });

      if (!articleIds || articleIds.length === 0) {
        return { data: 0, error: null };
      }

      const { data: updatedArticles, error } = await ArticleQueries.bulkUpdateStatus(articleIds, status);

      if (error) {
        console.error('BulkOperationsUtils: Error bulk updating articles status:', error);
        return { data: 0, error };
      }

      const updatedCount = updatedArticles?.length || 0;
      console.log('BulkOperationsUtils: Successfully bulk updated articles status:', updatedCount);
      return { data: updatedCount, error: null };

    } catch (err) {
      console.error('BulkOperationsUtils: Unexpected error bulk updating articles status:', err);
      return { data: 0, error: err };
    }
  }

  /**
   * OPTIMIZED: Bulk delete articles với single query
   */
  static async bulkDeleteArticles(articleIds: string[]): Promise<{ data: number; error: any }> {
    try {
      if (!articleIds || articleIds.length === 0) {
        return { data: 0, error: null };
      }

      // OPTIMIZED: Single batch delete thay vì loop
      const { error } = await supabase
        .from('articles')
        .delete()
        .in('id', articleIds);

      if (error) {
        console.error('BulkOperationsUtils: Error bulk deleting articles:', error);
        return { data: 0, error };
      }

      console.log('BulkOperationsUtils: Successfully bulk deleted articles:', articleIds.length);
      return { data: articleIds.length, error: null };

    } catch (err) {
      console.error('BulkOperationsUtils: Unexpected error bulk deleting articles:', err);
      return { data: 0, error: err };
    }
  }

  /**
   * Bulk update articles category
   */
  static async bulkUpdateCategory(
    articleIds: string[],
    categoryId: string | null
  ): Promise<{ data: number; error: any }> {
    try {
      console.log('BulkOperationsUtils: Bulk updating articles category:', { articleIds, categoryId });

      if (!articleIds || articleIds.length === 0) {
        return { data: 0, error: null };
      }

      const updateData = {
        category_id: categoryId,
        updated_at: new Date().toISOString()
      };

      const { data: updatedArticles, error } = await supabase
        .from('articles')
        .update(updateData)
        .in('id', articleIds)
        .select('id');

      if (error) {
        console.error('BulkOperationsUtils: Error bulk updating articles category:', error);
        return { data: 0, error };
      }

      const updatedCount = updatedArticles?.length || 0;
      console.log('BulkOperationsUtils: Successfully bulk updated articles category:', updatedCount);
      return { data: updatedCount, error: null };

    } catch (err) {
      console.error('BulkOperationsUtils: Unexpected error bulk updating articles category:', err);
      return { data: 0, error: err };
    }
  }

  /**
   * Bulk update articles author
   */
  static async bulkUpdateAuthor(
    articleIds: string[],
    authorId: string
  ): Promise<{ data: number; error: any }> {
    try {
      console.log('BulkOperationsUtils: Bulk updating articles author:', { articleIds, authorId });

      if (!articleIds || articleIds.length === 0) {
        return { data: 0, error: null };
      }

      const updateData = {
        author_id: authorId,
        updated_at: new Date().toISOString()
      };

      const { data: updatedArticles, error } = await supabase
        .from('articles')
        .update(updateData)
        .in('id', articleIds)
        .select('id');

      if (error) {
        console.error('BulkOperationsUtils: Error bulk updating articles author:', error);
        return { data: 0, error };
      }

      const updatedCount = updatedArticles?.length || 0;
      console.log('BulkOperationsUtils: Successfully bulk updated articles author:', updatedCount);
      return { data: updatedCount, error: null };

    } catch (err) {
      console.error('BulkOperationsUtils: Unexpected error bulk updating articles author:', err);
      return { data: 0, error: err };
    }
  }

  /**
   * Bulk toggle featured status
   */
  static async bulkToggleFeatured(
    articleIds: string[],
    featured: boolean
  ): Promise<{ data: number; error: any }> {
    try {
      console.log('BulkOperationsUtils: Bulk toggling articles featured status:', { articleIds, featured });

      if (!articleIds || articleIds.length === 0) {
        return { data: 0, error: null };
      }

      const updateData = {
        featured,
        updated_at: new Date().toISOString()
      };

      const { data: updatedArticles, error } = await supabase
        .from('articles')
        .update(updateData)
        .in('id', articleIds)
        .select('id');

      if (error) {
        console.error('BulkOperationsUtils: Error bulk toggling articles featured status:', error);
        return { data: 0, error };
      }

      const updatedCount = updatedArticles?.length || 0;
      console.log('BulkOperationsUtils: Successfully bulk toggled articles featured status:', updatedCount);
      return { data: updatedCount, error: null };

    } catch (err) {
      console.error('BulkOperationsUtils: Unexpected error bulk toggling articles featured status:', err);
      return { data: 0, error: err };
    }
  }

  /**
   * DEVELOPMENT: Add sample view count data for testing
   */
  static async addSampleViewData(): Promise<{ success: boolean; error?: any }> {
    try {
      console.log('BulkOperationsUtils: Adding sample view count data...');

      // Update articles with random view counts for demo purposes
      const { error } = await supabase
        .from('articles')
        .update({
          view_count: Math.floor(Math.random() * 1000) + 100,
          word_count: Math.floor(Math.random() * 2000) + 500
        })
        .is('view_count', null)
        .or('view_count.eq.0');

      if (error) {
        console.error('BulkOperationsUtils: Error adding sample data:', error);
        return { success: false, error };
      }

      console.log('BulkOperationsUtils: Successfully added sample view count data');
      return { success: true };

    } catch (err) {
      console.error('BulkOperationsUtils: Unexpected error adding sample data:', err);
      return { success: false, error: err };
    }
  }

  /**
   * OPTIMIZED: Bulk update articles reading time với batch processing
   */
  static async bulkRecalculateReadingTime(): Promise<{ data: number; error: any }> {
    try {
      // Get all articles with content
      const { data: articles, error: fetchError } = await supabase
        .from('articles')
        .select('id, content')
        .not('content', 'is', null);

      if (fetchError || !articles?.length) {
        return { data: 0, error: fetchError };
      }

      // OPTIMIZED: Process in batches to avoid memory issues
      const batchSize = 50;
      let totalUpdated = 0;

      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);

        // OPTIMIZED: Prepare batch updates
        const updates = batch.map(article => {
          const { wordCount, readingTime } = ProcessingUtils.calculateContentMetrics(article.content);
          return {
            id: article.id,
            word_count: wordCount,
            reading_time: readingTime,
            updated_at: new Date().toISOString()
          };
        });

        // OPTIMIZED: Batch update using upsert
        const { error: batchError, count } = await supabase
          .from('articles')
          .upsert(updates, { onConflict: 'id' })
          .select('id', { count: 'exact', head: true });

        if (batchError) {
          return { data: totalUpdated, error: batchError };
        }

        totalUpdated += count || 0;
      }

      return { data: totalUpdated, error: null };

    } catch (err) {
      return { data: 0, error: err };
    }
  }
}

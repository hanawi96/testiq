/**
 * Articles Module - Bulk Operations
 * Chứa tất cả logic bulk operations và batch processing cho articles module
 */

import { supabase } from '../../config/supabase';
import { ArticleQueries } from './queries';

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
   * Bulk delete articles
   */
  static async bulkDeleteArticles(articleIds: string[]): Promise<{ data: number; error: any }> {
    try {
      console.log('BulkOperationsUtils: Bulk deleting articles:', { articleIds });

      if (!articleIds || articleIds.length === 0) {
        return { data: 0, error: null };
      }

      // Delete articles one by one to ensure proper cleanup
      let deletedCount = 0;
      const errors: any[] = [];

      for (const articleId of articleIds) {
        const { error } = await ArticleQueries.deleteArticle(articleId);
        if (error) {
          errors.push({ articleId, error });
        } else {
          deletedCount++;
        }
      }

      if (errors.length > 0) {
        console.error('BulkOperationsUtils: Some articles failed to delete:', errors);
        return { 
          data: deletedCount, 
          error: `Failed to delete ${errors.length} articles. Successfully deleted ${deletedCount} articles.` 
        };
      }

      console.log('BulkOperationsUtils: Successfully bulk deleted articles:', deletedCount);
      return { data: deletedCount, error: null };

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
   * Bulk update articles reading time (recalculate for all articles)
   */
  static async bulkRecalculateReadingTime(): Promise<{ data: number; error: any }> {
    try {
      console.log('BulkOperationsUtils: Bulk recalculating reading time for all articles...');

      // Get all articles with content
      const { data: articles, error: fetchError } = await supabase
        .from('articles')
        .select('id, content')
        .not('content', 'is', null);

      if (fetchError) {
        console.error('BulkOperationsUtils: Error fetching articles for reading time calculation:', fetchError);
        return { data: 0, error: fetchError };
      }

      if (!articles || articles.length === 0) {
        return { data: 0, error: null };
      }

      let updatedCount = 0;
      const errors: any[] = [];

      // Update reading time for each article
      for (const article of articles) {
        const wordCount = article.content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

        const { error: updateError } = await supabase
          .from('articles')
          .update({
            word_count: wordCount,
            reading_time: readingTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', article.id);

        if (updateError) {
          errors.push({ articleId: article.id, error: updateError });
        } else {
          updatedCount++;
        }
      }

      if (errors.length > 0) {
        console.error('BulkOperationsUtils: Some articles failed to update reading time:', errors);
        return { 
          data: updatedCount, 
          error: `Failed to update ${errors.length} articles. Successfully updated ${updatedCount} articles.` 
        };
      }

      console.log('BulkOperationsUtils: Successfully recalculated reading time for articles:', updatedCount);
      return { data: updatedCount, error: null };

    } catch (err) {
      console.error('BulkOperationsUtils: Unexpected error recalculating reading time:', err);
      return { data: 0, error: err };
    }
  }
}

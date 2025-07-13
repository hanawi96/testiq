/**
 * Articles Module - Bulk Operations
 * Tối ưu hóa cho hiệu suất, ngắn gọn, dễ maintain, không thay đổi logic & UI
 */

import { supabase } from '../../config/supabase';
import { ArticleQueries } from './queries';
import { ProcessingUtils } from './processing';

type BulkResult = { data: number; error: any };
type SimpleResult = { success: boolean; error?: any };

const BATCH_SIZE = 50;

const nowISO = () => new Date().toISOString();

async function runBulkUpdate(
  articleIds: string[],
  updateData: Record<string, any>
): Promise<BulkResult> {
  if (!articleIds?.length) return { data: 0, error: null };

  const { data, error } = await supabase
    .from('articles')
    .update({ ...updateData, updated_at: nowISO() })
    .in('id', articleIds)
    .select('id');

  return error
    ? { data: 0, error }
    : { data: data?.length || 0, error: null };
}

export class BulkOperationsUtils {
  /** Bulk update articles status */
  static async bulkUpdateStatus(
    articleIds: string[],
    status: 'published' | 'draft' | 'archived'
  ): Promise<BulkResult> {
    if (!articleIds?.length) return { data: 0, error: null };
    // Giữ lại logic cũ với ArticleQueries nếu có lý do business
    const { data, error } = await ArticleQueries.bulkUpdateStatus(articleIds, status);
    return error
      ? { data: 0, error }
      : { data: data?.length || 0, error: null };
  }

  /** Bulk delete articles */
  static async bulkDeleteArticles(articleIds: string[]): Promise<BulkResult> {
    if (!articleIds?.length) return { data: 0, error: null };
    const { error } = await supabase.from('articles').delete().in('id', articleIds);
    return error
      ? { data: 0, error }
      : { data: articleIds.length, error: null };
  }

  /** Bulk update articles category */
  static async bulkUpdateCategory(articleIds: string[], categoryId: string | null): Promise<BulkResult> {
    return runBulkUpdate(articleIds, { category_id: categoryId });
  }

  /** Bulk update articles author */
  static async bulkUpdateAuthor(articleIds: string[], authorId: string): Promise<BulkResult> {
    return runBulkUpdate(articleIds, { author_id: authorId });
  }

  /** Bulk toggle featured status */
  static async bulkToggleFeatured(articleIds: string[], featured: boolean): Promise<BulkResult> {
    return runBulkUpdate(articleIds, { featured });
  }

  /** DEVELOPMENT: Add sample view count data for testing */
  static async addSampleViewData(): Promise<SimpleResult> {
    const { error } = await supabase
      .from('articles')
      .update({
        view_count: Math.floor(Math.random() * 1000) + 100,
        word_count: Math.floor(Math.random() * 2000) + 500,
      })
      .is('view_count', null)
      .or('view_count.eq.0');
    return error ? { success: false, error } : { success: true };
  }

  /** Bulk update articles reading time (batch) */
  static async bulkRecalculateReadingTime(): Promise<BulkResult> {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, content')
      .not('content', 'is', null);

    if (error || !articles?.length) return { data: 0, error };

    let totalUpdated = 0;

    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE);

      const updates = batch.map(a => {
        const { wordCount, readingTime } = ProcessingUtils.calculateContentMetrics(a.content);
        return { id: a.id, word_count: wordCount, reading_time: readingTime, updated_at: nowISO() };
      });

      const { error: batchError, count } = await supabase
        .from('articles')
        .upsert(updates, { onConflict: 'id' })
        .select('id', { count: 'exact', head: true });

      if (batchError) return { data: totalUpdated, error: batchError };
      totalUpdated += count || 0;
    }
    return { data: totalUpdated, error: null };
  }
}

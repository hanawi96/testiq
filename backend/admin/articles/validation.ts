/**
 * Articles Module - Validation Logic
 * Chứa tất cả logic validation cho articles module
 */

import { ArticleQueries } from './queries';
import type { CreateArticleData } from './types';

// Centralized error messages
export const ERROR_MESSAGES = {
  TITLE_REQUIRED: 'Tiêu đề không được để trống',
  TITLE_TOO_SHORT: 'Tiêu đề phải có ít nhất 3 ký tự',
  TITLE_TOO_LONG: 'Tiêu đề không được vượt quá 200 ký tự',
  CONTENT_REQUIRED: 'Nội dung không được để trống',
  CONTENT_TOO_SHORT: 'Nội dung phải có ít nhất 10 ký tự',
  SLUG_EXISTS: 'Slug đã tồn tại',
  ARTICLE_NOT_FOUND: 'Không tìm thấy bài viết',
  ARTICLE_CREATE_FAILED: 'Không thể tạo bài viết',
  ARTICLE_UPDATE_FAILED: 'Không thể cập nhật bài viết',
  STATUS_UPDATE_FAILED: 'Không thể cập nhật trạng thái bài viết'
} as const;

export class ValidationUtils {
  /**
   * OPTIMIZED: Comprehensive article data validation
   * Validates all required fields and business rules
   */
  static validateArticleData(articleData: CreateArticleData): { isValid: boolean; error?: string } {
    // Title validation
    const title = articleData.title?.trim();
    if (!title) {
      return { isValid: false, error: ERROR_MESSAGES.TITLE_REQUIRED };
    }
    if (title.length < 3) {
      return { isValid: false, error: ERROR_MESSAGES.TITLE_TOO_SHORT };
    }
    if (title.length > 200) {
      return { isValid: false, error: ERROR_MESSAGES.TITLE_TOO_LONG };
    }

    // Content validation
    const content = articleData.content?.trim();
    if (!content) {
      return { isValid: false, error: ERROR_MESSAGES.CONTENT_REQUIRED };
    }
    if (content.length < 10) {
      return { isValid: false, error: ERROR_MESSAGES.CONTENT_TOO_SHORT };
    }

    return { isValid: true };
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
}

/**
 * SAVE HANDLERS HOOK
 * Tách logic save (autosave & manual save) để dễ quản lý
 */

import { useState, useCallback } from 'react';
import { ArticlesService } from '../../../../../../backend';
import type { CreateArticleData } from '../../../../../../backend';
import { BlogService } from '../../../../../services/blog-service';
import { cleanFormData, validateFormData, extractImagesFromContent, calculateSaveProgress } from '../utils/articleEditorHelpers';
import type { FormData } from './useFormHandlers';

// Save action type
export type SaveAction = 'save' | 'autosave';

// Save result interface
export interface SaveResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Hook props
interface UseSaveHandlersProps {
  formData: FormData;
  isEditMode: boolean;
  currentArticleId: string | null;
  currentUserId: string | null;
  setLastSaved: (date: Date | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setValidationError: (error: string) => void;
  onSave?: (data: any) => void;
}

// Save states interface
export interface SaveStates {
  isSaving: boolean;
  isAutoSaving: boolean;
  isManualSaving: boolean;
  saveProgress: number;
}

export const useSaveHandlers = ({
  formData,
  isEditMode,
  currentArticleId,
  currentUserId,
  setLastSaved,
  setHasUnsavedChanges,
  setValidationError,
  onSave
}: UseSaveHandlersProps) => {

  // Save states
  const [saveStates, setSaveStates] = useState<SaveStates>({
    isSaving: false,
    isAutoSaving: false,
    isManualSaving: false,
    saveProgress: 0
  });

  // Update save progress
  const updateSaveProgress = useCallback((step: number, totalSteps: number = 5) => {
    const progress = calculateSaveProgress(step, totalSteps);
    setSaveStates(prev => ({ ...prev, saveProgress: progress }));
  }, []);

  // Main save handler
  const handleSave = useCallback(async (action: SaveAction): Promise<SaveResult> => {
    const isAutoSave = action === 'autosave';

    // PREVENT RACE CONDITION: Skip if already saving
    if (saveStates.isSaving) {
      return { success: false, error: 'Already saving' };
    }

    // Set saving state
    setSaveStates(prev => ({
      ...prev,
      isSaving: true,
      isAutoSaving: isAutoSave,
      isManualSaving: !isAutoSave,
      saveProgress: 0
    }));

    try {
      // Step 1: Validate form data
      updateSaveProgress(1);
      const cleanedData = cleanFormData(formData);
      const validation = validateFormData(cleanedData);
      
      if (!validation.isValid) {
        setValidationError(validation.errors.join(', '));
        return { success: false, error: validation.errors.join(', ') };
      }

      // Step 2: Prepare article data
      updateSaveProgress(2);
      // Chuyển readonly arrays thành mutable arrays để tránh lỗi TypeScript
      const tags = [...(cleanedData.tags || [])];
      const categories = [...(cleanedData.categories || [])];
      
      const articleData: Partial<CreateArticleData> = {
        // Core content
        title: cleanedData.title.trim(),
        content: cleanedData.content.trim(),
        excerpt: cleanedData.excerpt.trim(),
        
        // SEO
        meta_title: cleanedData.meta_title.trim(),
        meta_description: cleanedData.meta_description.trim(),
        slug: cleanedData.slug.trim(),
        focus_keyword: cleanedData.focus_keyword.trim(),

        // Media
        cover_image: cleanedData.cover_image?.trim() || undefined,
        cover_image_alt: cleanedData.cover_image_alt?.trim() || undefined,

        // Settings
        lang: cleanedData.lang,
        article_type: cleanedData.article_type,
        status: cleanedData.status,
        featured: cleanedData.is_featured,
        category_id: categories.length > 0 ? categories[0] : undefined,
        schema_type: cleanedData.schema_type,
        robots_directive: cleanedData.robots_noindex ? 'noindex,nofollow' : 'index,follow',

        // Publishing
        scheduled_at: cleanedData.scheduled_at || undefined,

        // Tags - NEW: Include tags trong autosave
        tags,
        // Categories - NEW: Include multiple categories trong autosave
        categories
      };

      let data: any = null;
      let error: any = null;

      // Step 3: Execute save operation
      updateSaveProgress(3);

      // UNIFIED AUTOSAVE FLOW: Sử dụng autosaveContent cho cả tạo mới và chỉnh sửa
      if (isAutoSave) {
        try {
          // 💾 AUTOSAVE: Sử dụng cùng một flow cho cả tạo mới và chỉnh sửa
          const result = await ArticlesService.autosaveContent(
            currentArticleId, // null khi tạo mới, articleId khi chỉnh sửa
            {
              ...articleData,
              author_id: cleanedData.author_id.trim() || null,
              // Đảm bảo keywords là mutable nếu có
              keywords: cleanedData.keywords ? [...cleanedData.keywords] : undefined
            } as any, // Type cast để tránh lỗi TypeScript
            currentUserId || ''
          );
          data = result.data;
          error = result.error;
        } catch (err: any) {
          error = err;
          console.error('Error during autosave:', err);
        }
      } else {
        // 🚀 MANUAL SAVE: Giữ nguyên logic cũ
        if (isEditMode && currentArticleId) {
          // Update bài viết đã có
          const result = await ArticlesService.updateArticle(
            currentArticleId,
            articleData as any, // Type cast để tránh lỗi
            cleanedData.author_id.trim() || null,
            currentUserId || undefined
          );
          data = result.data;
          error = result.error;
        } else {
          // Tạo bài viết mới trực tiếp
          const result = await ArticlesService.createArticle(
            articleData as any, // Type cast để tránh lỗi
            cleanedData.author_id.trim() || null
          );
          data = result.data;
          error = result.error;
        }
      }

      // Step 4: Handle result
      updateSaveProgress(4);

      if (error) {
        console.error('Save error:', error);
        setValidationError(isAutoSave ? '❌ Lỗi tự động lưu' : '❌ Có lỗi khi lưu bài viết');
        return { success: false, error: error.message || 'Save failed' };
      }

      if (data) {
        // Step 5: Success cleanup
        updateSaveProgress(5);

        // Update states
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setValidationError('');

        // Clear caches
        BlogService.clearCache();

        // Clear article edit cache to ensure fresh data on reload
        if (typeof ArticlesService.clearCachePattern === 'function') {
          ArticlesService.clearCachePattern(`article:edit:${data.id}`);
        }

        // Force clear browser cache for blog pages
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              if (cacheName.includes('blog') || cacheName.includes('article')) {
                caches.delete(cacheName).catch(() => {});
              }
            });
          }).catch(() => {});
        }

        // Call onSave callback if provided
        if (onSave) {
          onSave(data);
        }

        // Redirect logic for new articles
        if (!isEditMode) {
          if (isAutoSave) {
            // 🚀 AUTOSAVE: Chuyển sang edit mode với article ID (vì giờ đã tạo article thật)
            const newUrl = `/admin/articles/edit?id=${data.id}`;
            window.history.replaceState(
              { articleId: data.id, mode: 'edit' },
              `Edit Article - ${data.title || 'Untitled'}`,
              newUrl
            );
            console.log(`🔄 Autosave: Switched to edit mode for article ${data.id}`);
          } else {
            // 🚀 MANUAL SAVE: Redirect to edit article
            setTimeout(() => {
              window.location.href = `/admin/articles/edit?id=${data.id}`;
            }, 1500);
          }
        }

        return { success: true, data };
      }

      return { success: false, error: 'No data returned' };

    } catch (error: any) {
      console.error('Save error:', error);
      setValidationError('❌ Có lỗi xảy ra khi lưu bài viết');
      return { success: false, error: error.message || 'Unknown error' };
    } finally {
      // Reset saving state to allow future saves
      setSaveStates(prev => ({
        ...prev,
        isSaving: false,
        isAutoSaving: false,
        isManualSaving: false,
        saveProgress: 0
      }));
    }
  }, [
    formData,
    isEditMode,
    currentArticleId,
    currentUserId,
    saveStates.isSaving,
    setLastSaved,
    setHasUnsavedChanges,
    setValidationError,
    onSave,
    updateSaveProgress
  ]);

  // Auto save handler
  const handleAutoSave = useCallback(() => {
    return handleSave('autosave');
  }, [handleSave]);

  // Manual save handler
  const handleManualSave = useCallback(() => {
    return handleSave('save');
  }, [handleSave]);

  return {
    saveStates,
    handleSave,
    handleAutoSave,
    handleManualSave
  };
};

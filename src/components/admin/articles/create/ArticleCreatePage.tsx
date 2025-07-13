import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useArticleForm } from './hooks/useArticleForm';
import { useAutoSave } from './hooks/useAutoSave';
import ContentEditor from './components/ContentEditor';
import SettingsSidebar from './components/SettingsSidebar';
import PublishActions from './components/PublishActions';
import PreviewModal from './components/PreviewModal';
import type { ArticleCreatePageProps } from './types/articleForm';

export default function ArticleCreatePage({ 
  initialData, 
  mode = 'create',
  articleId 
}: ArticleCreatePageProps) {
  // Form state management
  const {
    formData,
    errors,
    isSubmitting,
    isDirty,
    isAutoSaving,
    lastSaved,
    setField,
    setMultipleFields,
    clearError,
    validateAllFields,
    setSubmitting,
    setAutoSaving,
    setLastSaved,
    resetForm,
    isValid
  } = useArticleForm(initialData);

  // Preview state
  const [previewState, setPreviewState] = useState({
    isOpen: false,
    isLoading: false
  });

  // Auto-save functionality
  const { saveNow } = useAutoSave(formData, isDirty, {
    enabled: true,
    interval: 30000, // 30 seconds
    onSaveStart: () => setAutoSaving(true),
    onSaveSuccess: (date) => {
      setAutoSaving(false);
      setLastSaved(date);
    },
    onSaveError: (error) => {
      setAutoSaving(false);
      console.error('Auto-save failed:', error);
    }
  });

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof typeof formData, value: any) => {
    setField(field, value);
  }, [setField]);

  // Handle save draft
  const handleSaveDraft = useCallback(async () => {
    if (!validateAllFields()) return;

    setSubmitting(true);
    try {
      await saveNow();
      // Show success message
      console.log('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setSubmitting(false);
    }
  }, [validateAllFields, setSubmitting, saveNow]);

  // Handle publish
  const handlePublish = useCallback(async () => {
    if (!validateAllFields()) return;

    setSubmitting(true);
    try {
      const publishData = {
        ...formData,
        status: 'published' as const,
        published_at: new Date().toISOString()
      };

      // Call API to publish
      console.log('Publishing article:', publishData);
      
      // Show success message and redirect
      window.location.href = '/admin/articles';
    } catch (error) {
      console.error('Failed to publish article:', error);
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateAllFields, setSubmitting]);

  // Handle schedule
  const handleSchedule = useCallback(async (scheduledDate: string) => {
    if (!validateAllFields()) return;

    setSubmitting(true);
    try {
      const scheduleData = {
        ...formData,
        status: 'draft' as const,
        scheduled_at: scheduledDate
      };

      // Call API to schedule
      console.log('Scheduling article:', scheduleData);
      
      // Show success message
    } catch (error) {
      console.error('Failed to schedule article:', error);
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateAllFields, setSubmitting]);

  // Handle preview
  const handlePreview = useCallback(() => {
    setPreviewState({ isOpen: true, isLoading: false });
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewState({ isOpen: false, isLoading: false });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with actions */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {mode === 'create' ? 'Tạo bài viết mới' : 'Chỉnh sửa bài viết'}
              </h1>
              
              {/* Auto-save indicator */}
              {isAutoSaving && (
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang lưu...</span>
                </div>
              )}
              
              {lastSaved && !isAutoSaving && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Đã lưu lúc {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Actions */}
            <PublishActions
              formData={formData}
              isSubmitting={isSubmitting}
              isDirty={isDirty}
              isAutoSaving={isAutoSaving}
              lastSaved={lastSaved}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
              onSchedule={handleSchedule}
              onPreview={handlePreview}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Editor - Left Column */}
          <div className="lg:col-span-2">
            <ContentEditor
              value={formData.content}
              onChange={(value) => handleFieldChange('content', value)}
              placeholder="Bắt đầu viết nội dung bài viết..."
              disabled={isSubmitting}
            />
          </div>

          {/* Settings Sidebar - Right Column */}
          <div className="lg:col-span-1">
            <SettingsSidebar
              formData={formData}
              errors={errors}
              onChange={handleFieldChange}
              onClearError={clearError}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={previewState.isOpen}
        isLoading={previewState.isLoading}
        data={formData}
        onClose={handleClosePreview}
      />

      {/* Error notification */}
      {Object.keys(errors).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg z-50"
        >
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-400 dark:text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Có lỗi trong form
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                Vui lòng kiểm tra và sửa các lỗi trước khi tiếp tục.
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * PUBLISH BOX COMPONENT
 * Sidebar component cho publish settings, save button, và status management
 */

import React, { useState, useEffect } from 'react';
import { RevertConfirmModal } from '../modals/RevertConfirmModal';
import type { FormData } from '../../hooks/useFormHandlers';
import type { SaveStates } from '../../hooks/useSaveHandlers';
import type { LoadingState } from '../LoadingStates';
import DateTimePicker from '../../../create/components/DateTimePicker';
import { FieldSkeleton } from '../SkeletonComponents';

interface PublishBoxProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  saveStates: SaveStates;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  hasChangesFromOriginal?: boolean; // Track changes from original (independent of autosave)
  hasDraftInDatabase?: boolean; // 🔧 NEW: Track if draft actually exists in database
  validationError: string;
  handleManualSave: () => void;
  handleManualSaveWithData: (data: any) => void; // For state management fix
  loadingState: LoadingState;
  shouldShowSkeleton?: boolean;
  isEditMode?: boolean; // True for editing existing article, false for new article
  formHandlers?: {
    handlePublishedDateChange: (date: string) => void;
  };
  onRevertToOriginal?: () => void; // Function to revert to original published version
}

export const PublishBox: React.FC<PublishBoxProps> = ({
  formData,
  setFormData,
  saveStates,
  lastSaved,
  hasUnsavedChanges,
  hasChangesFromOriginal = false,
  hasDraftInDatabase = false,
  validationError,
  handleManualSave,
  handleManualSaveWithData,
  loadingState,
  shouldShowSkeleton = false,
  isEditMode = false,
  formHandlers,
  onRevertToOriginal
}) => {
  // 🔧 FIX: Phân biệt bài viết mới vs bài viết đã publish
  const isNewArticle = !formData.published_at; // Chưa từng publish
  const isPublishedArticle = !!formData.published_at; // Đã từng publish

  // Debug logging
  console.log('🔍 PublishBox Debug:', {
    isEditMode,
    isNewArticle,
    isPublishedArticle,
    hasChangesFromOriginal,
    published_at: formData.published_at,
    status: formData.status
  });
  // State cho date editor
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [editingPublishedDate, setEditingPublishedDate] = useState(() => {
    // Initialize với published_date hiện tại hoặc ngày hiện tại (ISO string format cho DateTimePicker)
    if (formData.published_date) {
      return formData.published_date;
    }
    return new Date().toISOString();
  });

  // 🔧 NEW: State cho revert modal
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  // PHASE 2: Validation state
  const [localValidationErrors, setLocalValidationErrors] = useState<string[]>([]);

  // Update editingPublishedDate when formData.published_date changes
  useEffect(() => {
    if (formData.published_date) {
      setEditingPublishedDate(formData.published_date);
    }
  }, [formData.published_date]);

  // PHASE 2: Auto-clear validation errors when form data changes
  useEffect(() => {
    if (localValidationErrors.length > 0) {
      // Clear errors when user makes changes to fix validation issues
      setLocalValidationErrors([]);
    }
  }, [formData.title, formData.content, formData.slug, formData.excerpt, formData.scheduled_at]);

  // WordPress-style: Simple date change handler
  const handlePublishedDateChange = (newDate: string) => {
    if (!newDate) return;
    setEditingPublishedDate(newDate);
  };

  // WordPress-style: Save on OK button click
  const handleSavePublishedDate = () => {
    if (formHandlers?.handlePublishedDateChange) {
      formHandlers.handlePublishedDateChange(editingPublishedDate);
    } else {
      setFormData(prev => ({
        ...prev,
        published_date: editingPublishedDate
      }));
    }
    setShowDateEditor(false);
  };

  // PHASE 2: Comprehensive validation functions
  const validateBeforeSave = (data: FormData, action: 'draft' | 'publish' | 'schedule'): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Basic validation for all actions
    if (!data.title?.trim()) {
      errors.push('Tiêu đề không được để trống');
    }

    // Content length validation
    if (data.title && data.title.trim().length > 200) {
      errors.push('Tiêu đề không được vượt quá 200 ký tự');
    }

    // Draft-specific validation (relaxed)
    if (action === 'draft') {
      // For drafts, only require title
      // Content can be empty for drafts
      return {
        isValid: errors.length === 0,
        errors
      };
    }

    // Publish and Schedule require content
    if (!data.content?.trim()) {
      errors.push('Nội dung không được để trống');
    }

    if (data.content && data.content.trim().length < 50) {
      errors.push('Nội dung phải có ít nhất 50 ký tự');
    }

    // Publish-specific validation
    if (action === 'publish') {
      if (!data.slug?.trim()) {
        errors.push('Slug không được để trống khi xuất bản');
      }

      // 🔧 REMOVED: Excerpt validation - không bắt buộc excerpt khi xuất bản
      // if (!data.excerpt?.trim()) {
      //   errors.push('Mô tả ngắn không được để trống khi xuất bản');
      // }
    }

    // Schedule-specific validation
    if (action === 'schedule') {
      if (!data.scheduled_at) {
        errors.push('Vui lòng chọn thời gian để lên lịch xuất bản');
      } else {
        const scheduledDate = new Date(data.scheduled_at);
        const now = new Date();

        if (scheduledDate <= now) {
          errors.push('Thời gian lên lịch phải trong tương lai');
        }

        // Check if scheduled time is too far in future (1 year)
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        if (scheduledDate > oneYearFromNow) {
          errors.push('Thời gian lên lịch không được quá 1 năm');
        }
      }

      // Schedule also requires slug but not excerpt
      if (!data.slug?.trim()) {
        errors.push('Slug không được để trống khi lên lịch');
      }

      // 🔧 REMOVED: Excerpt validation - không bắt buộc excerpt khi lên lịch
      // if (!data.excerpt?.trim()) {
      //   errors.push('Mô tả ngắn không được để trống khi lên lịch');
      // }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // 🔧 NEW: Handle revert confirmation
  const handleRevertConfirm = async () => {
    if (!onRevertToOriginal) return;

    setIsReverting(true);
    try {
      await onRevertToOriginal();
      setShowRevertModal(false);
    } catch (error) {
      console.error('Error reverting:', error);
    } finally {
      setIsReverting(false);
    }
  };

  // Unified action handlers - PHASE 2: With comprehensive validation
  const handleSave = (action: 'draft' | 'publish' | 'schedule') => {
    // Clear previous validation errors
    setLocalValidationErrors([]);

    const updatedFormData = { ...formData };

    switch (action) {
      case 'draft':
        updatedFormData.status = 'draft';
        break;
      case 'publish':
        updatedFormData.status = 'published';
        break;
      case 'schedule':
        updatedFormData.status = 'scheduled';
        break;
    }

    // PHASE 2: Validate before save
    const validation = validateBeforeSave(updatedFormData, action);

    if (!validation.isValid) {
      // Show validation errors (chỉ hiển thị trong UI, không dùng alert)
      setLocalValidationErrors(validation.errors);
      return;
    }

    // Validation passed - proceed with save
    setFormData(updatedFormData);
    handleManualSaveWithData(updatedFormData);
  };

  if (shouldShowSkeleton) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" style={{ overflow: 'visible' }}>
        {/* Header với màu nền nhẹ nhàng */}
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 px-6 py-4 border-b border-blue-100/50 dark:border-blue-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Xuất bản</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Quản lý trạng thái và thời gian xuất bản</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <FieldSkeleton className="h-4 w-24 mb-1" />
                <FieldSkeleton className="h-3 w-32" />
              </div>
              <FieldSkeleton className="w-12 h-6 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <FieldSkeleton className="h-4 w-20 mb-1" />
                <FieldSkeleton className="h-3 w-28" />
              </div>
              <FieldSkeleton className="w-12 h-6 rounded-full" />
            </div>
            <FieldSkeleton className="h-10 w-full rounded-lg" />
            <FieldSkeleton className="h-10 w-full rounded-lg" />
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <FieldSkeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" style={{ overflow: 'visible' }}>
      {/* Header với màu nền nhẹ nhàng */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 px-6 py-4 border-b border-blue-100/50 dark:border-blue-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon với gradient đẹp */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Xuất bản</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Quản lý trạng thái và thời gian xuất bản</p>
            </div>
          </div>

          {/* Preview Button - Only show when published and has slug */}
          {formData.status === 'published' && formData.slug && (
            <button
              onClick={() => {
                const previewUrl = `/blog/${formData.slug}`;
                window.open(previewUrl, '_blank');
              }}
              className="px-3 py-1.5 text-sm bg-white/60 dark:bg-gray-800/60 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg transition-colors"
              title="Xem bài viết đã xuất bản"
            >
              Xem thử
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-4">

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bài nổi bật</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formData.is_featured ? 'Được đánh dấu nổi bật' : 'Bài viết thường'}
              </p>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                formData.is_featured ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  formData.is_featured ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Consolidated Published Articles Section */}
          {formData.status === 'published' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Thông tin xuất bản
              </label>

              {showDateEditor ? (
                <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Chỉnh sửa ngày xuất bản:
                    </label>
                    <DateTimePicker
                      label=""
                      value={editingPublishedDate}
                      onChange={handlePublishedDateChange}
                      disabled={false}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePublishedDate}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setShowDateEditor(false)}
                      className="px-3 py-1 text-xs bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <div>
                      Published on: <strong>{formData.published_date ? new Date(formData.published_date).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Bây giờ'}</strong>
                    </div>
                    <button
                      onClick={() => setShowDateEditor(true)}
                      className="ml-2 p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all duration-200"
                      title="Chỉnh sửa ngày xuất bản"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                  </div>


                </>
              )}
            </div>
          )}

          {/* WordPress-style Scheduling */}
          {(formData.status === 'draft' || formData.status === 'scheduled') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Lên lịch xuất bản
              </label>

              {formData.scheduled_at ? (
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Scheduled for: <strong>{new Date(formData.scheduled_at).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</strong>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, scheduled_at: '' }))}
                    className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs underline"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <DateTimePicker
                    label="Chọn thời gian xuất bản"
                    value={formData.scheduled_at}
                    onChange={(value) => {
                      // PHASE 2: Better validation with user-friendly feedback
                      if (value) {
                        const selectedDate = new Date(value);
                        const now = new Date();

                        if (selectedDate <= now) {
                          setLocalValidationErrors(['Thời gian lên lịch phải trong tương lai']);
                          return;
                        }

                        // Clear validation errors if time is valid
                        setLocalValidationErrors([]);
                      }

                      setFormData(prev => ({ ...prev, scheduled_at: value }));
                    }}
                    disabled={loadingState.isLoading}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Bài viết sẽ tự động xuất bản vào thời gian đã chọn
                  </div>
                </div>
              )}
            </div>
          )}



          {/* Save Status & Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Save Status Indicators */}
            <div className="space-y-3 mb-4">
              {validationError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    {validationError}
                  </span>
                </div>
              )}

              {/* PHASE 2: Local validation errors display */}
              {localValidationErrors.length > 0 && (
                <div className="space-y-2 px-3 py-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800/30">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                      Vui lòng kiểm tra các lỗi sau:
                    </span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {localValidationErrors.map((error, index) => (
                      <li key={index} className="text-sm text-orange-700 dark:text-orange-300 flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {saveStates.isAutoSaving && (
                <div className="flex items-center gap-3 px-3 py-2 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                  <div className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25"/>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {saveStates.isManualSaving ? 'Đang lưu...' : 'Đang tự động lưu...'}
                  </span>
                </div>
              )}

              {lastSaved && !hasUnsavedChanges && !saveStates.isAutoSaving && (
                <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800/30">
                  <div className="relative">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="absolute inset-0 w-4 h-4 rounded-full opacity-20 animate-ping bg-green-400"></div>
                  </div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Đã lưu {lastSaved.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}


            </div>

            {/* WordPress-style Action Buttons */}
            <div className="space-y-2">
              {/* Draft Articles: Save Draft + Publish in same row */}
              {formData.status === 'draft' && !formData.scheduled_at && (
                <div className="flex gap-3">
                  {/* Save Draft Button - Secondary */}
                  <button
                    onClick={() => handleSave('draft')}
                    disabled={saveStates.isManualSaving}
                    className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium border ${
                      saveStates.isManualSaving
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500'
                    }`}
                    title="Lưu nháp (Ctrl+S)"
                  >
                    {saveStates.isManualSaving ? (
                      <div className="w-4 h-4 animate-spin">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25"/>
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"/>
                        </svg>
                      </div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    )}
                    <span className="text-sm">{saveStates.isManualSaving ? 'Đang lưu...' : 'Lưu nháp'}</span>
                  </button>

                  {/* Publish Button - Primary */}
                  <button
                    onClick={() => handleSave('publish')}
                    disabled={saveStates.isSaving}
                    className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium ${
                      saveStates.isSaving
                        ? 'bg-blue-400 text-white cursor-not-allowed opacity-75'
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 text-white transform hover:scale-[1.02]'
                    }`}
                    title="Xuất bản ngay"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                    <span className="text-sm font-semibold">Xuất bản</span>
                  </button>
                </div>
              )}



              {/* Scheduled Articles: Save Draft + Schedule in same row */}
              {(formData.status === 'draft' || formData.status === 'scheduled') && formData.scheduled_at && (
                <div className="flex gap-3">
                  {/* Save Draft Button - Secondary */}
                  <button
                    onClick={() => handleSave('draft')}
                    disabled={saveStates.isSaving}
                    className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium border ${
                      saveStates.isSaving
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500'
                    }`}
                    title="Lưu nháp"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span className="text-sm">Lưu nháp</span>
                  </button>

                  {/* Schedule Button - Primary */}
                  <button
                    onClick={() => handleSave('schedule')}
                    disabled={saveStates.isSaving}
                    className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium ${
                      saveStates.isSaving
                        ? 'bg-orange-400 text-white cursor-not-allowed opacity-75'
                        : 'bg-orange-600 hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-500/25 text-white transform hover:scale-[1.02]'
                    }`}
                    title="Lên lịch xuất bản"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-sm font-semibold">{formData.status === 'scheduled' ? 'Cập nhật lịch' : 'Lên lịch'}</span>
                  </button>
                </div>
              )}

              {/* 🔧 FIX: Published Articles being edited - Show Update button */}
              {formData.status === 'published' && isEditMode && (
                <div className="space-y-2">
                  {/* Update Button - Primary */}
                  <button
                    onClick={() => handleSave('publish')}
                    disabled={saveStates.isManualSaving}
                    className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium ${
                      saveStates.isManualSaving
                        ? 'bg-green-400 text-white cursor-not-allowed opacity-75'
                        : 'bg-green-600 hover:bg-green-700 hover:shadow-lg text-white'
                    }`}
                    title="Cập nhật bài viết (Ctrl+S)"
                  >
                    {saveStates.isManualSaving ? (
                      <div className="w-4 h-4 animate-spin">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25"/>
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"/>
                        </svg>
                      </div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                      </svg>
                    )}
                    <span className="text-sm font-semibold">{saveStates.isManualSaving ? 'Đang cập nhật...' : 'Cập nhật'}</span>
                  </button>

                  {/* Revert to Original Button - Only show when draft actually exists in database */}
                  {hasChangesFromOriginal && hasDraftInDatabase && formData.status === 'published' && isEditMode && !saveStates.isManualSaving && (
                    <button
                      onClick={() => setShowRevertModal(true)}
                      disabled={saveStates.isManualSaving}
                      className="w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium border border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-400 dark:hover:border-orange-500"
                      title="Khôi phục về bản đã xuất bản (bỏ qua tất cả draft)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                      </svg>
                      <span className="text-sm">Khôi phục bản đã publish</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* 🔧 NEW: Revert Confirmation Modal */}
    <RevertConfirmModal
      isOpen={showRevertModal}
      onClose={() => setShowRevertModal(false)}
      onConfirm={handleRevertConfirm}
      isLoading={isReverting}
    />
    </>
  );
};

/**
 * PUBLISH BOX COMPONENT
 * Sidebar component cho publish settings, save button, và status management
 */

import React from 'react';
import type { FormData } from '../../hooks/useFormHandlers';
import type { SaveStates } from '../../hooks/useSaveHandlers';
import type { LoadingState } from '../../utils/articleEditorHelpers';
import DateTimePicker from '../../../create/components/DateTimePicker';
import { FieldSkeleton } from '../SkeletonComponents';

interface PublishBoxProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  saveStates: SaveStates;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  validationError: string;
  handleManualSave: () => void;
  loadingState: LoadingState;
  shouldShowSkeleton?: boolean;
}

export const PublishBox: React.FC<PublishBoxProps> = ({
  formData,
  setFormData,
  saveStates,
  lastSaved,
  hasUnsavedChanges,
  validationError,
  handleManualSave,
  loadingState,
  shouldShowSkeleton = false
}) => {

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
              className="px-3 py-1.5 text-sm bg-white/60 dark:bg-gray-800/60 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Xem bài viết đã xuất bản"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái xuất bản</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formData.scheduled_at && new Date(formData.scheduled_at) > new Date()
                  ? 'Đã lên lịch'
                  : formData.is_public ? 'Hiển thị công khai' : 'Chỉ riêng tư'}
              </p>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, is_public: !prev.is_public }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                formData.is_public ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  formData.is_public ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

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

          {/* Hiển thị thông tin ngày xuất bản (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Thông tin xuất bản
            </label>

            {formData.status === 'published' && formData.published_date ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                Đã xuất bản: {new Date(formData.published_date).toLocaleString('vi-VN')}
              </div>
            ) : formData.scheduled_at && new Date(formData.scheduled_at) > new Date() ? (
              <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                ⏰ Sẽ xuất bản: {new Date(formData.scheduled_at).toLocaleString('vi-VN')}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                📝 Chưa xuất bản
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <DateTimePicker
                  label="Hẹn ngày giờ đăng bài"
                  value={formData.scheduled_at}
                  onChange={(value) => {
                    // Validation: chỉ cho phép chọn ngày trong tương lai
                    if (value) {
                      const selectedDate = new Date(value);
                      const now = new Date();

                      if (selectedDate <= now) {
                        alert('⚠️ Vui lòng chọn thời gian trong tương lai để hẹn lịch đăng bài');
                        return;
                      }
                    }

                    setFormData(prev => ({ ...prev, scheduled_at: value }));
                  }}
                  disabled={loadingState.isLoading}
                />
              </div>

              {/* Clear scheduled date button */}
              {formData.scheduled_at && (
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, scheduled_at: '' }));
                  }}
                  className="mt-6 p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200"
                  title="Hủy lịch hẹn"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Helper text và status cho scheduled publishing */}
            <div className="space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                💡 Tự động xuất bản vào thời gian đã chọn
              </div>

              {formData.scheduled_at && (
                <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                  📅 Đã lên lịch: {new Date(formData.scheduled_at).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          </div>

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

              {saveStates.isAutoSaving && (
                <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {saveStates.isManualSaving ? 'Đang lưu...' : 'Đang tự động lưu...'}
                  </span>
                  <div className="w-20 h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-75 ease-out rounded-full"
                      style={{ width: `${saveStates.saveProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {lastSaved && !hasUnsavedChanges && !saveStates.isAutoSaving && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800/30">
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

            {/* Save Button */}
            <button
              onClick={() => handleManualSave()}
              disabled={saveStates.isSaving}
              className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 font-medium ${
                saveStates.isSaving
                  ? 'bg-blue-500 text-white cursor-not-allowed opacity-75'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-[1.02] text-white'
              }`}
              title={formData.is_public ? "Lưu và xuất bản (Ctrl+S)" : "Lưu nháp (Ctrl+S)"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>{formData.is_public ? 'Lưu và xuất bản' : 'Lưu nháp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

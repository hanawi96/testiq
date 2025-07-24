import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TagsService } from '../../../../backend';
import type { Tag } from '../../../../backend';
import { generateSlug } from '../../../utils/slug-generator';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOptimisticUpdate?: (updatedTag: Partial<Tag>) => void;
  tag?: Tag | null; // null for create, Tag for edit
}

export default function TagModal({ isOpen, onClose, onSuccess, onOptimisticUpdate, tag }: TagModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    slug: '',
    color: '#EF4444'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSlugGenerating, setIsSlugGenerating] = useState(false);

  const isEdit = !!tag;

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (tag) {
        // Edit mode - populate with existing data
        setFormData({
          name: tag.name,
          title: tag.title || '',
          description: tag.description || '',
          slug: tag.slug,
          color: tag.color
        });
      } else {
        // Create mode - reset form
        setFormData({
          name: '',
          title: '',
          description: '',
          slug: '',
          color: '#EF4444'
        });
      }
      setError('');
    }
  }, [isOpen, tag]);

  // Auto-generate slug only on initial create (when both name and slug are being set for first time)
  useEffect(() => {
    if (!isEdit && formData.name && !formData.slug) {
      const slug = generateSlug(formData.name);
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, isEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle manual slug generation
  const handleGenerateSlug = () => {
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên tag trước khi tạo slug');
      return;
    }

    setIsSlugGenerating(true);

    // Add slight delay for visual feedback
    setTimeout(() => {
      const newSlug = generateSlug(formData.name);
      setFormData(prev => ({ ...prev, slug: newSlug }));
      setIsSlugGenerating(false);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.name.trim()) {
        setError('Tên tag không được để trống');
        return;
      }

      if (!formData.slug.trim()) {
        setError('Slug không được để trống');
        return;
      }

      // Optimistic update for edit mode
      if (isEdit && onOptimisticUpdate) {
        onOptimisticUpdate({
          name: formData.name.trim(),
          title: formData.title.trim() || null,
          description: formData.description.trim() || null,
          slug: formData.slug.trim(),
          color: formData.color
        });
      }

      // Close modal immediately for better UX
      onClose();

      let result;
      if (isEdit && tag) {
        // Update existing tag
        console.log('TagModal: Updating tag:', tag.id, formData);
        result = await TagsService.updateTag(tag.id, {
          name: formData.name.trim(),
          title: formData.title.trim(),
          description: formData.description.trim(),
          slug: formData.slug.trim(),
          color: formData.color
        });
      } else {
        // Create new tag
        console.log('TagModal: Creating tag:', formData);
        result = await TagsService.createTag({
          name: formData.name.trim(),
          title: formData.title.trim() || undefined,
          description: formData.description.trim() || undefined,
          color: formData.color
        });
      }

      console.log('TagModal: API result:', result);

      if (result.error) {
        console.error('TagModal: Error:', result.error);
        setError(result.error.message || 'Có lỗi xảy ra');
        return;
      }

      console.log(`TagModal: Successfully ${isEdit ? 'updated' : 'created'} tag`);
      onSuccess();

    } catch (err: any) {
      console.error('TagModal: Error in handleSubmit:', err);
      setError(err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={handleClose}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-lg p-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 relative z-10 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Thiết kế mới giống ảnh */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Icon với background màu cam */}
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                  >
                    {isEdit ? (
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    ) : (
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    )}
                    {isEdit && (
                      <>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </>
                    )}
                  </svg>
                </div>

                {/* Tiêu đề và mô tả */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {isEdit ? 'Chỉnh sửa tag' : 'Tạo tag mới'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {isEdit ? 'Cập nhật thông tin tag hiện có' : 'Thêm tag mới cho hệ thống'}
                  </p>
                </div>
              </div>

              {/* Close button */}
              <div>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50"
                  title="Đóng"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tag Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tên tag *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nhập tên tag..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isLoading}
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="tag-slug"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  disabled={isLoading || isSlugGenerating || !formData.name.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Tạo slug từ tên tag"
                >
                  <svg
                    className={`w-4 h-4 ${isSlugGenerating ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                URL-friendly version của tên tag. Click
                <svg className="w-3 h-3 inline mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                để tạo từ tên tag
              </p>
            </div>

            {/* SEO Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SEO Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Tiêu đề tối ưu SEO..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tiêu đề này sẽ được sử dụng cho SEO và meta tags
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả ngắn về tag..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Color */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Màu sắc
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#EF4444"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 flex items-center"
              >
                {isLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isEdit ? 'Cập nhật' : 'Tạo tag'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

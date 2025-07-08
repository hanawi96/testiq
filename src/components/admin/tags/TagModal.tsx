import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TagsService } from '../../../../backend';
import type { Tag } from '../../../../backend';

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
    description: '',
    slug: '',
    color: '#EF4444'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!tag;

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (tag) {
        // Edit mode - populate with existing data
        setFormData({
          name: tag.name,
          description: tag.description || '',
          slug: tag.slug,
          color: tag.color
        });
      } else {
        // Create mode - reset form
        setFormData({
          name: '',
          description: '',
          slug: '',
          color: '#EF4444'
        });
      }
      setError('');
    }
  }, [isOpen, tag]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEdit && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, isEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          description: formData.description.trim(),
          slug: formData.slug.trim(),
          color: formData.color
        });
      } else {
        // Create new tag
        console.log('TagModal: Creating tag:', formData);
        result = await TagsService.createTag({
          name: formData.name.trim(),
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {isEdit ? 'Chỉnh sửa tag' : 'Tạo tag mới'}
            </h3>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
              <input
                type="text"
                id="slug"
                name="slug"
                required
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="tag-slug"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                URL-friendly version của tên tag
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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoriesService } from '../../../../backend';
import type { Category } from '../../../../backend';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOptimisticUpdate?: (updatedCategory: Partial<Category>) => void;
  category?: Category | null; // null for create, Category for edit
}

export default function CategoryModal({ isOpen, onClose, onSuccess, onOptimisticUpdate, category }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    status: 'active' as 'active' | 'inactive',
    meta_title: '',
    meta_description: '',
    color: '#3B82F6'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!category;

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens
      .trim();
  };

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        // Edit mode - populate form with category data
        setFormData({
          name: category.name,
          description: category.description,
          slug: category.slug,
          status: category.status,
          meta_title: category.meta_title || '',
          meta_description: category.meta_description || '',
          color: category.color || '#3B82F6'
        });
      } else {
        // Create mode - reset form
        setFormData({
          name: '',
          description: '',
          slug: '',
          status: 'active',
          meta_title: '',
          meta_description: '',
          color: '#3B82F6'
        });
      }
      setError('');
    }
  }, [isOpen, category]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'name') {
      // Auto-generate slug when name changes
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: generateSlug(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Tên danh mục không được để trống');
      return;
    }

    if (!formData.slug.trim()) {
      setError('Slug URL không được để trống');
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      setError('Slug chỉ được chứa chữ thường, số và dấu gạch ngang');
      return;
    }

    if (!formData.description.trim()) {
      setError('Mô tả không được để trống');
      return;
    }

    setIsLoading(true);

    try {
      let result;

      if (isEdit && category) {
        // Update existing category
        console.log('CategoryModal: Updating category:', category.id, formData);
        result = await CategoriesService.updateCategory(category.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          slug: formData.slug.trim(),
          status: formData.status,
          meta_title: formData.meta_title.trim() || undefined,
          meta_description: formData.meta_description.trim() || undefined,
          color: formData.color
        });
      } else {
        // Create new category
        console.log('CategoryModal: Creating category:', formData);
        result = await CategoriesService.createCategory({
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.status,
          meta_title: formData.meta_title.trim() || undefined,
          meta_description: formData.meta_description.trim() || undefined,
          color: formData.color
        });
      }

      console.log('CategoryModal: API result:', result);

      if (result.error) {
        console.error('CategoryModal: Error:', result.error);
        setError(result.error.message || 'Có lỗi xảy ra');
        return;
      }

      console.log('CategoryModal: Success, updated category:', result.data);

      // Success - optimistic update for immediate UI feedback
      if (isEdit && onOptimisticUpdate) {
        const optimisticData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          slug: formData.slug.trim(),
          status: formData.status,
          meta_title: formData.meta_title.trim() || undefined,
          meta_description: formData.meta_description.trim() || undefined,
          color: formData.color,
          updated_at: new Date().toISOString()
        };
        console.log('CategoryModal: Applying optimistic update:', optimisticData);
        onOptimisticUpdate(optimisticData);
      }

      // Close modal immediately for better UX
      onClose();

      // Then refresh data in background to ensure consistency
      onSuccess();

    } catch (err) {
      setError('Có lỗi xảy ra khi lưu danh mục');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={handleBackdropClick}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {isEdit ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
              </h3>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Name Field */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  placeholder="Nhập tên danh mục..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* Description Field */}
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  rows={3}
                  placeholder="Nhập mô tả danh mục..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 resize-none"
                />
              </div>

              {/* Slug Field */}
              <div className="mb-4">
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    placeholder="slug-url-danh-muc"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }))}
                      disabled={isLoading || !formData.name}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Tạo lại slug từ tên"
                    >
                      🔄
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  URL: /category/{formData.slug || 'slug-url'}
                </p>
              </div>

              {/* Color Field */}
              <div className="mb-4">
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
                    disabled={isLoading}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    disabled={isLoading}
                    placeholder="#3B82F6"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Meta Title Field */}
              <div className="mb-4">
                <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meta Title (SEO)
                </label>
                <input
                  type="text"
                  id="meta_title"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  placeholder="Tiêu đề SEO cho danh mục..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* Meta Description Field */}
              <div className="mb-6">
                <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meta Description (SEO)
                </label>
                <textarea
                  id="meta_description"
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  rows={2}
                  placeholder="Mô tả SEO cho danh mục..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{isEdit ? 'Cập nhật' : 'Tạo danh mục'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

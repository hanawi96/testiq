import React, { useState, useEffect } from 'react';
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
    
    // Prepare the data for the API call
    const categoryData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status,
      slug: formData.slug.trim(),
      meta_title: formData.meta_title.trim() || undefined,
      meta_description: formData.meta_description.trim() || undefined,
      color: formData.color
    };
    
    // Close modal immediately for better UX
    onClose();
    
    try {
      let result;

      if (isEdit && category) {
        // Update existing category
        console.log('CategoryModal: Updating category:', category.id, categoryData);
        result = await CategoriesService.updateCategory(category.id, categoryData);
      } else {
        // Create new category - Call immediately to minimize delay
        console.log('CategoryModal: Creating category:', categoryData);
        result = await CategoriesService.createCategory(categoryData);
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
          ...categoryData,
          updated_at: new Date().toISOString()
        };
        console.log('CategoryModal: Applying optimistic update:', optimisticData);
        onOptimisticUpdate(optimisticData);
      }

      // Then refresh data immediately to ensure consistency
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={handleClose}
          aria-hidden="true"
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-lg my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden">
          {/* Header - Thiết kế mới giống ảnh */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Icon với background màu tím */}
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
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
                      <>
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </>
                    ) : (
                      <>
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        <path d="M12 11v6"/>
                        <path d="M9 14h6"/>
                      </>
                    )}
                  </svg>
                </div>

                {/* Tiêu đề và mô tả */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {isEdit ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {isEdit ? 'Cập nhật thông tin danh mục hiện có' : 'Thêm danh mục mới cho hệ thống'}
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

          {/* Form Content */}
          <div className="p-6">
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 resize-none"
              />
            </div>

            {/* Slug Field */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 pr-10"
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

            {/* Color and Status Fields */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Color Field */}
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Màu sắc
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <input
                        type="color"
                        id="color"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        disabled={isLoading}
                        placeholder="#3B82F6"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Field */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trạng thái
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.status === 'active' ? 'Danh mục hiển thị công khai' : 'Danh mục bị ẩn khỏi công khai'}
                  </p>
                </div>
              </div>
            </div>

            {/* Meta Title Field */}
            <div>
              <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
            </div>

            {/* Meta Description Field */}
            <div>
              <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-4">
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
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 rounded-lg transition-colors flex items-center"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                )}
                <span>{isEdit ? 'Cập nhật' : 'Tạo danh mục'}</span>
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}

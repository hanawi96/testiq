import React, { useState, useEffect } from 'react';
import { AuthService, TagsService } from '../../../../backend';

export default function TagCreate() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#EF4444'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { isAdmin, error } = await AuthService.verifyAdminAccess();
        if (!isAdmin || error) {
          window.location.href = '/admin/login';
          return;
        }
      } catch (err) {
        window.location.href = '/admin/login';
        return;
      }
      setIsAuthChecking(false);
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (!formData.name.trim()) {
        setError('Tên tag không được để trống');
        return;
      }

      // Create tag
      const { data, error: createError } = await TagsService.createTag({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color
      });

      if (createError) {
        setError(createError.message || 'Có lỗi xảy ra khi tạo tag');
        return;
      }

      if (data) {
        setSuccess(`Tag "${data.name}" đã được tạo thành công!`);
        // Reset form
        setFormData({
          name: '',
          description: '',
          color: '#EF4444'
        });
        
        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '/admin/tags';
        }, 2000);
      }

    } catch (err: any) {
      console.error('Error creating tag:', err);
      setError(err?.message || 'Có lỗi xảy ra khi tạo tag. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Thêm Tag Mới
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tạo tag mới cho hệ thống bài viết
          </p>
        </div>
        <a
          href="/admin/tags"
          className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại
        </a>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              onChange={handleChange}
              placeholder="Nhập tên tag..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tên tag sẽ được hiển thị công khai
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
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả ngắn về tag này..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Mô tả giúp người dùng hiểu rõ hơn về tag này
            </p>
          </div>

          {/* Color */}
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Màu sắc
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-16 h-12 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                disabled={isLoading}
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#EF4444"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Màu sắc sẽ được sử dụng để hiển thị tag
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <a
              href="/admin/tags"
              className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Hủy
            </a>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 transition-colors flex items-center"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Tạo Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

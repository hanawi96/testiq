import React from 'react';
import AuthorSelector from './AuthorSelector';
import TagsInput from './TagsInput';

interface FormData {
  title: string;
  slug: string;
  excerpt: string;
  status: string;
  featured: boolean;
  author_id: string;
  tags: string[];
  [key: string]: any;
}

interface SettingsSidebarProps {
  formData: FormData;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onClearError: (field: string) => void;
  isSubmitting: boolean;
}

export default function SettingsSidebar({
  formData,
  errors,
  onChange,
  onClearError,
  isSubmitting
}: SettingsSidebarProps) {
  // Mock authors data - trong thực tế sẽ fetch từ API
  const authors = [
    {
      id: '1',
      full_name: 'Nguyễn Văn A',
      email: 'admin@example.com',
      role: 'admin',
      role_display_name: 'Quản trị viên'
    },
    {
      id: '2',
      full_name: 'Trần Thị B',
      email: 'editor@example.com',
      role: 'editor',
      role_display_name: 'Biên tập viên'
    },
    {
      id: '3',
      full_name: 'Lê Văn C',
      email: 'author@example.com',
      role: 'author',
      role_display_name: 'Tác giả'
    }
  ];
  return (
    <div className="space-y-6">
      {/* Modern Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-100/50 dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-700/50 overflow-hidden backdrop-blur-sm">
        <div className="p-6 bg-gradient-to-r from-primary-50/50 to-purple-50/50 dark:from-primary-900/10 dark:to-purple-900/10 border-b border-gray-100 dark:border-gray-700/50">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3 text-lg">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Thông tin bài viết
            </span>
          </h3>
        </div>

        <div className="p-6 space-y-6">
                {/* Title */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-500 to-purple-500"></div>
                    Tiêu đề bài viết
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => onChange('title', e.target.value)}
                      placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
                      disabled={isSubmitting}
                      className={`
                        w-full px-4 py-3.5 border-2 rounded-xl transition-all duration-300 ease-out
                        bg-white dark:bg-gray-800/50 backdrop-blur-sm
                        text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                        focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500
                        hover:border-primary-300 dark:hover:border-primary-600
                        ${errors.title
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-gray-200 dark:border-gray-700'
                        }
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'group-hover:shadow-lg group-hover:shadow-primary-500/10'}
                      `}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  {errors.title && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.title}
                    </div>
                  )}
                </div>

                {/* Slug */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    URL Slug
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="text-xs">yoursite.com/</span>
                    </div>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => onChange('slug', e.target.value)}
                      placeholder="url-slug-seo-friendly"
                      disabled={isSubmitting}
                      className={`
                        w-full pl-32 pr-4 py-3.5 border-2 rounded-xl transition-all duration-300 ease-out
                        bg-white dark:bg-gray-800/50 backdrop-blur-sm
                        text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                        focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500
                        hover:border-emerald-300 dark:hover:border-emerald-600
                        ${errors.slug
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-gray-200 dark:border-gray-700'
                        }
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'group-hover:shadow-lg group-hover:shadow-emerald-500/10'}
                      `}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    URL thân thiện SEO được tự động tạo từ tiêu đề
                  </div>
                  {errors.slug && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.slug}
                    </div>
                  )}
                </div>

                {/* Excerpt */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                    Mô tả ngắn
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => onChange('excerpt', e.target.value)}
                      placeholder="Viết mô tả ngắn gọn, hấp dẫn về nội dung bài viết để thu hút người đọc..."
                      rows={4}
                      disabled={isSubmitting}
                      className={`
                        w-full px-4 py-3.5 border-2 rounded-xl transition-all duration-300 ease-out resize-none
                        bg-white dark:bg-gray-800/50 backdrop-blur-sm
                        text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                        focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500
                        hover:border-amber-300 dark:hover:border-amber-600
                        ${errors.excerpt
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-gray-200 dark:border-gray-700'
                        }
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'group-hover:shadow-lg group-hover:shadow-amber-500/10'}
                      `}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Mô tả này sẽ hiển thị trong kết quả tìm kiếm và social media
                  </div>
                  {errors.excerpt && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.excerpt}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => onChange('status', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="draft">Nháp</option>
                    <option value="published">Đã xuất bản</option>
                    <option value="archived">Lưu trữ</option>
                  </select>
                </div>

                {/* Author Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tác giả
                  </label>
                  <AuthorSelector
                    value={formData.author_id || ''}
                    authors={authors}
                    onChange={(authorId) => onChange('author_id', authorId)}
                    disabled={isSubmitting}
                  />
                  {errors.author_id && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.author_id}
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <TagsInput
                    value={formData.tags || []}
                    onChange={(tags) => onChange('tags', tags)}
                    placeholder="Thêm tags cho bài viết..."
                    maxTags={20}
                    disabled={isSubmitting}
                  />
                  {errors.tags && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.tags}
                    </p>
                  )}
                </div>

                {/* Featured */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => onChange('featured', e.target.checked)}
                    disabled={isSubmitting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Bài viết nổi bật
                  </label>
                </div>
        </div>
      </div>
    </div>
  );
}

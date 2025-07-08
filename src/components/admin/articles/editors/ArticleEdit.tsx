import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArticlesService } from '../../../../../backend/admin/articles-service';
import { CategoriesService } from '../../../../../backend';
import { generateSlug } from '../../../../utils/slug-generator';
import { useAutoSave, useUnsavedChanges, useKeyboardShortcuts } from '../../../../hooks/useAutoSave';
import type { Article, Category } from '../../../../../backend';

// Lazy load ToastEditor chỉ khi ở client
const ToastEditor = React.lazy(() => import('./ToastEditor'));

interface ArticleEditProps {
  articleId?: string;
  onSave?: (article: Article) => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category_id: string;
  tags: string[];
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
  meta_title: string;
  meta_description: string;
}

export default function ArticleEdit({ articleId: propArticleId, onSave, onCancel }: ArticleEditProps) {
  // Get article ID from props or URL params
  const [articleId, setArticleId] = useState<string | null>(null);

  // State management
  const [article, setArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category_id: '',
    tags: [],
    status: 'draft',
    meta_title: '',
    meta_description: ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialDataRef = useRef<string>('');

  // Initialize article ID
  useEffect(() => {
    if (propArticleId) {
      setArticleId(propArticleId);
    } else if (typeof window !== 'undefined') {
      // Get from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const idFromUrl = urlParams.get('id');
      if (idFromUrl) {
        setArticleId(idFromUrl);
      } else {
        // Redirect to articles list if no ID
        window.location.href = '/admin/articles';
      }
    }
  }, [propArticleId]);

  // Load article data
  useEffect(() => {
    if (articleId) {
      loadArticle();
      loadCategories();
    }
  }, [articleId]);

  // Auto-save setup
  useEffect(() => {
    if (hasUnsavedChanges && !isLoading) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, formData]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadArticle = async () => {
    if (!articleId) return;

    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await ArticlesService.getArticleForEdit(articleId);
      
      if (error) {
        setError('Không thể tải bài viết');
        console.error('Error loading article:', error);
        return;
      }

      if (data) {
        setArticle(data);
        const newFormData: FormData = {
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          excerpt: data.excerpt || '',
          category_id: data.category_id || '',
          tags: data.tags?.map((tag: any) => typeof tag === 'string' ? tag : tag.id) || [],
          featured_image: data.cover_image || '',
          status: data.status || 'draft',
          meta_title: data.meta_title || '',
          meta_description: data.meta_description || ''
        };
        setFormData(newFormData);
        
        // Store initial data for comparison
        initialDataRef.current = JSON.stringify(newFormData);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải bài viết');
      console.error('Error in loadArticle:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await CategoriesService.getCategories();
      
      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data?.categories || []);
    } catch (err) {
      console.error('Error in loadCategories:', err);
    }
  };

  // Handle form changes
  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Check if data has changed
      const hasChanged = JSON.stringify(newData) !== initialDataRef.current;
      setHasUnsavedChanges(hasChanged);
      
      return newData;
    });
  }, []);

  // Handle title change with auto slug generation
  const handleTitleChange = useCallback((title: string) => {
    handleInputChange('title', title);
    
    // Auto-generate slug if it hasn't been manually edited
    if (article && title && (!formData.slug || formData.slug === generateSlug(article.title))) {
      const newSlug = generateSlug(title);
      handleInputChange('slug', newSlug);
    }
  }, [article, formData.slug, handleInputChange]);

  // Handle slug generation
  const handleGenerateSlug = useCallback(() => {
    if (formData.title) {
      const newSlug = generateSlug(formData.title);
      handleInputChange('slug', newSlug);
    }
  }, [formData.title, handleInputChange]);

  // Auto-save function
  const handleAutoSave = async () => {
    if (!hasUnsavedChanges || isAutoSaving || isSaving || !articleId) return;

    setIsAutoSaving(true);
    try {
      const { error } = await ArticlesService.autoSaveArticle(articleId, formData);
      
      if (!error) {
        setLastSaved(new Date());
        console.log('Auto-saved successfully');
      } else {
        console.error('Auto-save failed:', error);
      }
    } catch (err) {
      console.error('Auto-save error:', err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Handle save
  const handleSave = async (publishStatus?: 'draft' | 'published') => {
    if (!articleId) {
      setError('Không tìm thấy ID bài viết');
      return;
    }

    if (!formData.title.trim()) {
      setError('Tiêu đề không được để trống');
      return;
    }

    if (!formData.slug.trim()) {
      setError('Slug không được để trống');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const saveData = {
        ...formData,
        status: publishStatus || formData.status
      };

      const { data, error } = await ArticlesService.updateArticle(
        articleId,
        saveData,
        'current-user-id' // TODO: Get from auth context
      );
      
      if (error) {
        setError('Không thể lưu bài viết');
        console.error('Error saving article:', error);
        return;
      }

      if (data) {
        setArticle(data);
        initialDataRef.current = JSON.stringify(formData);
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        
        if (onSave) {
          onSave(data);
        }
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi lưu bài viết');
      console.error('Error in handleSave:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle preview toggle
  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Đang tải bài viết...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Chỉnh sửa bài viết
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {article?.title || 'Đang tải...'}
          </p>
        </div>

        {/* Auto-save status */}
        <div className="flex items-center space-x-4">
          {isAutoSaving && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">Đang lưu tự động...</span>
            </div>
          )}
          
          {lastSaved && !isAutoSaving && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Lưu lần cuối: {formatLastSaved(lastSaved)}
            </div>
          )}
          
          {hasUnsavedChanges && !isAutoSaving && (
            <div className="text-sm text-orange-600 dark:text-orange-400">
              Có thay đổi chưa lưu
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePreview}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {isPreviewMode ? 'Chỉnh sửa' : 'Xem trước'}
          </button>

          <button
            onClick={handleAutoSave}
            disabled={!hasUnsavedChanges || isAutoSaving}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Lưu ngay
          </button>
        </div>

        <div className="flex items-center space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
          )}

          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu nháp'}
          </button>

          <button
            onClick={() => handleSave('published')}
            disabled={isSaving}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Đang xuất bản...' : 'Xuất bản'}
          </button>
        </div>
      </div>

      {/* Form Content */}
      {!isPreviewMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiêu đề *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isSaving}
              />
            </div>

            {/* Slug */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="url-slug"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  disabled={!formData.title || isSaving}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Tạo slug từ tiêu đề"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                URL của bài viết. Click
                <svg className="w-3 h-3 inline mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                để tạo từ tiêu đề
              </p>
            </div>

            {/* Content Editor */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nội dung *
              </label>
              <React.Suspense fallback={
                <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500 dark:text-gray-400">Đang tải editor...</div>
                </div>
              }>
                <ToastEditor
                  content={formData.content}
                  onChange={(content) => handleInputChange('content', content)}
                  height="400px"
                />
              </React.Suspense>
            </div>

            {/* Excerpt */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tóm tắt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                placeholder="Tóm tắt ngắn gọn về bài viết..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={isSaving}
              >
                <option value="draft">Nháp</option>
                <option value="published">Đã xuất bản</option>
              </select>
            </div>

            {/* Category */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Danh mục
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={isSaving}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SEO Fields */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">SEO</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => handleInputChange('meta_title', e.target.value)}
                    placeholder="Tiêu đề SEO..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    placeholder="Mô tả SEO..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm resize-none"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1>{formData.title}</h1>
            {formData.excerpt && (
              <p className="text-lg text-gray-600 dark:text-gray-400 italic">
                {formData.excerpt}
              </p>
            )}
            <div dangerouslySetInnerHTML={{ __html: formData.content }} />
          </div>
        </div>
      )}
    </div>
  );
}

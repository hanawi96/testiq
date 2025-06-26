import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

// Lazy load ToastEditor chỉ khi ở client
const ToastEditor = React.lazy(() => import('./ToastEditor'));

// Demo categories
const DEMO_CATEGORIES = [
  { id: 1, name: 'Công nghệ', slug: 'cong-nghe' },
  { id: 2, name: 'Giáo dục', slug: 'giao-duc' },
  { id: 3, name: 'Sức khỏe', slug: 'suc-khoe' },
  { id: 4, name: 'Kinh doanh', slug: 'kinh-doanh' },
  { id: 5, name: 'Du lịch', slug: 'du-lich' },
  { id: 6, name: 'Thể thao', slug: 'the-thao' }
];

// Schema types for IQ test project
const SCHEMA_TYPES = [
  { value: 'Article', label: 'Article', description: 'Bài viết thông thường' },
  { value: 'BlogPosting', label: 'Blog Post', description: 'Bài blog về IQ' },
  { value: 'Quiz', label: 'Quiz', description: 'Bài test IQ/EQ' },
  { value: 'EducationalOrganization', label: 'Educational', description: 'Tổ chức giáo dục' },
  { value: 'Course', label: 'Course', description: 'Khóa học IQ' },
  { value: 'Assessment', label: 'Assessment', description: 'Đánh giá năng lực' },
  { value: 'WebPage', label: 'Web Page', description: 'Trang web thông thường' },
  { value: 'FAQPage', label: 'FAQ Page', description: 'Trang câu hỏi thường gặp' }
];

export default function ArticleEditor() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    meta_title: '',
    meta_description: '',
    slug: '',
    status: 'draft',
    focus_keyword: '',
    categories: [] as number[],
    tags: [] as string[],
    featured_image: '',
    is_public: true,
    is_featured: false,
    schema_type: 'Article',
    robots_noindex: false,
    published_date: new Date().toISOString().slice(0, 16)
  });

  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Chỉ render editor khi ở client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
      meta_title: title.length <= 60 ? title : title.substring(0, 60)
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async (status: 'draft' | 'published') => {
    setIsLoading(true);
    setSaveStatus('Đang lưu...');
    
    try {
      console.log('Saving article:', { ...formData, status });
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('✅ Đã lưu');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('❌ Lỗi');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  // SEO calculations với useMemo để optimize performance
  const seoAnalysis = useMemo(() => {
    const wordCount = formData.content.split(' ').filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    // SEO Score calculation
    let score = 0;
    const checks = [];
    
    // Title check
    const titleLength = formData.title.length;
    if (titleLength >= 10 && titleLength <= 60) {
      score += 20;
      checks.push({ name: 'Tiêu đề', status: 'good', message: 'Độ dài tối ưu (10-60 ký tự)' });
    } else {
      checks.push({ name: 'Tiêu đề', status: 'bad', message: 'Nên từ 10-60 ký tự' });
    }
    
    // Content check
    if (wordCount >= 300) {
      score += 25;
      checks.push({ name: 'Nội dung', status: 'good', message: `${wordCount} từ - Đủ dài` });
    } else {
      checks.push({ name: 'Nội dung', status: 'warning', message: `${wordCount} từ - Nên có ít nhất 300 từ` });
    }
    
    // Meta description check
    const metaLength = formData.meta_description.length;
    if (metaLength >= 120 && metaLength <= 160) {
      score += 20;
      checks.push({ name: 'Meta description', status: 'good', message: 'Độ dài tối ưu (120-160 ký tự)' });
    } else if (metaLength > 0) {
      checks.push({ name: 'Meta description', status: 'warning', message: `${metaLength} ký tự - Nên từ 120-160` });
    } else {
      checks.push({ name: 'Meta description', status: 'bad', message: 'Chưa có meta description' });
    }
    
    // Slug check
    if (formData.slug.length > 0) {
      score += 15;
      checks.push({ name: 'URL slug', status: 'good', message: 'Có URL slug' });
    } else {
      checks.push({ name: 'URL slug', status: 'bad', message: 'Cần có URL slug' });
    }
    
    // Focus keyword check
    if (formData.focus_keyword) {
      const keyword = formData.focus_keyword.toLowerCase();
      const titleHasKeyword = formData.title.toLowerCase().includes(keyword);
      const contentHasKeyword = formData.content.toLowerCase().includes(keyword);
      
      if (titleHasKeyword && contentHasKeyword) {
        score += 20;
        checks.push({ name: 'Từ khóa', status: 'good', message: 'Xuất hiện trong title và content' });
      } else if (titleHasKeyword || contentHasKeyword) {
        score += 10;
        checks.push({ name: 'Từ khóa', status: 'warning', message: 'Cần xuất hiện trong cả title và content' });
      } else {
        checks.push({ name: 'Từ khóa', status: 'bad', message: 'Từ khóa không xuất hiện' });
      }
    } else {
      checks.push({ name: 'Từ khóa', status: 'bad', message: 'Chưa có từ khóa chính' });
    }
    
    return { wordCount, readingTime, score, checks };
  }, [formData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 border-b border-purple-400/40 sticky top-0 z-10 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-white to-purple-200 rounded-xl flex items-center justify-center shadow-lg border border-white/20 shrink-0">
                <span className="text-purple-600 text-base sm:text-lg">✨</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-white drop-shadow-sm truncate">
                  Tạo bài viết mới
                </h1>
                <p className="text-xs sm:text-sm text-purple-100 hidden sm:block">Viết và xuất bản nội dung chất lượng</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {saveStatus && (
                <span className="text-xs sm:text-sm text-purple-800 bg-white/90 px-2 sm:px-3 py-1 rounded-full font-medium shadow-sm hidden sm:inline">
                  {saveStatus}
                </span>
              )}
              <button
                onClick={() => handleSave('draft')}
                disabled={isLoading}
                className="px-3 sm:px-5 py-2 sm:py-2.5 text-purple-600 bg-white/90 hover:bg-white border border-white/30 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-1 sm:gap-2 shadow-lg hover:shadow-white/25 font-medium text-xs sm:text-sm"
              >
                <span className="text-xs sm:text-sm">💾</span>
                <span className="hidden sm:inline">Lưu nháp</span>
                <span className="sm:hidden">Lưu</span>
              </button>
              <button
                onClick={() => handleSave('published')}
                disabled={isLoading}
                className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-1 sm:gap-2 shadow-lg hover:shadow-amber-400/50 font-medium text-xs sm:text-sm"
              >
                <span className="text-xs sm:text-sm">🚀</span>
                <span className="hidden sm:inline">Xuất bản</span>
                <span className="sm:hidden">Đăng</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Left Column - Content */}
          <div className="flex-1 lg:w-0 space-y-4 sm:space-y-6">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200"
            >
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Tiêu đề bài viết..."
                className="w-full text-xl sm:text-2xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none bg-transparent"
              />
              
              {/* URL Slug */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 shrink-0">🔗</span>
                  <span className="text-xs text-gray-400 hidden sm:inline">yoursite.com/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="url-slug"
                    className="flex-1 text-xs font-mono text-gray-700 bg-transparent border-none outline-none placeholder-gray-400"
                  />
                </div>
              </div>
            </motion.div>

            {/* Content Editor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200"
            >
              <div className="mb-4">

              </div>
              
              {isClient ? (
                <React.Suspense fallback={
                  <div className="border border-gray-300 rounded-lg bg-gray-50 h-64 sm:min-h-[500px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-gray-600 text-sm">Đang khởi tạo editor...</p>
                    </div>
                  </div>
                }>
                  <ToastEditor
                    content={formData.content}
                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                    placeholder="Bắt đầu viết bài..."
                    height="750px"
                  />
                </React.Suspense>
              ) : (
                <div className="border border-gray-300 rounded-lg bg-gray-50 h-64 sm:min-h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-pulse h-6 w-6 sm:h-8 sm:w-8 bg-blue-300 rounded-full mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm">Chuẩn bị editor...</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Excerpt */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tóm tắt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Tóm tắt ngắn gọn về bài viết..."
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-80 space-y-4 sm:space-y-6">
            {/* Publish Settings - Order 1 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Chế độ</span>
                  <div className="flex items-center">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, is_public: !prev.is_public }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.is_public ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.is_public ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {formData.is_public ? '🌐 Công khai' : '🔒 Riêng tư'}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Bài nổi bật</span>
                  <div className="flex items-center">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.is_featured ? 'bg-amber-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.is_featured ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {formData.is_featured ? '⭐ Featured' : '📝 Thường'}
                </div>

                {/* Date Fields */}
                <div className="pt-3 border-t border-gray-100 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📅 Ngày xuất bản
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.published_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, published_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Categories - Order 2 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh mục</h3>
              <div className="space-y-2 sm:space-y-3">
                {DEMO_CATEGORIES.map(cat => (
                  <div key={cat.id} className="group">
                    <label className="flex items-center p-2 sm:p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(cat.id)}
                          onChange={() => handleCategoryToggle(cat.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                          formData.categories.includes(cat.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 group-hover:border-blue-400'
                        }`}>
                          {formData.categories.includes(cat.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className={`ml-3 text-sm font-medium transition-colors duration-200 ${
                        formData.categories.includes(cat.id) 
                          ? 'text-blue-900' 
                          : 'text-gray-700 group-hover:text-blue-800'
                      }`}>
                        {cat.name}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              
              {/* Selected Categories Summary */}
              {formData.categories.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Đã chọn:</span>
                    <span className="text-xs text-blue-600 font-medium">
                      {formData.categories.length} danh mục
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.categories.map(catId => {
                      const category = DEMO_CATEGORIES.find(cat => cat.id === catId);
                      return category ? (
                        <span
                          key={catId}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                        >
                          {category.name}
                          <button
                            onClick={() => handleCategoryToggle(catId)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Tags - Order 3 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Nhập tag và nhấn Enter"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Featured Image - Order 4 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ảnh đại diện</h3>
              <div className="space-y-3">
                <input
                  type="url"
                  value={formData.featured_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                  placeholder="URL ảnh hoặc upload..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm">
                  📁 Upload ảnh
                </button>
                {formData.featured_image && (
                  <div className="mt-3">
                    <img
                      src={formData.featured_image}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* SEO Settings Section - Full Width Below Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 sm:mt-12"
        >
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                🔍 Cài đặt SEO
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">
                Tối ưu hóa bài viết cho công cụ tìm kiếm
              </p>
            </div>
            
            <div className="p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* SEO Form */}
                <div className="flex-1 lg:w-0 space-y-4 sm:space-y-6">
                  {/* Google Preview - First */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      🔍 Google Preview
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                      <div className="text-xs text-green-700 mb-1 break-all">
                        yoursite.com/blog/{formData.slug || 'article-slug'}
                      </div>
                      <div className="text-blue-600 text-sm sm:text-lg font-medium hover:underline cursor-pointer mb-1 leading-tight">
                        {formData.meta_title || formData.title || 'Tiêu đề bài viết của bạn'}
                      </div>
                      <div className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        {formData.meta_description || formData.excerpt || 'Mô tả ngắn gọn về bài viết sẽ hiển thị ở đây...'}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Xem trước cách bài viết hiển thị trên Google
                    </p>
                  </div>

                  {/* Focus Keyword */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Từ khóa chính
                    </label>
                    <input
                      type="text"
                      value={formData.focus_keyword}
                      onChange={(e) => setFormData(prev => ({ ...prev, focus_keyword: e.target.value }))}
                      placeholder="Nhập từ khóa chính..."
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Từ khóa mà bạn muốn bài viết này xếp hạng
                    </p>
                  </div>

                  {/* Meta Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📝 Meta Title ({formData.meta_title.length}/60)
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                      placeholder="Tiêu đề hiển thị trên Google..."
                      maxLength={60}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <div className={`text-xs mt-1 ${
                      formData.meta_title.length >= 50 && formData.meta_title.length <= 60 ? 'text-green-600' :
                      formData.meta_title.length > 60 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      Tối ưu: 50-60 ký tự
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📄 Meta Description ({formData.meta_description.length}/160)
                    </label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="Mô tả ngắn gọn hiển thị trên Google..."
                      maxLength={160}
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <div className={`text-xs mt-1 ${
                      formData.meta_description.length >= 120 && formData.meta_description.length <= 160 ? 'text-green-600' :
                      formData.meta_description.length > 160 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      Tối ưu: 120-160 ký tự
                    </div>
                  </div>
                </div>

                {/* SEO Score Dashboard */}
                <div className="w-full lg:w-80 space-y-4 sm:space-y-6">
                  {/* Schema & SEO Settings */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                      ⚙️ Schema & SEO
                    </h3>
                    
                    {/* Schema Type */}
                    <div className="mb-4 sm:mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                        📋 Schema Type
                      </label>
                      <select
                        value={formData.schema_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, schema_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        {SCHEMA_TYPES.map(schema => (
                          <option key={schema.value} value={schema.value}>
                            {schema.label} - {schema.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Robots Meta */}
                    <div className="pt-3 sm:pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            🤖 Robots Index
                          </label>
                          <p className="text-xs text-gray-500">
                            {formData.robots_noindex ? 'Không cho phép index' : 'Cho phép index'}
                          </p>
                        </div>
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, robots_noindex: !prev.robots_noindex }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 shrink-0 ${
                            formData.robots_noindex ? 'bg-red-600' : 'bg-green-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.robots_noindex ? 'translate-x-1' : 'translate-x-6'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        {formData.robots_noindex ? '🚫 noindex' : '✅ index'}
                      </div>
                    </div>
                  </div>

                  {/* SEO Score Dashboard */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 sm:p-6 border border-blue-200 lg:sticky lg:top-24">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      📊 SEO Score
                    </h3>
                    
                    {/* Overall Score */}
                    <div className="text-center mb-4 sm:mb-6">
                      <div className={`text-3xl sm:text-4xl font-bold mb-2 ${
                        seoAnalysis.score >= 80 ? 'text-green-600' :
                        seoAnalysis.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {seoAnalysis.score}
                        <span className="text-base sm:text-lg text-gray-500">/100</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-3">
                        <div 
                          className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${
                            seoAnalysis.score >= 80 ? 'bg-green-500' :
                            seoAnalysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${seoAnalysis.score}%` }}
                        ></div>
                      </div>
                      
                      <div className={`text-sm font-medium ${
                        seoAnalysis.score >= 80 ? 'text-green-700' :
                        seoAnalysis.score >= 60 ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        {seoAnalysis.score >= 80 ? 'Xuất sắc' :
                         seoAnalysis.score >= 60 ? 'Tốt' : 'Cần cải thiện'}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div className="text-center bg-white rounded-lg p-2 sm:p-3">
                        <div className="text-lg sm:text-xl font-bold text-blue-600">{seoAnalysis.wordCount}</div>
                        <div className="text-xs text-gray-500">Số từ</div>
                      </div>
                      <div className="text-center bg-white rounded-lg p-2 sm:p-3">
                        <div className="text-lg sm:text-xl font-bold text-green-600">{seoAnalysis.readingTime}</div>
                        <div className="text-xs text-gray-500">Phút đọc</div>
                      </div>
                    </div>

                    {/* SEO Checklist - Compact */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 text-sm">Điểm kiểm tra:</h4>
                      {seoAnalysis.checks.map((check, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs shrink-0 ${
                            check.status === 'good' ? 'bg-green-500 text-white' :
                            check.status === 'warning' ? 'bg-yellow-500 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            {check.status === 'good' ? '✓' : check.status === 'warning' ? '!' : '✗'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">{check.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO Tips - Full Width Below */}
              <div className="mt-4 sm:mt-6 bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  💡 Tips SEO
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 shrink-0">•</span>
                    <span>Sử dụng từ khóa chính trong tiêu đề và nội dung</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 shrink-0">•</span>
                    <span>Meta description nên hấp dẫn và có call-to-action</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 shrink-0">•</span>
                    <span>URL slug ngắn gọn và chứa từ khóa</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 shrink-0">•</span>
                    <span>Nội dung ít nhất 300 từ để tối ưu SEO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
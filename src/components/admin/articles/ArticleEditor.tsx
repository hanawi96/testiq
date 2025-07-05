import React, { useState, useEffect, useMemo } from 'react';

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

// Demo authors
const DEMO_AUTHORS = [
  { 
    id: 1, 
    name: 'Nguyễn Minh Tuấn', 
    email: 'tuan@iqtest.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'Editor',
    specialty: 'Psychology & IQ Tests'
  },
  { 
    id: 2, 
    name: 'Trần Thị Hương', 
    email: 'huong@iqtest.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    role: 'Content Writer',
    specialty: 'Educational Content'
  },
  { 
    id: 3, 
    name: 'Lê Văn Đức', 
    email: 'duc@iqtest.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'Senior Writer',
    specialty: 'Cognitive Assessment'
  },
  { 
    id: 4, 
    name: 'Phạm Thị Lan', 
    email: 'lan@iqtest.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: 'Research Writer',
    specialty: 'Brain Training & Development'
  }
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
    published_date: new Date().toISOString().slice(0, 16),
    author_id: 1
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Tạo bài viết mới
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Viết và xuất bản nội dung chất lượng</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saveStatus && (
                <span className="text-sm text-gray-600 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {saveStatus}
                </span>
              )}
              <button
                onClick={() => handleSave('draft')}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Lưu nháp
              </button>
              <button
                onClick={() => handleSave('published')}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Xuất bản
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Thông tin cơ bản</h2>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tiêu đề bài viết
                  </label>
                  {formData.title && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.title.length}/100
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
                  className="w-full px-3 py-2 text-lg font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              {/* URL Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL Slug
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="font-mono">yoursite.com/</span>
                  </div>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="url-slug-seo-friendly"
                    className="flex-1 px-3 py-2 font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.slug && (
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(formData.title) }))}
                      className="px-3 py-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                      title="Tạo lại từ tiêu đề"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  URL thân thiện SEO được tự động tạo từ tiêu đề
                </p>
              </div>
            </div>
          </div>

          {/* Content Editor Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nội dung bài viết</h2>
              </div>
              {formData.content && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                    {formData.content.split(' ').filter(word => word.length > 0).length} từ
                  </span>
                  <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                    ~{Math.ceil(formData.content.split(' ').filter(word => word.length > 0).length / 200)} phút đọc
                  </span>
                </div>
              )}
            </div>

            <div>
              {isClient ? (
                <React.Suspense fallback={
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 h-96 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Đang khởi tạo trình soạn thảo...</p>
                    </div>
                  </div>
                }>
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <ToastEditor
                      content={formData.content}
                      onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                      placeholder="Bắt đầu viết nội dung tuyệt vời của bạn..."
                      height="500px"
                    />
                  </div>
                </React.Suspense>
              ) : (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-pulse">
                      <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48 mx-auto mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Excerpt Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tóm tắt bài viết</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {formData.excerpt.length}/200
              </span>
            </div>

            <div className="space-y-3">
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Viết tóm tắt ngắn gọn và hấp dẫn để thu hút độc giả..."
                rows={4}
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tóm tắt tốt sẽ hiển thị trong kết quả tìm kiếm và mạng xã hội
              </p>
            </div>
          </div>

          {/* Settings and Metadata Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Article Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cài đặt bài viết</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chế độ công khai</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.is_public ? 'Hiển thị công khai' : 'Chỉ riêng tư'}
                    </p>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, is_public: !prev.is_public }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      formData.is_public ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      formData.is_featured ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_featured ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ngày xuất bản
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.published_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, published_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Categories Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Danh mục</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {DEMO_CATEGORIES.map((cat) => (
                  <label
                    key={cat.id}
                    className="relative flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(cat.id)}
                      onChange={() => handleCategoryToggle(cat.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>

              {formData.categories.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      Đã chọn
                    </span>
                    <span className="text-xs text-blue-700 dark:text-blue-400 bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">
                      {formData.categories.length} danh mục
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.categories.map(catId => {
                      const category = DEMO_CATEGORIES.find(cat => cat.id === catId);
                      return category ? (
                        <span
                          key={catId}
                          className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 text-xs rounded"
                        >
                          {category.name}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryToggle(catId);
                            }}
                            className="ml-1 w-3 h-3 text-blue-600 dark:text-blue-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Tags and Featured Image Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-6">
                {/* Tags */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tags</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Nhập tag và nhấn Enter..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <button
                        onClick={() => {
                          if (tagInput.trim()) {
                            const newTag = tagInput.trim().toLowerCase();
                            if (!formData.tags.includes(newTag)) {
                              setFormData(prev => ({
                                ...prev,
                                tags: [...prev.tags, newTag]
                              }));
                            }
                            setTagInput('');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Thêm
                      </button>
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-900 dark:text-green-300">
                            Tags được thêm
                          </span>
                          <span className="text-xs text-green-700 dark:text-green-400 bg-green-200 dark:bg-green-800 px-2 py-1 rounded">
                            {formData.tags.length} tags
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300 text-xs rounded"
                            >
                              #{tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="ml-1 w-3 h-3 text-green-600 dark:text-green-400 hover:text-red-600 dark:hover:text-red-400"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Featured Image */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ảnh đại diện</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.featured_image}
                        onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                        placeholder="Nhập URL ảnh..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <button className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload
                      </button>
                    </div>
                    {formData.featured_image && (
                      <div className="relative bg-gray-50 dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
                        <img
                          src={formData.featured_image}
                          alt="Preview"
                          className="w-full h-20 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                          {formData.featured_image}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Author Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tác giả</h2>
            </div>

            {/* Current Author Display */}
            {(() => {
              const currentAuthor = DEMO_AUTHORS.find(author => author.id === formData.author_id);
              return currentAuthor ? (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentAuthor.avatar}
                      alt={currentAuthor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {currentAuthor.name}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        {currentAuthor.role}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {currentAuthor.specialty}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Author Selection */}
            <select
              value={formData.author_id}
              onChange={(e) => setFormData(prev => ({ ...prev, author_id: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {DEMO_AUTHORS.map(author => (
                <option key={author.id} value={author.id}>
                  {author.name} - {author.role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SEO Settings Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cài đặt SEO</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Google Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Google Preview
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-xs text-green-700 dark:text-green-400 mb-1 break-all">
                  yoursite.com/blog/{formData.slug || 'article-slug'}
                </div>
                <div className="text-blue-600 dark:text-blue-400 text-lg font-medium mb-1 leading-tight">
                  {formData.meta_title || formData.title || 'Tiêu đề bài viết của bạn'}
                </div>
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {formData.meta_description || formData.excerpt || 'Mô tả ngắn gọn về bài viết sẽ hiển thị ở đây...'}
                </div>
              </div>
            </div>

            {/* SEO Score */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                SEO Score
              </h3>
              <div className="text-center mb-4">
                <div className={`text-3xl font-bold mb-2 ${
                  seoAnalysis.score >= 80 ? 'text-green-600' :
                  seoAnalysis.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {seoAnalysis.score}
                  <span className="text-lg text-gray-500 dark:text-gray-400">/100</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                  <div
                    className={`h-3 rounded-full ${
                      seoAnalysis.score >= 80 ? 'bg-green-500' :
                      seoAnalysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${seoAnalysis.score}%` }}
                  ></div>
                </div>
                <div className={`text-sm font-medium ${
                  seoAnalysis.score >= 80 ? 'text-green-700 dark:text-green-400' :
                  seoAnalysis.score >= 60 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'
                }`}>
                  {seoAnalysis.score >= 80 ? 'Xuất sắc' :
                   seoAnalysis.score >= 60 ? 'Tốt' : 'Cần cải thiện'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center bg-white dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{seoAnalysis.wordCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Số từ</div>
                </div>
                <div className="text-center bg-white dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">{seoAnalysis.readingTime}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Phút đọc</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Focus Keyword */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Từ khóa chính
              </label>
              <input
                type="text"
                value={formData.focus_keyword}
                onChange={(e) => setFormData(prev => ({ ...prev, focus_keyword: e.target.value }))}
                placeholder="Nhập từ khóa chính..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Meta Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Title ({formData.meta_title.length}/60)
              </label>
              <input
                type="text"
                value={formData.meta_title}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                placeholder="Tiêu đề hiển thị trên Google..."
                maxLength={60}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <div className={`text-xs mt-1 ${
                formData.meta_title.length >= 50 && formData.meta_title.length <= 60 ? 'text-green-600 dark:text-green-400' :
                formData.meta_title.length > 60 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                Tối ưu: 50-60 ký tự
              </div>
            </div>

            {/* Schema Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schema Type
              </label>
              <select
                value={formData.schema_type}
                onChange={(e) => setFormData(prev => ({ ...prev, schema_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {SCHEMA_TYPES.map(schema => (
                  <option key={schema.value} value={schema.value}>
                    {schema.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Meta Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meta Description ({formData.meta_description.length}/160)
            </label>
            <textarea
              value={formData.meta_description}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
              placeholder="Mô tả ngắn gọn hiển thị trên Google..."
              maxLength={160}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            />
            <div className={`text-xs mt-1 ${
              formData.meta_description.length >= 120 && formData.meta_description.length <= 160 ? 'text-green-600 dark:text-green-400' :
              formData.meta_description.length > 160 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            }`}>
              Tối ưu: 120-160 ký tự
            </div>
          </div>

          {/* Robots Meta */}
          <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Robots Index
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formData.robots_noindex ? 'Không cho phép index' : 'Cho phép index'}
              </p>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, robots_noindex: !prev.robots_noindex }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
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

          {/* SEO Tips */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-3">
              Tips SEO
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-blue-800 dark:text-blue-300">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Sử dụng từ khóa chính trong tiêu đề và nội dung</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Meta description nên hấp dẫn và có call-to-action</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>URL slug ngắn gọn và chứa từ khóa</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Nội dung ít nhất 300 từ để tối ưu SEO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
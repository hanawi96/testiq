import React, { useState, useEffect, useMemo, lazy, Suspense, startTransition } from 'react';
import { ArticlesService } from '../../../../../backend';
import type { Category, CreateArticleData, AuthorOption, Article } from '../../../../../backend';
import { generateSlug } from '../../../../utils/slug-generator';
import { processBulkTags, createTagFeedbackMessage, lowercaseNormalizeTag } from '../../../../utils/tag-processing';
import LoadingSpinner from '../../common/LoadingSpinner';
import MediaUpload from '../create/components/MediaUpload';
import TagsInput from '../create/components/TagsInput';
import AuthorSelector from '../create/components/AuthorSelector';
import CategorySelector from '../create/components/CategorySelector';
import DateTimePicker from '../create/components/DateTimePicker';
import { BlogService } from '../../../../services/blog-service';
import SchemaPreview from '../SchemaPreview';
import '../../../../styles/article-editor.css';
import '../../../../styles/tiptap-editor.css';

// PRELOADERS - Intelligent data loading
import { getInstantCategoriesData, preloadCategoriesData, isCategoriesDataReady } from '../../../../utils/admin/preloaders/categories-preloader';
import { getInstantAuthorsData, preloadAuthorsData, isAuthorsDataReady } from '../../../../utils/admin/preloaders/authors-preloader';

// PROGRESSIVE LOADING: Skeleton components cho dữ liệu động
const FieldSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

const TitleSkeleton: React.FC = () => (
  <div className="space-y-2">
    <FieldSkeleton className="h-4 w-24" />
    <FieldSkeleton className="h-12 w-full rounded-lg" />
  </div>
);

const EditorSkeleton: React.FC = () => (
  <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900" style={{ height: '1000px' }}>
    {/* Toolbar Skeleton - khớp với TipTap toolbar */}
    <div className="border-b border-gray-300 dark:border-gray-600 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: 15 }, (_, i) => (
          <FieldSkeleton key={i} className="w-8 h-8 rounded" />
        ))}
      </div>
    </div>

    {/* Content Area Skeleton - chiều cao cố định với scroll */}
    <div className="p-4 space-y-4 overflow-y-auto overflow-x-hidden" style={{ height: 'calc(1000px - 60px)' }}>
      {/* Simulate content lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <FieldSkeleton
          key={i}
          className={`h-4 ${
            i === 0 ? 'w-3/4' :
            i === 4 ? 'w-1/2' :
            i === 8 ? 'w-2/3' :
            i === 12 ? 'w-1/3' :
            i === 16 ? 'w-5/6' :
            'w-full'
          }`}
        />
      ))}

      {/* Add some spacing at bottom */}
      <div className="h-32"></div>
    </div>
  </div>
);

const ExcerptSkeleton: React.FC = () => (
  <div className="space-y-3">
    <FieldSkeleton className="h-24 w-full rounded-lg" />
    <FieldSkeleton className="h-3 w-48" />
  </div>
);

const SEOSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    {/* Header Skeleton */}
    <div className="flex items-center gap-3 mb-4">
      <FieldSkeleton className="w-8 h-8 rounded-lg" />
      <FieldSkeleton className="h-6 w-32" />
    </div>

    {/* SEO Toggle Skeleton */}
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-600/60">
        <div className="flex items-center gap-3">
          <FieldSkeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FieldSkeleton className="h-4 w-32" />
              <FieldSkeleton className="h-5 w-16 rounded-full" />
            </div>
            <FieldSkeleton className="h-3 w-48" />
          </div>
        </div>
        <FieldSkeleton className="h-6 w-11 rounded-full" />
      </div>
    </div>
  </div>
);


const SidebarSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Publish Box Skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FieldSkeleton className="w-5 h-5" />
          <FieldSkeleton className="h-5 w-16" />
        </div>
        <FieldSkeleton className="h-8 w-20 rounded-lg" />
      </div>
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
        <div className="flex gap-2">
          <FieldSkeleton className="h-10 flex-1 rounded-lg" />
          <FieldSkeleton className="h-10 flex-1 rounded-lg" />
        </div>
      </div>
    </div>

    {/* Categories Skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <FieldSkeleton className="w-5 h-5" />
        <FieldSkeleton className="h-5 w-20" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
            <FieldSkeleton className="w-4 h-4" />
            <FieldSkeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>

    {/* Tags Skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <FieldSkeleton className="w-5 h-5" />
        <FieldSkeleton className="h-5 w-12" />
      </div>
      <FieldSkeleton className="h-10 w-full rounded-lg mb-2" />
      <FieldSkeleton className="h-3 w-40" />
      <div className="flex flex-wrap gap-2 mt-3">
        {Array.from({ length: 3 }, (_, i) => (
          <FieldSkeleton key={i} className="h-6 w-16 rounded" />
        ))}
      </div>
    </div>

    {/* Author Skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <FieldSkeleton className="w-5 h-5" />
        <FieldSkeleton className="h-5 w-16" />
      </div>
      <FieldSkeleton className="h-10 w-full rounded-lg" />
    </div>

    {/* Featured Image Skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <FieldSkeleton className="w-5 h-5" />
        <FieldSkeleton className="h-5 w-24" />
      </div>
      <FieldSkeleton className="h-32 w-full rounded-lg mb-3" />
      <FieldSkeleton className="h-10 w-full rounded-lg mb-2" />
      <FieldSkeleton className="h-3 w-48" />
    </div>
  </div>
);



// LAZY LOAD heavy components
const TiptapEditor = lazy(() => import('./TiptapEditor'));

// Dropdown Section Component to prevent FOUC
const DropdownSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, isOpen, onToggle, children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 dropdown-section ${className}`}>
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full mb-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors duration-200"
    >
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <svg
        className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ease-in-out ${
          isOpen ? 'rotate-180' : ''
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <div
      className={`dropdown-content transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-[2000px] opacity-100 open overflow-visible' : 'max-h-0 opacity-0 closed overflow-hidden'
      }`}
      style={{
        transitionProperty: 'max-height, opacity',
        transitionDuration: '300ms',
        transitionTimingFunction: 'ease-in-out',
        overflow: isOpen ? 'visible' : 'hidden'
      }}
    >
      <div style={{ display: isOpen ? 'block' : 'none' }}>
        {children}
      </div>
    </div>
  </div>
);




interface ArticleEditorProps {
  articleId?: string; // Nếu có = edit mode, không có = create mode
  onSave?: (article: Article) => void;
  onCancel?: () => void;
}

// Fallback authors for when database is not available
const FALLBACK_AUTHORS = [
  {
    id: '1',
    name: 'Nguyễn Minh Tuấn',
    email: 'tuan@iqtest.com',
    role: 'Editor'
  },
  {
    id: '2',
    name: 'Trần Thị Hương',
    email: 'huong@iqtest.com',
    role: 'Content Writer'
  },
  {
    id: '3',
    name: 'Lê Văn Đức',
    email: 'duc@iqtest.com',
    role: 'Senior Writer'
  },
  {
    id: '4',
    name: 'Phạm Thị Lan',
    email: 'lan@iqtest.com',
    role: 'Research Writer'
  }
];



export default function ArticleEditor({ articleId, onSave }: ArticleEditorProps) {

  // FIXED: Get article ID immediately (synchronous) để tránh flash
  const getArticleId = () => {
    if (articleId) return articleId;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('id');
    }
    return null;
  };

  const currentArticleId = getArticleId();
  const isEditMode = !!currentArticleId;



  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    meta_title: '',
    meta_description: '',
    slug: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    focus_keyword: '',
    categories: [] as string[],
    tags: [] as string[],
    cover_image: '',
    cover_image_alt: '',
    lang: 'vi',
    article_type: 'article' as 'article' | 'page' | 'post',
    is_public: false, // Default to draft for both create and edit mode
    is_featured: false,
    schema_type: 'Article',
    robots_noindex: false,
    published_date: new Date().toISOString().slice(0, 16),
    updated_date: new Date().toISOString().slice(0, 16),
    author_id: ''
  });


  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Track any save operation

  // Track original content for image cleanup
  const [originalContent, setOriginalContent] = useState<string>('');



  const [slugError, setSlugError] = useState('');
  const [loadError, setLoadError] = useState('');

  // Dropdown state management for sidebar sections
  const [sidebarDropdowns, setSidebarDropdowns] = useState(() => {
    // Use pre-loaded states to prevent FOUC
    if (typeof window !== 'undefined' && (window as any).__ARTICLE_EDITOR_DROPDOWN_STATES__) {
      return (window as any).__ARTICLE_EDITOR_DROPDOWN_STATES__;
    }
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      return {
        categories: localStorage.getItem('article-editor-dropdown-categories') !== 'false',
        tags: localStorage.getItem('article-editor-dropdown-tags') !== 'false',
        author: localStorage.getItem('article-editor-dropdown-author') !== 'false',
        featuredImage: localStorage.getItem('article-editor-dropdown-featuredImage') !== 'false',
        seo: localStorage.getItem('article-editor-dropdown-seo') !== 'false',
        seoIndex: localStorage.getItem('article-editor-dropdown-seoIndex') !== 'false'
      };
    }
    return {
      categories: true,
      tags: true,
      author: true,
      featuredImage: true,
      seo: true,
      seoIndex: true
    };
  });

  // PROGRESSIVE LOADING: UI tĩnh hiển thị ngay, data động load sau
  const initialLoadingState = {
    isLoading: false, // UI tĩnh hiển thị ngay
    isDataLoaded: !isEditMode, // false for edit mode, true for create mode
    isValidatingSlug: false,
    isEditorReady: false,
    // Separate loading states for different sections
    isLoadingArticleData: isEditMode,
    isLoadingCategories: !isEditMode, // Create mode: categories load instantly
    isLoadingAuthors: !isEditMode // Create mode: authors load instantly
  };

  const [loadingState, setLoadingState] = useState(initialLoadingState);

  // Progressive loading: Show static UI immediately, skeleton for dynamic data
  const shouldShowArticleSkeleton = isEditMode && loadingState.isLoadingArticleData;
  const shouldShowCategoriesSkeleton = loadingState.isLoadingCategories;
  const shouldShowAuthorsSkeleton = loadingState.isLoadingAuthors;
  const shouldShowSEOSkeleton = isEditMode && loadingState.isLoadingArticleData;



  // Professional autosave progress animation
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (isAutoSaving) {
      setSaveProgress(0);

      // Smooth progress animation from 0 to 90% over 1.5s
      progressInterval = setInterval(() => {
        setSaveProgress(prev => {
          if (prev >= 90) return 90; // Stop at 90%, complete on success
          return prev + 2; // Increment by 2% every 30ms
        });
      }, 30);
    } else {
      // Complete progress and fade out
      setSaveProgress(100);
      setTimeout(() => setSaveProgress(0), 500);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isAutoSaving]);



  // OPTIMIZED: Single useEffect for all data loading (avoid double execution)
  useEffect(() => {
    // FIXED: Dispatch event to hide static skeleton
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('article-editor-mounted'));
      console.log('🔄 React component mounted, dispatching event');
    }

    const loadAllData = async () => {
      setLoadError('');

      console.log('🔄 ARTICLE EDITOR: Starting data load', {
        currentArticleId,
        mode: currentArticleId ? 'EDIT' : 'CREATE'
      });

      // Start preloading immediately (non-blocking)
      preloadCategoriesData();
      preloadAuthorsData();

      try {
        if (currentArticleId) {
          // EDIT MODE: Load article + preloaded data
          const [articleResult, categoriesData, authorsData] = await Promise.all([
            ArticlesService.getArticleForEdit(currentArticleId),
            // Use preloaded data if available, otherwise fetch
            isCategoriesDataReady() ? Promise.resolve(getInstantCategoriesData()) : preloadCategoriesData(),
            isAuthorsDataReady() ? Promise.resolve(getInstantAuthorsData()) : preloadAuthorsData()
          ]);

          // Handle article data
          if (articleResult.error) {
            setLoadError('Không thể tải bài viết');
            return;
          }

          if (articleResult.data) {
            // Populate form with article data
            const articleContent = articleResult.data.content || '';
            setFormData({
              title: articleResult.data.title || '',
              content: articleContent,
              excerpt: articleResult.data.excerpt || '',
              meta_title: articleResult.data.meta_title || '',
              meta_description: articleResult.data.meta_description || '',
              slug: articleResult.data.slug || '',
              status: articleResult.data.status || 'draft',
              focus_keyword: articleResult.data.focus_keyword || '',
              categories: (() => {
                // Convert single category_id to array, or use category_ids if available
                if (articleResult.data.category_ids && articleResult.data.category_ids.length > 0) {
                  return articleResult.data.category_ids;
                }
                if (articleResult.data.category_id) {
                  return [articleResult.data.category_id];
                }
                if (articleResult.data.categories) {
                  return articleResult.data.categories.map((cat: any) => typeof cat === 'string' ? cat : cat.id);
                }
                return [];
              })(),
              tags: articleResult.data.tag_names || articleResult.data.tags?.map((tag: any) => typeof tag === 'string' ? tag : tag.name) || [],
              cover_image: articleResult.data.cover_image || '',
              cover_image_alt: articleResult.data.cover_image_alt || '',
              lang: articleResult.data.lang || 'vi',
              article_type: articleResult.data.article_type || 'article',
              is_public: articleResult.data.status === 'published',
              is_featured: articleResult.data.featured === true,
              schema_type: articleResult.data.schema_type || 'Article',
              robots_noindex: articleResult.data.robots_directive?.includes('noindex') || false,
              published_date: articleResult.data.published_at ? new Date(articleResult.data.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
              updated_date: articleResult.data.updated_at ? new Date(articleResult.data.updated_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
              author_id: articleResult.data.author_id || ''
            });

            // Store original content for image cleanup
            setOriginalContent(articleContent);

            // Mark article data as loaded
            setLoadingState(prev => ({
              ...prev,
              isDataLoaded: true,
              isLoadingArticleData: false
            }));


          }

          // Handle preloaded categories data
          if (categoriesData && categoriesData.length > 0) {
            setCategories(categoriesData);
          } else {
            console.warn('No categories data available');
          }

          // Handle preloaded authors data
          if (authorsData && authorsData.length > 0) {
            setAuthors(authorsData);
            // Set first author as default if no author selected
            if (!articleResult.data?.author_id) {
              setFormData(prev => ({ ...prev, author_id: authorsData[0].id }));
            }
          } else {
            console.warn('No authors data available');
            // Fallback to demo authors if preloader fails
            const fallbackAuthors = FALLBACK_AUTHORS.map(author => ({
              id: author.id,
              full_name: author.name,
              email: author.email,
              role: author.role.toLowerCase(),
              role_badge_color: 'text-blue-800 bg-blue-100 border-blue-200',
              role_display_name: author.role
            }));
            setAuthors(fallbackAuthors);
            if (!articleResult.data?.author_id) {
              setFormData(prev => ({ ...prev, author_id: fallbackAuthors[0].id }));
            }
          }

          // Reset unsaved changes after loading article data
          setHasUnsavedChanges(false);
          setInitialFormData(formData);

        } else {
          // CREATE MODE: Load only preloaded data (no article to fetch)
          console.log('🆕 CREATE MODE: Loading categories and authors for new article');

          const [categoriesData, authorsData] = await Promise.all([
            isCategoriesDataReady() ? Promise.resolve(getInstantCategoriesData()) : preloadCategoriesData(),
            isAuthorsDataReady() ? Promise.resolve(getInstantAuthorsData()) : preloadAuthorsData()
          ]);

          // FIXED: Batch all state updates in startTransition to avoid hydration conflicts
          startTransition(() => {
            // Prepare data
            const finalCategories = categoriesData && categoriesData.length > 0 ? categoriesData : [];
            let finalAuthors = authorsData && authorsData.length > 0 ? authorsData : [];
            let defaultAuthorId = formData.author_id;

            // Handle authors fallback
            if (finalAuthors.length === 0) {
              console.warn('CREATE MODE: No authors data available, using fallback');
              finalAuthors = FALLBACK_AUTHORS.map(author => ({
                id: author.id,
                full_name: author.name,
                email: author.email,
                role: author.role.toLowerCase(),
                role_badge_color: 'text-blue-800 bg-blue-100 border-blue-200',
                role_display_name: author.role
              }));
            }

            // Set default author if none selected
            if (!defaultAuthorId && finalAuthors.length > 0) {
              defaultAuthorId = finalAuthors[0].id;
            }

            // BATCH UPDATE: All state changes in one go
            setCategories(finalCategories);
            setAuthors(finalAuthors);
            if (defaultAuthorId !== formData.author_id) {
              setFormData(prev => ({ ...prev, author_id: defaultAuthorId }));
            }
            setLoadingState(prev => ({
              ...prev,
              isDataLoaded: true,
              isLoadingCategories: false,
              isLoadingAuthors: false
            }));

            console.log(`✅ CREATE MODE: Loaded ${finalCategories.length} categories, ${finalAuthors.length} authors`);
          });
        }

        } catch (err) {
          setLoadError('Có lỗi xảy ra khi tải dữ liệu');
          setLoadingState(prev => ({ ...prev, isLoading: false, isDataLoaded: false }));
          console.error('Error loading data:', err);
        }
      };

      loadAllData();
  }, []); // FIXED: Chỉ chạy 1 lần khi mount, không cần dependency



  // Track unsaved changes - only when user actually makes changes
  const [initialFormData, setInitialFormData] = useState<any>(null);

  useEffect(() => {
    // Set initial form data on first load
    if (!initialFormData) {
      setInitialFormData(formData);
      return;
    }

    // Check if form data actually changed from initial state
    const hasActualChanges = (
      formData.title !== initialFormData.title ||
      formData.content !== initialFormData.content ||
      formData.excerpt !== initialFormData.excerpt ||
      formData.slug !== initialFormData.slug ||
      formData.is_public !== initialFormData.is_public ||
      formData.is_featured !== initialFormData.is_featured ||
      formData.author_id !== initialFormData.author_id ||
      formData.category_id !== initialFormData.category_id ||
      JSON.stringify(formData.tags) !== JSON.stringify(initialFormData.tags)
    );

    setHasUnsavedChanges(hasActualChanges);
  }, [formData, initialFormData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave('draft');
      }
      // Ctrl/Cmd + Shift + P to publish
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        handleSave('published');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // IMPROVED: Smart auto-save with debouncing
  useEffect(() => {
    // Skip autosave if no changes
    if (!hasUnsavedChanges || isManualSaving) {
      return;
    }

    // Skip autosave if required fields are empty
    if (!formData.title.trim() || !formData.slug.trim() || formData.content.trim().length < 10) {
      return;
    }

    // Debounced auto-save: wait 2 seconds after last change, then save
    const autoSaveTimeout = setTimeout(() => {
      if (hasUnsavedChanges) {
        handleSave('autosave');
      }
    }, 2000);

    return () => {
      clearTimeout(autoSaveTimeout);
    };
  }, [hasUnsavedChanges, isManualSaving, formData.title, formData.content, formData.slug, formData.schema_type]);

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
    // Clear validation error when user starts typing title
    if (validationError.includes('Tiêu đề')) {
      setValidationError('');
    }

    setFormData(prev => {
      const updates: any = {
        title,
        meta_title: title.length <= 60 ? title : title.substring(0, 60)
      };

      // Auto-update cover image alt text if it's empty or default
      if (!prev.cover_image_alt || prev.cover_image_alt === 'Ảnh đại diện bài viết' || prev.cover_image_alt === prev.title) {
        updates.cover_image_alt = title || 'Ảnh đại diện bài viết';
      }

      // Only auto-generate slug for create mode
      if (!isEditMode) {
        const newSlug = generateSlug(title);
        updates.slug = newSlug;

        // Validate the new slug
        if (newSlug) {
          setTimeout(() => validateSlug(newSlug), 100);
        }
      }

      return { ...prev, ...updates };
    });

    // Trigger autosave
    setHasUnsavedChanges(true);
  };

  // Validate slug uniqueness
  const validateSlug = async (slug: string) => {
    if (!slug.trim()) {
      setSlugError('');
      return;
    }

    setLoadingState(prev => ({ ...prev, isValidatingSlug: true }));
    setSlugError('');

    try {
      // Pass current article ID to exclude it from slug check in edit mode
      const excludeId = isEditMode ? currentArticleId : undefined;
      const { data: isValid, error } = await ArticlesService.validateSlug(slug, excludeId);

      if (error) {
        setSlugError(error.message || 'Có lỗi khi kiểm tra slug');
      } else if (!isValid) {
        setSlugError('Slug đã tồn tại, vui lòng chọn slug khác');
      }
    } catch (err) {
      setSlugError('Có lỗi khi kiểm tra slug');
    } finally {
      setLoadingState(prev => ({ ...prev, isValidatingSlug: false }));
    }
  };

  // Handle manual slug change
  const handleSlugChange = (slug: string) => {
    setFormData(prev => ({ ...prev, slug }));

    // Debounce slug validation
    const timeoutId = setTimeout(() => {
      validateSlug(slug);
    }, 500);

    return () => clearTimeout(timeoutId);
  };







  const handleSave = async (action: 'save' | 'autosave') => {
    const isAutoSave = action === 'autosave';

    // PREVENT RACE CONDITION: Skip if already saving
    if (isSaving) {
      return;
    }

    // Set saving state
    setIsSaving(true);

    if (isAutoSave) {
      setIsAutoSaving(true);
    } else {
      setIsManualSaving(true);
      setIsAutoSaving(true); // Sử dụng chung hiển thị autosave
    }



    try {
      // Clear previous validation errors
      setValidationError('');

      // Prepare article data
      const status = formData.is_public ? 'published' : 'draft';
      console.log('📊 STATUS LOGIC:', {
        is_public: formData.is_public,
        calculated_status: status,
        isEditMode,
        isAutoSave
      });

      // Store original title for validation
      const originalTitle = formData.title.trim();
      const finalTitle = originalTitle;

      // Validate required fields AFTER auto-title generation (skip for autosave)
      if (!isAutoSave && !originalTitle) {
        setValidationError('❌ Tiêu đề không được để trống');
        setIsManualSaving(false);
        setIsAutoSaving(false);
        setTimeout(() => setValidationError(''), 5000);
        return;
      }

      if (!formData.content.trim()) {
        setValidationError('❌ Nội dung không được để trống');
        if (!isAutoSave) setIsManualSaving(false);
        setIsAutoSaving(false);
        setTimeout(() => setValidationError(''), 5000);
        return;
      }

      // Skip slug validation for autosave
      if (!isAutoSave) {
        if (!formData.slug.trim()) {
          setValidationError('❌ Slug không được để trống');
          setIsManualSaving(false);
          setIsAutoSaving(false);
          setTimeout(() => setValidationError(''), 5000);
          return;
        }

        if (slugError) {
          setValidationError('❌ ' + slugError);
          setIsManualSaving(false);
          setIsAutoSaving(false);
          setTimeout(() => setValidationError(''), 5000);
          return;
        }
      }



      const articleData: CreateArticleData = {
        title: finalTitle,
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim(),
        slug: formData.slug.trim(),
        status,
        featured: formData.is_featured,
        lang: formData.lang,
        article_type: formData.article_type,

        // SEO fields
        meta_title: formData.meta_title.trim(),
        meta_description: formData.meta_description.trim(),
        focus_keyword: formData.focus_keyword.trim(),
        robots_directive: formData.robots_noindex ? 'noindex,nofollow' : 'index,follow',
        schema_type: formData.schema_type,

        // Media
        cover_image: formData.cover_image?.trim() || null,
        cover_image_alt: formData.cover_image_alt?.trim() || null,

        // Author - handled by authorId parameter

        // Category - convert categories array to primary category_id
        category_id: formData.categories.length > 0 ? formData.categories[0] : undefined,

        // Relations - for junction tables
        categories: formData.categories,
        tags: formData.tags,

        // Publishing
        published_at: status === 'published' ? formData.published_date : undefined,

        // Updated timestamp - allow user override
        updated_at: formData.updated_date ? new Date(formData.updated_date).toISOString() : undefined,
      };



      let data, error;

      if (isEditMode && currentArticleId) {
        // Update existing article
        const result = await ArticlesService.updateArticle(
          currentArticleId,
          articleData,
          formData.author_id.trim() || null // Convert empty string to null for UUID
        );
        data = result.data;
        error = result.error;
      } else {
        // Create new article
        const result = await ArticlesService.createArticle(
          articleData,
          formData.author_id.trim() || null, // Convert empty string to null for UUID
          isAutoSave // Pass autosave flag for validation
        );
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error(`❌ SAVE ERROR (${isAutoSave ? 'AUTOSAVE' : 'MANUAL'}):`, {
          isEditMode,
          isAutoSave,
          error: error.message || error,
          formData: {
            title: formData.title.substring(0, 30),
            contentLength: formData.content.length
          }
        });
        setValidationError('❌ ' + (error.message || 'Có lỗi xảy ra khi lưu'));
        if (!isAutoSave) {
          setIsManualSaving(false);
        }
        setIsAutoSaving(false); // Tắt hiển thị chung khi có lỗi
        setTimeout(() => setValidationError(''), 5000);
        return;
      }

      if (data) {

        // Image cleanup removed - handled by media management system
        if (isEditMode && originalContent && formData.content !== originalContent) {
          // Update original content for next comparison
          setOriginalContent(formData.content);
        }

        // Update save state
        setHasUnsavedChanges(false);
        setLastSaved(new Date());

        // Show different messages for manual vs auto save
        if (!isAutoSave) {
          // Manual save success - user feedback handled by UI
        } else {
          // Autosave success - silent operation
        }

        // Clear caches để cập nhật frontend và backend ngay lập tức
        BlogService.clearCache();

        // Clear article edit cache to ensure fresh data on reload
        if (typeof ArticlesService.clearCachePattern === 'function') {
          ArticlesService.clearCachePattern(`article:edit:${data.id}`);
        }

        // Force clear browser cache for blog pages
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              if (cacheName.includes('blog') || cacheName.includes('article')) {
                caches.delete(cacheName).catch(() => {});
              }
            });
          }).catch(() => {});
        }

        // Call onSave callback if provided
        if (onSave) {
          onSave(data);
        }



        // Redirect logic
        if (!isEditMode) {
          // Redirect to edit page after successful creation
          setTimeout(() => {
            window.location.href = `/admin/articles/edit?id=${data.id}`;
          }, 1500);
        }
        // For edit mode, no action needed - lastSaved indicator will show
      }

    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('❌ Có lỗi xảy ra khi tạo bài viết');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      // Reset saving state to allow future saves
      setIsSaving(false);

      if (isAutoSave) {
        setIsAutoSaving(false);
      } else {
        setIsManualSaving(false);
        setIsAutoSaving(false); // Tắt hiển thị chung
      }
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  // Toggle sidebar dropdown sections
  const toggleSidebarDropdown = (section: keyof typeof sidebarDropdowns) => {
    setSidebarDropdowns(prev => {
      const newState = { ...prev, [section]: !prev[section] };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`article-editor-dropdown-${section}`, newState[section].toString());
      }
      return newState;
    });
  };

  // OPTIMIZED: SEO analysis với debouncing để tránh re-calculate liên tục
  const [debouncedFormData, setDebouncedFormData] = useState(formData);

  // Debounce formData changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFormData(formData);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData.title, formData.content, formData.meta_description, formData.slug, formData.focus_keyword]);

  // SEO calculations chỉ chạy khi debouncedFormData thay đổi
  const seoAnalysis = useMemo(() => {
    const wordCount = debouncedFormData.content.split(' ').filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200);

    // SEO Score calculation
    let score = 0;
    const checks = [];

    // Title check
    const titleLength = debouncedFormData.title.length;
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
    const metaLength = debouncedFormData.meta_description.length;
    if (metaLength >= 120 && metaLength <= 160) {
      score += 20;
      checks.push({ name: 'Meta description', status: 'good', message: 'Độ dài tối ưu (120-160 ký tự)' });
    } else if (metaLength > 0) {
      checks.push({ name: 'Meta description', status: 'warning', message: `${metaLength} ký tự - Nên từ 120-160` });
    } else {
      checks.push({ name: 'Meta description', status: 'bad', message: 'Chưa có meta description' });
    }

    // Slug check
    if (debouncedFormData.slug.length > 0) {
      score += 15;
      checks.push({ name: 'URL slug', status: 'good', message: 'Có URL slug' });
    } else {
      checks.push({ name: 'URL slug', status: 'bad', message: 'Cần có URL slug' });
    }

    // Focus keyword check
    if (debouncedFormData.focus_keyword) {
      const keyword = debouncedFormData.focus_keyword.toLowerCase();
      const titleHasKeyword = debouncedFormData.title.toLowerCase().includes(keyword);
      const contentHasKeyword = debouncedFormData.content.toLowerCase().includes(keyword);

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

  // Loading state removed - show content immediately

  // FIXED: Không cần skeleton nội bộ nữa vì đã có static skeleton từ Astro
  // Static skeleton sẽ được hide khi component này mount

  // Show error state for edit mode
  if (isEditMode && loadError) {
    return (
      <div className="article-editor bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">Không thể tải bài viết</h2>
            <p className="text-red-700 dark:text-red-300 mb-4">{loadError}</p>
            <button
              onClick={() => window.location.href = '/admin/articles'}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="article-editor bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Sticky Header */}
      <div className="article-editor-header bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-sm">
        <div className="w-full p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {isEditMode ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isEditMode ? 'Cập nhật và quản lý nội dung' : 'Viết và xuất bản nội dung chất lượng'}
                  {!isEditMode && ' • Tự động lưu khi có tiêu đề và slug'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Save Status & Indicators */}
              <div className="flex items-center gap-2">
                {validationError && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800/30 transition-all duration-300 ease-out">
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium text-red-700 dark:text-red-300 whitespace-nowrap">
                      {validationError}
                    </span>
                  </div>
                )}
                {isAutoSaving && (
                  <div className="flex items-center gap-3 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 transition-all duration-300 ease-out">
                    {/* Text */}
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                      {isManualSaving ? 'Đang lưu...' : 'Đang tự động lưu...'}
                    </span>

                    {/* Progress Bar */}
                    <div className="w-20 h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-75 ease-out rounded-full"
                        style={{ width: `${saveProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {lastSaved && !hasUnsavedChanges && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-800/30 transition-all duration-300">
                    {/* Success checkmark with animation */}
                    <div className="relative">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {/* Subtle pulse effect */}
                      <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full opacity-20 animate-ping"></div>
                    </div>

                    <span className="text-xs font-medium text-green-700 dark:text-green-300 whitespace-nowrap">
                      Đã lưu {lastSaved.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleSave('save')}
                disabled={isAutoSaving}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 font-medium ${
                  isAutoSaving
                    ? 'bg-blue-500 text-white cursor-not-allowed opacity-75'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-[1.02] text-white'
                }`}
                title={formData.is_public ? "Lưu và xuất bản (Ctrl+S)" : "Lưu nháp (Ctrl+S)"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>{formData.is_public ? 'Lưu và xuất bản' : 'Lưu nháp'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive 2 Column Layout */}
      <div className="w-full py-4">
        <div className="article-editor-main">

          {/* Left Column - Main Content */}
          <div className="space-y-6">

            {/* Title Section - Static Box */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-4">
                {/* Title - Dynamic Content */}
                <div>
                  {shouldShowArticleSkeleton ? (
                    <TitleSkeleton />
                  ) : (
                    <>
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
                        className="w-full px-4 py-3 text-xl font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                        maxLength={100}
                      />
                    </>
                  )}
                </div>

                {/* URL Slug - Always show static structure */}
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
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="url-slug-seo-friendly"
                      className={`flex-1 px-3 py-2 font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border rounded-lg ${
                        slugError ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {loadingState.isValidatingSlug && (
                      <div className="px-3 py-2 text-blue-600">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                    )}
                    {formData.slug && !loadingState.isValidatingSlug && (
                      <button
                        onClick={() => {
                          const newSlug = generateSlug(formData.title);
                          setFormData(prev => ({ ...prev, slug: newSlug }));
                          validateSlug(newSlug);
                        }}
                        className="px-3 py-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title="Tạo lại từ tiêu đề"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {slugError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {slugError}
                    </p>
                  )}
                  {!slugError && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      URL thân thiện SEO được tự động tạo từ tiêu đề
                    </p>
                  )}
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
                {/* Dynamic Stats - Only show when data loaded */}
                {!shouldShowArticleSkeleton && formData.content && (
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
                <div className="article-content-editor">
                  {/* PROGRESSIVE LOADING: Show skeleton for editor when loading article data */}
                  {shouldShowArticleSkeleton ? (
                    <EditorSkeleton />
                  ) : (
                    <Suspense fallback={<EditorSkeleton />}>
                      <TiptapEditor
                        value={formData.content}
                        onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                        placeholder="Bắt đầu viết nội dung tuyệt vời của bạn..."
                        height="1000px"
                        flexHeight={false}
                        className="focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                    </Suspense>
                  )}
                </div>
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

              {/* PROGRESSIVE LOADING: Show skeleton for excerpt when loading article data */}
              {shouldShowArticleSkeleton ? (
                <ExcerptSkeleton />
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Viết tóm tắt ngắn gọn và hấp dẫn để thu hút độc giả..."
                    rows={4}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tóm tắt tốt sẽ hiển thị trong kết quả tìm kiếm và mạng xã hội
                  </p>
                </div>
              )}
            </div>

            {/* SEO Settings Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">SEO & Tối ưu hóa</h2>
              </div>

              {/* PROGRESSIVE LOADING: Show skeleton for SEO when loading article data */}
              {shouldShowArticleSkeleton ? (
                <SEOSkeleton />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left side - SEO Score & Analysis */}
                <div className="space-y-6">
                  {/* SEO Score Card */}
                  <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Điểm SEO</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Đánh giá tổng thể</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${
                            seoAnalysis.score >= 80 ? 'text-green-600 dark:text-green-400' :
                            seoAnalysis.score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {seoAnalysis.score}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">/100</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div
                          className={`h-full rounded-full ${
                            seoAnalysis.score >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            seoAnalysis.score >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}
                          style={{ width: `${seoAnalysis.score}%` }}
                        ></div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Trạng thái tối ưu</span>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          seoAnalysis.score >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          seoAnalysis.score >= 60 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {seoAnalysis.score >= 80 ? '🎯 Xuất sắc' :
                           seoAnalysis.score >= 60 ? '⚡ Tốt' : '🔧 Cần cải thiện'}
                        </div>
                      </div>
                  </div>

                  {/* SEO Checklist */}
                  <div className="bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800 dark:to-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Checklist SEO</h4>
                    </div>
                    <div className="space-y-3">
                      {seoAnalysis.checks.map((check, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-xl">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            check.status === 'good' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            check.status === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{check.name}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                check.status === 'good' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                check.status === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                {check.message}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side - SEO Fields */}
                <div className="space-y-6">
                  {/* Focus Keyword */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      Từ khóa chính
                    </label>
                    <input
                      type="text"
                      value={formData.focus_keyword}
                      onChange={(e) => setFormData(prev => ({ ...prev, focus_keyword: e.target.value }))}
                      placeholder="Nhập từ khóa chính cho bài viết..."
                      className="w-full px-4 py-3.5 border rounded-xl
                        bg-white dark:bg-gray-800/50 backdrop-blur-sm
                        text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                        focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
                        border-gray-200 dark:border-gray-700"
                    />
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Từ khóa chính giúp tối ưu hóa nội dung cho search engine
                    </div>
                  </div>

                  {/* Meta Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                      Meta Title
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        formData.meta_title.length >= 50 && formData.meta_title.length <= 60
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : formData.meta_title.length > 60
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {formData.meta_title.length}/60
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                      placeholder="Tiêu đề hiển thị trên Google..."
                      maxLength={60}
                      className="w-full px-4 py-3.5 border rounded-xl
                        bg-white dark:bg-gray-800/50 backdrop-blur-sm
                        text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                        focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500
                        border-gray-200 dark:border-gray-700"
                    />
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Tiêu đề hiển thị trên kết quả tìm kiếm Google
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                      Meta Description
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        formData.meta_description.length >= 120 && formData.meta_description.length <= 160
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : formData.meta_description.length > 160
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {formData.meta_description.length}/160
                      </span>
                    </label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="Mô tả ngắn gọn hiển thị trên Google..."
                      maxLength={160}
                      rows={4}
                      className="w-full px-4 py-3.5 border rounded-xl resize-none
                        bg-white dark:bg-gray-800/50 backdrop-blur-sm
                        text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                        focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500
                        border-gray-200 dark:border-gray-700"
                    />
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mô tả ngắn gọn hiển thị trên kết quả tìm kiếm Google
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>

          </div>

          {/* Right Column - Sidebar Settings - Static Structure */}
          <div className="article-sidebar-sticky space-y-6">

            {/* Publish Box */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Xuất bản</h3>
                </div>

                {/* Preview Button - Only show when published and has slug */}
                {formData.status === 'published' && formData.slug && (
                  <button
                    onClick={() => {
                      const previewUrl = `/blog/${formData.slug}`;
                      window.open(previewUrl, '_blank');
                    }}
                    className="px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-1.5"
                    title="Xem bài viết đã xuất bản"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Xem thử
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chế độ công khai</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {loadingState.isDataLoaded ? (formData.is_public ? 'Hiển thị công khai' : 'Chỉ riêng tư') : 'Đang tải...'}
                    </p>
                  </div>
                  {loadingState.isDataLoaded ? (
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
                  ) : (
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-600">
                      <div className="inline-block h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-500 translate-x-1"></div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bài nổi bật</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {loadingState.isDataLoaded ? (formData.is_featured ? 'Được đánh dấu nổi bật' : 'Bài viết thường') : 'Đang tải...'}
                    </p>
                  </div>
                  {loadingState.isDataLoaded ? (
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
                  ) : (
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-600">
                      <div className="inline-block h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-500 translate-x-1"></div>
                    </div>
                  )}
                </div>

                <DateTimePicker
                  label="Ngày xuất bản"
                  value={formData.published_date}
                  onChange={(value) => setFormData(prev => ({ ...prev, published_date: value }))}
                  disabled={loadingState.isLoading}
                />

                <DateTimePicker
                  label="Ngày cập nhật"
                  value={formData.updated_date}
                  onChange={(value) => setFormData(prev => ({ ...prev, updated_date: value }))}
                  disabled={loadingState.isLoading}
                />


              </div>
            </div>

            {/* Categories Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {shouldShowCategoriesSkeleton ? (
                <div className="space-y-3">
                  <FieldSkeleton className="h-5 w-24" />
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 6 }, (_, i) => (
                      <FieldSkeleton key={i} className="h-8 rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : (
                <CategorySelector
                  value={formData.categories}
                  onChange={(categories) => setFormData(prev => ({ ...prev, categories }))}
                  disabled={loadingState.isLoading}
                />
              )}
            </div>

            {/* Tags Section */}
            <DropdownSection
              title="Tags"
              icon={
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
              isOpen={sidebarDropdowns.tags}
              onToggle={() => toggleSidebarDropdown('tags')}
            >

              <TagsInput
                value={formData.tags}
                onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                placeholder="Thêm tags cho bài viết..."
                maxTags={20}
                disabled={loadingState.isLoading}
              />
            </DropdownSection>

            {/* Featured Image Section */}
            <DropdownSection
              title="Ảnh đại diện"
              icon={
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              isOpen={sidebarDropdowns.featuredImage}
              onToggle={() => toggleSidebarDropdown('featuredImage')}
            >

              <Suspense fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              }>
                <MediaUpload
                  value={formData.cover_image}
                  alt={formData.cover_image_alt || formData.title || 'Ảnh đại diện bài viết'}
                  isLoading={loadingState.isLoadingArticleData} // Pass loading state
                  onChange={(url: string, alt?: string) => {
                    setFormData(prev => ({
                      ...prev,
                      cover_image: url,
                      cover_image_alt: alt !== undefined ? alt : (prev.title || 'Ảnh đại diện bài viết')
                    }));
                  }}
                  onRemove={() => {
                    setFormData(prev => ({
                      ...prev,
                      cover_image: '',
                      cover_image_alt: ''
                    }));
                  }}
                  disabled={loadingState.isLoading}
                />
              </Suspense>
            </DropdownSection>

            {/* Author Section */}
            <DropdownSection
              title="Tác giả"
              icon={
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              isOpen={sidebarDropdowns.author}
              onToggle={() => toggleSidebarDropdown('author')}
            >



              {/* Author Selection - Progressive Loading */}
              {shouldShowAuthorsSkeleton ? (
                <div className="space-y-3">
                  <FieldSkeleton className="h-5 w-24" />
                  <FieldSkeleton className="h-10 w-full rounded-lg" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chọn tác giả
                  </label>
                  <AuthorSelector
                    value={formData.author_id}
                    authors={authors}
                    onChange={(authorId) => setFormData(prev => ({ ...prev, author_id: authorId }))}
                    disabled={loadingState.isLoading}
                  />
                </div>
              )}
            </DropdownSection>

            {/* SEO Index Control Section */}
            {shouldShowSEOSkeleton ? (
              <SEOSkeleton />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tối ưu tìm kiếm</h3>
                </div>

              <div className="space-y-4">
                {/* Index/NoIndex Toggle */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-600/60">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      formData.robots_noindex
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      {formData.robots_noindex ? (
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Cho phép lập chỉ mục
                        </span>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                          formData.robots_noindex
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        }`}>
                          {formData.robots_noindex ? 'NoIndex' : 'Index'}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formData.robots_noindex
                          ? 'Bài viết sẽ không xuất hiện trên Google và các công cụ tìm kiếm'
                          : 'Bài viết có thể được lập chỉ mục và hiển thị trên Google'
                        }
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setFormData(prev => ({ ...prev, robots_noindex: !prev.robots_noindex }))}
                    disabled={loadingState.isLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                      formData.robots_noindex
                        ? 'bg-red-500 focus:ring-red-500/20'
                        : 'bg-green-500 focus:ring-green-500/20'
                    } ${loadingState.isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                    title={formData.robots_noindex ? 'Bật chế độ Index' : 'Bật chế độ NoIndex'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                        formData.robots_noindex ? 'translate-x-1' : 'translate-x-6'
                      }`}
                    />
                  </button>
                </div>

                {/* Additional SEO Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Lưu ý về Index/NoIndex:</p>
                      <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                        <li>• <strong>Index:</strong> Bài viết sẽ xuất hiện trên Google</li>
                        <li>• <strong>NoIndex:</strong> Bài viết sẽ bị ẩn khỏi kết quả tìm kiếm</li>
                        <li>• Thay đổi có thể mất vài ngày để có hiệu lực</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Schema Type Selector Section - Compact Design */}
            {shouldShowSEOSkeleton ? (
              <SEOSkeleton />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Schema Type</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tối ưu hiển thị Google</p>
                    </div>
                  </div>

                  {/* Current Selection Display */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{
                      formData.schema_type === 'Article' ? '📄' :
                      formData.schema_type === 'NewsArticle' ? '📰' :
                      formData.schema_type === 'BlogPosting' ? '✍️' :
                      formData.schema_type === 'TechArticle' ? '⚙️' :
                      formData.schema_type === 'HowTo' ? '📋' :
                      formData.schema_type === 'Recipe' ? '👨‍🍳' :
                      formData.schema_type === 'Review' ? '⭐' :
                      formData.schema_type === 'FAQ' ? '❓' : '📄'
                    }</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formData.schema_type || 'Article'}
                    </span>
                  </div>
                </div>

                {/* Compact Schema Type Selector */}
                <div className="space-y-3">
                  {/* Primary Options - Most Common */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { type: 'Article', name: 'Bài viết', icon: '📄', recommended: true },
                      { type: 'HowTo', name: 'Hướng dẫn', icon: '📋' },
                      { type: 'Review', name: 'Đánh giá', icon: '⭐' },
                      { type: 'NewsArticle', name: 'Tin tức', icon: '📰' }
                    ].map((schema) => {
                      const isSelected = formData.schema_type === schema.type;
                      return (
                        <button
                          key={schema.type}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, schema_type: schema.type }));
                            setHasUnsavedChanges(true); // Trigger autosave
                          }}
                          disabled={loadingState.isLoading}
                          className={`
                            relative p-3 rounded-lg border transition-all duration-200 text-center group
                            ${isSelected
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600'
                            }
                            ${loadingState.isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
                          `}
                        >
                          {schema.recommended && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></div>
                          )}

                          <div className="text-lg mb-1">{schema.icon}</div>
                          <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{schema.name}</div>

                          {isSelected && (
                            <div className="absolute -top-1 -left-1">
                              <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Secondary Options - Expandable */}
                  <details className="group">
                    <summary className="flex items-center justify-center gap-2 p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <span>Thêm loại khác</span>
                      <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>

                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { type: 'BlogPosting', name: 'Blog Post', icon: '✍️' },
                        { type: 'TechArticle', name: 'Kỹ thuật', icon: '⚙️' },
                        { type: 'Recipe', name: 'Công thức', icon: '👨‍🍳' },
                        { type: 'FAQ', name: 'FAQ', icon: '❓' }
                      ].map((schema) => {
                        const isSelected = formData.schema_type === schema.type;
                        return (
                          <button
                            key={schema.type}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, schema_type: schema.type }));
                              setHasUnsavedChanges(true); // Trigger autosave
                            }}
                            disabled={loadingState.isLoading}
                            className={`
                              relative p-3 rounded-lg border transition-all duration-200 text-center group
                              ${isSelected
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-600'
                              }
                              ${loadingState.isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
                            `}
                          >
                            <div className="text-lg mb-1">{schema.icon}</div>
                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{schema.name}</div>

                            {isSelected && (
                              <div className="absolute -top-1 -left-1">
                                <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </details>
                </div>

                {/* Compact Schema Info */}
                <div className="mt-4 flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                        Schema: {formData.schema_type || 'Article'}
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400">
                        {formData.schema_type === 'HowTo' ? 'Rich snippets với từng bước' :
                         formData.schema_type === 'Review' ? 'Hiển thị rating stars' :
                         formData.schema_type === 'Recipe' ? 'Thời gian nấu + nutrition' :
                         formData.schema_type === 'NewsArticle' ? 'Xuất hiện Google News' :
                         formData.schema_type === 'FAQ' ? 'Dropdown Q&A trên Google' :
                         'Tối ưu hiển thị cơ bản'}
                      </div>
                    </div>
                  </div>

                  {/* Quick Benefits */}
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>+CTR</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>


    </div>
  );
}
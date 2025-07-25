import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { ArticlesService } from '../../../../../backend';
import type { Category, CreateArticleData, AuthorOption, Article } from '../../../../../backend';
import { generateSlug } from '../../../../utils/slug-generator';
import { processBulkTags, createTagFeedbackMessage, lowercaseNormalizeTag } from '../../../../utils/tag-processing';
import LoadingSpinner from '../../common/LoadingSpinner';
import '../../../../styles/article-editor.css';
import '../../../../styles/tiptap-editor.css';

// PRELOADERS - Intelligent data loading
import { getInstantCategoriesData, preloadCategoriesData, isCategoriesDataReady } from '../../../../utils/admin/preloaders/categories-preloader';
import { getInstantAuthorsData, preloadAuthorsData, isAuthorsDataReady } from '../../../../utils/admin/preloaders/authors-preloader';
import { SmartPreloader } from '../../../../utils/admin/preloaders/preload-manager';



// LAZY LOAD heavy components
const TiptapEditor = lazy(() => import('./TiptapEditor'));
const ImageUpload = lazy(() => import('./ImageUpload'));




interface ArticleEditorInitialData {
  article: Article | null;
  categories: Category[] | null;
  authors: AuthorOption[] | null;
  articleId: string;
}

interface ArticleEditorProps {
  articleId?: string; // Nếu có = edit mode, không có = create mode
  initialData?: ArticleEditorInitialData; // Pre-loaded data từ server
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



export default function ArticleEditor({ articleId, initialData, onSave }: ArticleEditorProps) {

  // HYBRID APPROACH: Use initial data if available, but don't block UI
  const currentArticleId = articleId || initialData?.articleId || null;

  // Determine if we're in edit mode
  const isEditMode = !!currentArticleId;

  // INSTANT UI: Track mount state for immediate UI display
  const [isMounted, setIsMounted] = useState(false);

  // Mount immediately for instant UI
  useEffect(() => {
    setIsMounted(true);
  }, []);



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
    featured_image: '',
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

  const [tagInput, setTagInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Debug: Track state changes (moved after state declarations)
  useEffect(() => {
    console.log('🎨 UI STATE: isAutoSaving changed to', isAutoSaving);
  }, [isAutoSaving]);

  useEffect(() => {
    console.log('📊 STATE: hasUnsavedChanges changed to', hasUnsavedChanges);
  }, [hasUnsavedChanges]);

  const [slugError, setSlugError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);

  // HYBRID APPROACH: Use initial data if available
  const smartInitialState = initialData ? {
    isLoading: false,
    isDataLoaded: true, // We have pre-loaded data
    isValidatingSlug: false,
    isEditorReady: false
  } : {
    isLoading: false,
    isDataLoaded: !isEditMode, // true for create mode, false for edit mode
    isValidatingSlug: false,
    isEditorReady: false
  };

  const [loadingState, setLoadingState] = useState(smartInitialState);

  // Professional autosave progress animation
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (loadingState.isLoading || isAutoSaving) {
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
  }, [loadingState.isLoading, isAutoSaving]);



  // HYBRID LOAD: Use initial data or fetch if needed
  useEffect(() => {
    if (!isMounted) return;

    // If we have initial data, use it immediately
    if (initialData) {
      console.log('🚀 HYBRID: Using pre-loaded data');

      // Set article data
      if (initialData.article) {
        setFormData({
          title: initialData.article.title || '',
          content: initialData.article.content || '',
          excerpt: initialData.article.excerpt || '',
          meta_title: initialData.article.meta_title || '',
          meta_description: initialData.article.meta_description || '',
          slug: initialData.article.slug || '',
          status: initialData.article.status || 'draft',
          focus_keyword: initialData.article.focus_keyword || '',
          categories: (() => {
            if (initialData.article.category_ids && initialData.article.category_ids.length > 0) {
              return initialData.article.category_ids;
            }
            if (initialData.article.category_id) {
              return [initialData.article.category_id];
            }
            return [];
          })(),
          tags: initialData.article.tags || [],
          featured_image: initialData.article.featured_image || '',
          cover_image_alt: initialData.article.cover_image_alt || '',
          lang: initialData.article.lang || 'vi',
          article_type: initialData.article.article_type || 'article',
          is_public: initialData.article.is_public || false,
          is_featured: initialData.article.is_featured || false,
          schema_type: initialData.article.schema_type || 'Article',
          robots_noindex: initialData.article.robots_noindex || false,
          published_date: initialData.article.published_date ?
            new Date(initialData.article.published_date).toISOString().slice(0, 16) :
            new Date().toISOString().slice(0, 16),
          updated_date: new Date().toISOString().slice(0, 16),
          author_id: initialData.article.author_id || ''
        });
        setHasUnsavedChanges(false); // Reset unsaved changes for loaded data
      }

      // Set categories data
      if (initialData.categories && initialData.categories.length > 0) {
        setCategories(initialData.categories);
      }

      // Set authors data
      if (initialData.authors && initialData.authors.length > 0) {
        setAuthors(initialData.authors);
        // Set first author as default if no author selected
        if (!initialData.article?.author_id) {
          setFormData(prev => ({ ...prev, author_id: initialData.authors![0].id }));
        }
      }

      // FIXED: Immediate background refresh for instant data sync
      setTimeout(() => {
        console.log('🔄 HYBRID: Background refresh starting');
        refreshDataSilently();
      }, 100); // Reduced from 2000ms to 100ms

      // Trigger smart preloading for navigation
      SmartPreloader.triggerSmartPreload('navigation');

      return;
    }

    // Fallback to old loading method if no initial data
    if (currentArticleId) {
      const loadAllData = async () => {
        setLoadError('');
        setLoadingState(prev => ({ ...prev, isLoading: true }));

        try {
          // OPTIMIZED: Use preloaded data + article fetch
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
            setFormData({
              title: articleResult.data.title || '',
              content: articleResult.data.content || '',
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
              featured_image: articleResult.data.cover_image || '',
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

            // Mark data as loaded
            setLoadingState(prev => ({ ...prev, isDataLoaded: true }));


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

        } catch (err) {
          setLoadError('Có lỗi xảy ra khi tải dữ liệu');
          setLoadingState(prev => ({ ...prev, isLoading: false }));
        }
      };

      loadAllData();
    }
  }, [isMounted, initialData, currentArticleId]);

  // STALE-WHILE-REVALIDATE: Background refresh function
  const refreshDataSilently = async () => {
    if (!currentArticleId) return;

    try {
      console.log('🔄 Silent refresh: Fetching fresh data');
      const [articleResult, categoriesData, authorsData] = await Promise.all([
        ArticlesService.getArticleForEdit(currentArticleId),
        preloadCategoriesData(),
        preloadAuthorsData()
      ]);

      // Update data silently without affecting UI
      if (articleResult.data && !hasUnsavedChanges) {
        // Only update if user hasn't made changes
        console.log('🔄 Silent refresh: Updating article data');
        setFormData(prev => ({
          ...prev,
          // Only update non-user-editable fields
          updated_date: articleResult.data.updated_at ?
            new Date(articleResult.data.updated_at).toISOString().slice(0, 16) :
            prev.updated_date
        }));
      }

      // Always update dropdown data
      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData);
      }
      if (authorsData && authorsData.length > 0) {
        setAuthors(authorsData);
      }

    } catch (err) {
      console.warn('🔄 Silent refresh failed:', err);
    }
  };



  // Track unsaved changes
  useEffect(() => {
    console.log('📝 FORM CHANGE: Setting hasUnsavedChanges = true', {
      title: formData.title.substring(0, 30) + '...',
      contentLength: formData.content.length,
      slug: formData.slug,
      is_public: formData.is_public,
      timestamp: new Date().toLocaleTimeString()
    });
    setHasUnsavedChanges(true);
  }, [formData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to publish
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handlePublish();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // IMPROVED: Smart auto-save with debouncing
  useEffect(() => {
    console.log('🔄 AUTOSAVE: useEffect triggered', {
      hasUnsavedChanges,
      hasTitle: !!formData.title.trim(),
      title: formData.title.substring(0, 30) + '...',
      contentLength: formData.content.length,
      slug: formData.slug
    });

    if (!hasUnsavedChanges || !formData.title.trim()) {
      console.log('❌ AUTOSAVE: Skipped - no changes or no title', {
        hasUnsavedChanges,
        hasTitle: !!formData.title.trim()
      });
      return;
    }

    console.log('⏰ AUTOSAVE: Setting timeout (2s)...');

    // Debounced auto-save: wait 2 seconds after last change, then save
    const autoSaveTimeout = setTimeout(() => {
      console.log('🚀 AUTOSAVE: Timeout triggered, checking conditions...');
      if (hasUnsavedChanges && formData.title.trim()) {
        console.log('✅ AUTOSAVE: Conditions met, calling handleSave...');
        handleSave('autosave'); // Use different action for autosave
      } else {
        console.log('❌ AUTOSAVE: Conditions not met at timeout', {
          hasUnsavedChanges,
          hasTitle: !!formData.title.trim()
        });
      }
    }, 2000); // 2 seconds debounce

    return () => {
      console.log('🧹 AUTOSAVE: Cleanup - clearing timeout');
      clearTimeout(autoSaveTimeout);
    };
  }, [hasUnsavedChanges, formData.title, formData.content, formData.slug]);

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
    setFormData(prev => {
      const updates: any = {
        title,
        meta_title: title.length <= 60 ? title : title.substring(0, 60)
      };

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
      const excludeId = isEditMode ? (articleId || currentArticleId) : undefined;
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



  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();

      // Sử dụng utility function với options cho ArticleEditor
      const result = processBulkTags(tagInput, formData.tags, {
        maxLength: 50,
        caseSensitive: false,
        normalizeFunction: lowercaseNormalizeTag,
        separator: ','
      });

      // Thêm valid tags vào formData
      if (result.validTags.length > 0) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, ...result.validTags]
        }));
      }

      // Hiển thị feedback
      if (result.duplicates.length > 0 || result.tooLong.length > 0) {
        const feedback = createTagFeedbackMessage(result);
        setSaveStatus(`⚠️ ${feedback.message.split('\n')[1] || feedback.message}`); // Chỉ hiển thị warning part
        setTimeout(() => setSaveStatus(''), 3000);
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

  // Handle cover image upload
  const handleCoverImageUpload = (url: string) => {
    console.log('🖼️ ArticleEditor: Cover image uploaded, URL:', url);
    setFormData(prev => {
      const newData = { ...prev, featured_image: url };
      console.log('🖼️ ArticleEditor: Updated formData.featured_image:', newData.featured_image);
      return newData;
    });
    setShowImageUpload(false);
  };

  // Handle publish action - direct save with publish flag
  const handlePublish = async () => {
    console.log('📢 PUBLISH: Starting publish action');
    handleSave('publish');
  };

  const handleSave = async (action: 'save' | 'autosave' | 'publish') => {
    const isAutoSave = action === 'autosave';
    const isPublish = action === 'publish';

    console.log(`💾 SAVE: Starting ${isAutoSave ? 'AUTOSAVE' : isPublish ? 'PUBLISH' : 'MANUAL SAVE'}`, {
      action,
      isAutoSave,
      isPublish,
      isEditMode,
      hasUnsavedChanges,
      formData: {
        title: formData.title.substring(0, 50) + '...',
        contentLength: formData.content.length,
        slug: formData.slug,
        is_public: formData.is_public,
        author_id: formData.author_id,
        author_id_processed: formData.author_id.trim() || null
      }
    });

    if (isAutoSave) {
      console.log('🔵 AUTOSAVE: Setting isAutoSaving = true');
      setIsAutoSaving(true);
    } else {
      console.log(`🔄 ${isPublish ? 'PUBLISH' : 'MANUAL SAVE'}: Setting isLoading = true`);
      setLoadingState(prev => ({ ...prev, isLoading: true }));
    }



    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setSaveStatus('❌ Tiêu đề không được để trống');
        setLoadingState(prev => ({ ...prev, isLoading: false }));
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }

      if (!formData.content.trim()) {
        setSaveStatus('❌ Nội dung không được để trống');
        setLoadingState(prev => ({ ...prev, isLoading: false }));
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }

      if (!formData.slug.trim()) {
        setSaveStatus('❌ Slug không được để trống');
        setLoadingState(prev => ({ ...prev, isLoading: false }));
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }

      if (slugError) {
        setSaveStatus('❌ ' + slugError);
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }

      // CRITICAL: Calculate effective values FIRST
      const effectiveIsPublic = isPublish ? true : formData.is_public;
      const status = effectiveIsPublic ? 'published' : 'draft';

      console.log('📊 STATUS LOGIC:', {
        isPublish,
        original_is_public: formData.is_public,
        effective_is_public: effectiveIsPublic,
        calculated_status: status,
        isEditMode,
        isAutoSave
      });

      // Prepare article data with correct status
      const articleData: CreateArticleData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim(),
        slug: formData.slug.trim(),
        status, // ✅ Now uses correct calculated status
        featured: formData.is_featured,
        lang: formData.lang,
        article_type: formData.article_type,

        // SEO fields
        meta_title: formData.meta_title.trim(),
        meta_description: formData.meta_description.trim(),
        focus_keyword: formData.focus_keyword.trim(),
        robots_directive: formData.robots_noindex ? 'noindex,nofollow' : 'index,follow',

        // Media
        cover_image: formData.featured_image?.trim() || undefined,
        cover_image_alt: formData.cover_image_alt?.trim() || undefined,

        // Schema
        schema_type: formData.schema_type,

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



      // DEBUG: Log the final articleData being sent
      console.log('🔍 FINAL ARTICLE DATA:', {
        articleId: articleId || currentArticleId,
        isEditMode,
        isPublish,
        articleData: {
          title: articleData.title,
          status: articleData.status,
          featured: articleData.featured,
          content_length: articleData.content.length,
          author_id: formData.author_id.trim() || null
        }
      });

      let data, error;

      if (isEditMode && (articleId || currentArticleId)) {
        // Update existing article
        console.log('🔄 CALLING updateArticle with:', {
          articleId: articleId || currentArticleId,
          status: articleData.status,
          authorId: formData.author_id.trim() || null
        });

        const result = await ArticlesService.updateArticle(
          articleId || currentArticleId!,
          articleData,
          formData.author_id.trim() || null // Convert empty string to null for UUID
        );
        data = result.data;
        error = result.error;
      } else {
        // Create new article
        const result = await ArticlesService.createArticle(
          articleData,
          formData.author_id.trim() || null // Convert empty string to null for UUID
        );
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error(`❌ SAVE ERROR (${isAutoSave ? 'AUTOSAVE' : isPublish ? 'PUBLISH' : 'MANUAL'}):`, {
          isEditMode,
          isAutoSave,
          isPublish,
          error: error.message || error,
          formData: {
            title: formData.title.substring(0, 30),
            contentLength: formData.content.length
          }
        });
        setSaveStatus('❌ ' + (error.message || 'Có lỗi xảy ra'));
        setLoadingState(prev => ({ ...prev, isLoading: false }));
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }

      if (data) {
        console.log(`✅ SAVE SUCCESS (${isAutoSave ? 'AUTOSAVE' : isPublish ? 'PUBLISH' : 'MANUAL'}):`, {
          isAutoSave,
          isPublish,
          isEditMode,
          articleId: data.id,
          title: data.title?.substring(0, 30) + '...',
          timestamp: new Date().toLocaleTimeString()
        });

        // Update save state
        setHasUnsavedChanges(false);
        setLastSaved(new Date());

        // Update form state if published
        if (isPublish) {
          setFormData(prev => ({ ...prev, is_public: true, status: 'published' }));
          console.log('📢 PUBLISH: Updated form state to published');
        }

        console.log('📝 SAVE: Updated states', {
          hasUnsavedChanges: false,
          lastSaved: new Date().toLocaleTimeString(),
          isPublish,
          formUpdated: isPublish
        });

        // Show different messages for manual vs auto save vs publish
        if (!isAutoSave && !isPublish) {
          console.log('💬 MANUAL SAVE: Showing success message');
          setSaveStatus('✅ Đã lưu thành công');
          setTimeout(() => setSaveStatus(''), 2000);
        } else {
          console.log(`🔇 ${isAutoSave ? 'AUTOSAVE' : 'PUBLISH'}: Silent success (no message)`);
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
      console.log(`🏁 SAVE CLEANUP (${isAutoSave ? 'AUTOSAVE' : isPublish ? 'PUBLISH' : 'MANUAL'}):`, {
        isAutoSave,
        isPublish,
        timestamp: new Date().toLocaleTimeString()
      });

      if (isAutoSave) {
        console.log('🔵 AUTOSAVE: Setting isAutoSaving = false');
        setIsAutoSaving(false);
      } else {
        console.log(`🔄 ${isPublish ? 'PUBLISH' : 'MANUAL SAVE'}: Setting isLoading = false`);
        setLoadingState(prev => ({ ...prev, isLoading: false }));
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
      {/* STATIC HEADER - Hiển thị ngay lập tức */}
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
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Save Status & Indicators */}
              <div className="flex items-center gap-2">
                {saveStatus && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {saveStatus}
                  </span>
                )}
                {isAutoSaving && (
                  <div className="flex items-center gap-3 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 transition-all duration-300 ease-out">
                    {/* Text */}
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                      Đang tự động lưu...
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
                onClick={() => handlePublish()}
                disabled={loadingState.isLoading}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 font-medium ${
                  loadingState.isLoading
                    ? 'bg-blue-500 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:scale-[1.02] text-white'
                }`}
                title="Xuất bản bài viết (Ctrl+S)"
              >
                {loadingState.isLoading ? (
                  <>
                    <span>Đang xuất bản...</span>
                    {/* Progress indicator */}
                    <div className="w-16 h-1 bg-blue-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-75 rounded-full"
                        style={{ width: `${saveProgress}%` }}
                      ></div>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Xuất bản</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESSIVE CONTENT - Show immediately or with data */}
      <div className="w-full py-4">
        <div className="article-editor-main">

          {/* Left Column - Main Content */}
          <div className="space-y-6">

            {/* PROGRESSIVE LOADING: Show form immediately if we have data or in create mode */}
            {(loadingState.isDataLoaded || !isEditMode) ? (
              <>
                {/* Title Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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
                    className="w-full px-4 py-3 text-xl font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex-1 flex flex-col">
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

              <div className="flex-1 flex flex-col">
                <div className="article-content-editor flex-1">
                  <Suspense fallback={
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 p-8 flex items-center justify-center min-h-[780px]">
                      <div className="text-center">
                        <LoadingSpinner size="lg" color="blue" className="mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Đang tải trình soạn thảo...</p>
                      </div>
                    </div>
                  }>
                    <TiptapEditor
                      value={formData.content}
                      onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                      placeholder="Bắt đầu viết nội dung tuyệt vời của bạn..."
                      height="780px"
                      flexHeight={true}
                      className="focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </Suspense>
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
            </div>

            {/* SEO Settings Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">SEO & Tối ưu hóa</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left side - SEO Score & Analysis */}
                <div className="space-y-4">
                  {/* SEO Score */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-2 ${
                        seoAnalysis.score >= 80 ? 'text-green-600' :
                        seoAnalysis.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {seoAnalysis.score}
                        <span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full ${
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
                  </div>

                  {/* SEO Checklist */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Checklist SEO</h4>
                    <div className="space-y-2">
                      {seoAnalysis.checks.map((check, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            check.status === 'good' ? 'bg-green-500' :
                            check.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-xs text-gray-700 dark:text-gray-300">{check.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{check.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side - SEO Fields */}
                <div className="space-y-4">
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Từ khóa chính giúp tối ưu hóa nội dung cho search engine
                    </p>
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <div className={`text-xs mt-1 ${
                      formData.meta_title.length >= 50 && formData.meta_title.length <= 60 ? 'text-green-600 dark:text-green-400' :
                      formData.meta_title.length > 60 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      Tối ưu: 50-60 ký tự
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meta Description ({formData.meta_description.length}/160)
                    </label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="Mô tả ngắn gọn hiển thị trên Google..."
                      maxLength={160}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    />
                    <div className={`text-xs mt-1 ${
                      formData.meta_description.length >= 120 && formData.meta_description.length <= 160
                        ? 'text-green-600 dark:text-green-400'
                        : formData.meta_description.length > 160
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      Tối ưu: 120-160 ký tự
                    </div>
                  </div>
                </div>
              </div>
            </div>
              </>
            ) : (
              /* LOADING STATE: Show minimal skeleton while loading */
              <div className="space-y-6">
                {/* Title Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>

                {/* Content Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
                  <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>

                {/* Loading indicator */}
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" color="blue" className="mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu bài viết...</p>
                </div>
              </div>
            )}

          </div>

          {/* Right Column - Sidebar Settings */}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ngày xuất bản
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.published_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, published_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ngày cập nhật
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.updated_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, updated_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Danh mục</h3>
              </div>

              <div className="space-y-2">
                {!loadingState.isDataLoaded ? (
                  <div className="text-center py-4">
                    <LoadingSpinner size="md" color="blue" className="mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải danh mục...</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Không có danh mục nào</p>
                  </div>
                ) : (
                  categories.map((cat) => {
                    const isSelected = formData.categories.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCategoryToggle(cat.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className={`ml-3 text-sm font-medium ${
                          isSelected
                            ? 'text-blue-900 dark:text-blue-200'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {cat.name}
                        </span>
                        {isSelected && (
                          <svg className="ml-auto w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              {formData.categories.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      Đã chọn ({formData.categories.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.categories.map((catId, index) => {
                      const category = categories.find(cat => cat.id === catId);
                      return category ? (
                        <span
                          key={`category-${index}-${catId}`}
                          className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 text-xs rounded"
                        >
                          {typeof category === 'string' ? category : category.name}
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

            {/* Tags Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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
                    placeholder="Nhập tag (phân tách bằng dấu phẩy) và nhấn Enter..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    onClick={() => {
                      if (tagInput.trim()) {
                        // Sử dụng utility function với options cho ArticleEditor
                        const result = processBulkTags(tagInput, formData.tags, {
                          maxLength: 50,
                          caseSensitive: false,
                          normalizeFunction: lowercaseNormalizeTag,
                          separator: ','
                        });

                        // Thêm valid tags vào formData
                        if (result.validTags.length > 0) {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags, ...result.validTags]
                          }));
                        }

                        // Hiển thị feedback
                        if (result.duplicates.length > 0 || result.tooLong.length > 0) {
                          const feedback = createTagFeedbackMessage(result);
                          setSaveStatus(`⚠️ ${feedback.message.split('\n')[1] || feedback.message}`); // Chỉ hiển thị warning part
                          setTimeout(() => setSaveStatus(''), 3000);
                        }

                        setTagInput('');
                      }
                    }}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                  >
                    +
                  </button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-900 dark:text-green-300">
                        Tags ({formData.tags.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => {
                        const tagName = typeof tag === 'string' ? tag : (tag?.name || String(tag));
                        return (
                          <span
                            key={`tag-${index}-${tagName}`}
                            className="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-700 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300 text-xs rounded"
                          >
                            #{tagName}
                            <button
                              onClick={() => removeTag(typeof tag === 'string' ? tag : tagName)}
                              className="ml-1 w-3 h-3 text-green-600 dark:text-green-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Featured Image Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImageUpload(true)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1"
                    title="Upload ảnh từ máy tính"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload
                  </button>
                </div>

                {/* Alt text field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alt text (Mô tả ảnh cho SEO)
                  </label>
                  <input
                    type="text"
                    value={formData.cover_image_alt}
                    onChange={(e) => setFormData(prev => ({ ...prev, cover_image_alt: e.target.value }))}
                    placeholder="Mô tả ngắn gọn về nội dung ảnh..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Alt text giúp cải thiện SEO và accessibility
                  </p>
                </div>

                {formData.featured_image && (
                  <div className="relative bg-gray-50 dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
                    <img
                      src={formData.featured_image}
                      alt={formData.cover_image_alt || "Preview"}
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, featured_image: '', cover_image_alt: '' }))}
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

            {/* Author Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tác giả</h3>
              </div>

              {/* Current Author Display */}
              {(() => {
                const currentAuthor = authors.find(author => author.id === formData.author_id);
                return currentAuthor ? (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {currentAuthor.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {currentAuthor.full_name}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {currentAuthor.role_display_name}
                        </div>
                        {currentAuthor.email && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {currentAuthor.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Author Selection */}
              {!loadingState.isDataLoaded ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" color="gray" className="mr-2" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Đang tải tác giả...</span>
                </div>
              ) : (
                <select
                  value={formData.author_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, author_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {authors.map(author => (
                    <option key={author.id} value={author.id}>
                      {author.full_name} - {author.role_display_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Cover Image Upload Modal */}
      {showImageUpload && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
              <LoadingSpinner size="lg" color="blue" className="mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Đang tải trình upload ảnh...</p>
            </div>
          </div>
        }>
          <ImageUpload
            onImageUpload={handleCoverImageUpload}
            onClose={() => setShowImageUpload(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
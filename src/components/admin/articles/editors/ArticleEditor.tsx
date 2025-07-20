// ===== TEMPORARY SIMPLIFIED IMPORTS FOR DEBUGGING =====
import React, { useState, useEffect, Suspense, startTransition } from 'react';
import { ArticlesService } from '../../../../../backend';
import type { Category, CreateArticleData, AuthorOption, Article } from '../../../../../backend';

// Layout components
import { ArticleEditorLayout, MainContent, Sidebar } from './layouts';

// Sections
import { TitleSection, ContentEditorSection, ExcerptSection, SEOSection, SchemaTypeSection } from './components/sections';

// Sidebar components
import { PublishBox } from './components/sidebar/PublishBox';
import { CategoriesSection } from './components/sidebar/CategoriesSection';

// Hooks
import { useArticleData } from './hooks/useArticleData';
import { useFormHandlers, type FormData } from './hooks/useFormHandlers';
import { useSeoAnalysis, getSeoScoreColor, getSeoScoreGradient, getSeoScoreBadge, getSeoCheckColor } from './hooks/useSeoAnalysis';
import { useSaveHandlers } from './hooks/useSaveHandlers';
import { useLoadingHelpers } from './components/LoadingStates';

// Utils and constants
import { FALLBACK_AUTHORS, type ArticleEditorProps } from './articleEditorUtils';
import { DEFAULT_FORM_DATA, DEFAULT_SIDEBAR_DROPDOWNS } from './constants/articleEditorConstants';
import { getArticleId, getSidebarDropdownState, saveDropdownState, formatDate, hasFormChanges, validateFormData, cleanFormData, extractImagesFromContent, calculateSaveProgress } from './utils/articleEditorHelpers';
import { generateSlug } from '../../../../utils/slug-generator';
import { processBulkTags, createTagFeedbackMessage, lowercaseNormalizeTag } from '../../../../utils/tag-processing';

// Other components
import LoadingSpinner from '../../common/LoadingSpinner';
import MediaUpload from '../create/components/MediaUpload';
import TagsInput from '../create/components/TagsInput';
import AuthorSelector from '../create/components/AuthorSelector';
import CategorySelector from '../create/components/CategorySelector';
import DateTimePicker from '../create/components/DateTimePicker';
import SchemaPreview from '../SchemaPreview';
import { BlogService } from '../../../../services/blog-service';
import { DropdownSection } from './components/DropdownSection';
import { EditorSkeleton, ExcerptSkeleton, SidebarSkeleton, CategoriesSkeleton, TagsSkeleton, AuthorsSkeleton } from './components/SkeletonComponents';
import AutosaveIndicator from './components/AutosaveIndicator';
import { lazy } from 'react';

// Styles
import '../../../../styles/article-editor.css';
import '../../../../styles/tiptap-editor.css';

// Lazy load TiptapEditor
const TiptapEditor = lazy(() => import('./TiptapEditor'));























export default function ArticleEditor({ articleId, onSave }: ArticleEditorProps) {

  // FIXED: Get article ID immediately (synchronous) để tránh flash
  const currentArticleId = getArticleId(articleId);
  const isEditMode = !!currentArticleId;



  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);


  const [validationError, setValidationError] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track original content for image cleanup (moved to useArticleData hook)
  const [originalContent, setOriginalContent] = useState<string>('');



  const [slugError, setSlugError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [showSlugEdit, setShowSlugEdit] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Dropdown state management for sidebar sections
  const [sidebarDropdowns, setSidebarDropdowns] = useState(() =>
    getSidebarDropdownState(DEFAULT_SIDEBAR_DROPDOWNS)
  );

  // Track unsaved changes - only when user actually makes changes
  const [initialFormData, setInitialFormData] = useState<any>(null);



  // ===== PROGRESS ANIMATION MOVED =====
  // Progress animation logic đã được tích hợp vào useSaveHandlers hook



  // OPTIMIZED: Data loading logic đã được tách thành hook riêng
  const { categories, authors, loadingState, loadingActions } = useArticleData({
    currentArticleId,
    isEditMode,
    setFormData,
    setOriginalContent,
    setCurrentUserId,
    setLoadError,
    setHasUnsavedChanges,
    setInitialFormData,
    formData
  });

  // Loading helpers
  const {
    shouldShowArticleSkeleton,
    shouldShowCategoriesSkeleton,
    shouldShowAuthorsSkeleton,
    shouldShowTagsSkeleton,
    shouldShowSEOSkeleton,
    isAnyLoading,
    isFormDisabled
  } = useLoadingHelpers(loadingState, isEditMode);





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
      JSON.stringify(formData.categories) !== JSON.stringify(initialFormData.categories) ||
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
        handleManualSave(); // Manual save
      }
      // Ctrl/Cmd + Shift + P to publish
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        // Set public and then save
        setFormData(prev => ({ ...prev, is_public: true }));
        setTimeout(() => handleManualSave(), 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ===== AUTOSAVE LOGIC MOVED =====
  // Autosave logic sẽ được di chuyển xuống sau khi save handlers được định nghĩa

  // Use the optimized slug generator from utils (supports Vietnamese diacritics)



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

    loadingActions.setValidatingSlug(true);
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
      loadingActions.setValidatingSlug(false);
    }
  };

  // Form handlers
  const formHandlers = useFormHandlers({
    formData,
    setFormData,
    setHasUnsavedChanges,
    setSlugError,
    validateSlug,
    isEditMode,
    currentArticleId
  });

  // SEO Analysis
  const seoAnalysis = useSeoAnalysis({ formData });

  // Save Handlers
  const { saveStates, handleAutoSave, handleManualSave } = useSaveHandlers({
    formData,
    isEditMode,
    currentArticleId,
    currentUserId,
    setLastSaved,
    setHasUnsavedChanges,
    setValidationError,
    onSave
  });

  // IMPROVED: Smart auto-save with debouncing
  useEffect(() => {
    // Skip autosave if no changes
    if (!hasUnsavedChanges || saveStates.isManualSaving) {
      return;
    }

    // Skip autosave if required fields are empty
    if (!formData.title.trim() || !formData.slug.trim() || formData.content.trim().length < 10) {
      return;
    }

    // Debounced auto-save: wait 2 seconds after last change, then save
    const autoSaveTimeout = setTimeout(() => {
      if (hasUnsavedChanges) {
        handleAutoSave();
      }
    }, 2000);

    return () => {
      clearTimeout(autoSaveTimeout);
    };
  }, [hasUnsavedChanges, saveStates.isManualSaving, formData.title, formData.slug, formData.content, formData.tags, handleAutoSave]);

  // Handle manual slug change with smart filtering
  const handleSlugChange = (slug: string) => {
    // Smart filtering: auto-clean the slug as user types
    const cleanSlug = generateSlug(slug);
    setFormData(prev => ({ ...prev, slug: cleanSlug }));

    // Debounce slug validation
    const timeoutId = setTimeout(() => {
      validateSlug(cleanSlug);
    }, 500);

    return () => clearTimeout(timeoutId);
  };







  // ===== SAVE HANDLERS MOVED =====
  // Save handlers logic đã được tách ra hook riêng: hooks/useSaveHandlers.ts






  // Toggle sidebar dropdown sections
  const toggleSidebarDropdown = (section: keyof typeof sidebarDropdowns) => {
    setSidebarDropdowns((prev: any) => {
      const newState = { ...prev, [section]: !prev[section] };
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`article-editor-dropdown-${String(section)}`, newState[section].toString());
      }
      return newState;
    });
  };

  // ===== SEO ANALYSIS MOVED =====
  // SEO analysis logic đã được tách ra hook riêng: hooks/useSeoAnalysis.ts

  // Loading state removed - show content immediately

  // FIXED: Không cần skeleton nội bộ nữa vì đã có static skeleton từ Astro
  // Static skeleton sẽ được hide khi component này mount

  // Show error state for edit mode
  if (isEditMode && loadError) {
    return (
      <div className="article-editor flex items-center justify-center min-h-96">
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
    <ArticleEditorLayout>
      <MainContent>
            {/* Autosave Indicator */}
            <div className="flex justify-end mb-4">
              <AutosaveIndicator
                isAutoSaving={saveStates.isAutoSaving}
                lastSaved={lastSaved}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            </div>

            {/* Title Section - Tách thành component riêng */}
            <TitleSection
              formData={formData}
              shouldShowArticleSkeleton={shouldShowArticleSkeleton}
              showSlugEdit={showSlugEdit}
              setShowSlugEdit={setShowSlugEdit}
              slugError={slugError}
              loadingState={loadingState}
              handleTitleChange={handleTitleChange}
              handleSlugChange={handleSlugChange}
              validateSlug={validateSlug}
              setFormData={setFormData}
            />

            {/* Content Editor Section - Tách thành component riêng */}
            <ContentEditorSection
              formData={formData}
              shouldShowArticleSkeleton={shouldShowArticleSkeleton}
              setFormData={setFormData}
              TiptapEditor={TiptapEditor}
            />

            {/* Excerpt Section - Tách thành component riêng */}
            <ExcerptSection
              formData={formData}
              shouldShowArticleSkeleton={shouldShowArticleSkeleton}
              setFormData={setFormData}
            />

            {/* SEO Settings Section - Tách thành component riêng */}
            <SEOSection
              formData={formData}
              shouldShowArticleSkeleton={shouldShowArticleSkeleton}
              seoAnalysis={seoAnalysis}
              setFormData={setFormData}
              getSeoScoreColor={getSeoScoreColor}
              getSeoScoreGradient={getSeoScoreGradient}
              getSeoScoreBadge={getSeoScoreBadge}
              getSeoCheckColor={getSeoCheckColor}
            />

n 

      </MainContent>

      <Sidebar>

            {/* Publish Box */}
            <PublishBox
              formData={formData}
              setFormData={setFormData}
              saveStates={saveStates}
              lastSaved={lastSaved}
              hasUnsavedChanges={hasUnsavedChanges}
              validationError={validationError}
              handleManualSave={handleManualSave}
              loadingState={loadingState}
              shouldShowSkeleton={shouldShowArticleSkeleton}
            />

            {/* Categories Section */}
            <CategoriesSection
              formData={formData}
              setFormData={setFormData}
              loadingState={loadingState}
              shouldShowSkeleton={shouldShowCategoriesSkeleton}
            />

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
              {shouldShowTagsSkeleton ? (
                <TagsSkeleton />
              ) : (
                <TagsInput
                  value={formData.tags}
                  onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                  placeholder="Thêm tags cho bài viết..."
                  maxTags={20}
                  disabled={loadingState.isLoading}
                />
              )}
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
                <AuthorsSkeleton />
              ) : (
                <AuthorSelector
                  value={formData.author_id}
                  authors={authors}
                  onChange={(authorId) => setFormData(prev => ({ ...prev, author_id: authorId }))}
                  disabled={loadingState.isLoading}
                />
              )}
            </DropdownSection>

            {/* SEO Optimization Section */}
            <DropdownSection
              title="Tối ưu tìm kiếm"
              icon={
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              isOpen={sidebarDropdowns.seo}
              onToggle={() => toggleSidebarDropdown('seo')}
            >
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
            </DropdownSection>

            {/* Schema Type Selector Section - Tách thành component riêng */}
            <SchemaTypeSection
              formData={formData}
              shouldShowSEOSkeleton={shouldShowSEOSkeleton}
              loadingState={loadingState}
              setFormData={setFormData}
              setHasUnsavedChanges={setHasUnsavedChanges}
            />

      </Sidebar>
    </ArticleEditorLayout>
  );
}
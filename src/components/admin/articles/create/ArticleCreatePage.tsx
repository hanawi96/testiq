// Copy chính xác imports từ ArticleEditor để đảm bảo UI/UX giống hệt nhau
import React, { useState, useEffect, useCallback, Suspense, startTransition } from 'react';

// Layout components (copy từ edit)
import { ArticleEditorLayout, MainContent, Sidebar } from '../editors/layouts';

// Sections (copy từ edit)
import { TitleSection, ContentEditorSection, ExcerptSection, SEOSection } from '../editors/components/sections';

// Sidebar components (copy từ edit)
import { PublishBox } from '../editors/components/sidebar/PublishBox';
import { CategoriesSection } from '../editors/components/sidebar/CategoriesSection';

// Lazy load TiptapEditor (copy từ edit)
import { lazy } from 'react';
const TiptapEditor = lazy(() => import('../editors/TiptapEditor'));

// Đơn giản hóa interface để tránh lỗi
interface SimpleFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: string;
  featured: boolean;
  author_id: string;
  categories: string[];
  tags: string[];
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  cover_image: string;
  published_at: string;
  schema_type: string;
  internal_links: string[];
  external_links: string[];
}

const defaultFormData: SimpleFormData = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  status: 'published',
  featured: false,
  author_id: '',
  categories: [],
  tags: [],
  meta_title: '',
  meta_description: '',
  focus_keyword: '',
  cover_image: '',
  published_at: '',
  schema_type: 'Article',
  internal_links: [],
  external_links: []
};

export default function ArticleCreatePage() {
  // Dispatch event để hide static skeleton
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('article-create-mounted'));
    }
  }, []);

  // Simple form state
  const [formData, setFormData] = useState<SimpleFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data cho Progressive Loading
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [shouldShowArticleSkeleton, setShouldShowArticleSkeleton] = useState(false);
  const [shouldShowCategoriesSkeleton, setShouldShowCategoriesSkeleton] = useState(true);
  const [shouldShowAuthorsSkeleton, setShouldShowAuthorsSkeleton] = useState(true);

  // Progressive Loading simulation
  useEffect(() => {
    // Load mock data với delay để thấy skeleton
    setTimeout(() => {
      setCategories([
        { id: '1', name: 'Công nghệ', slug: 'cong-nghe' },
        { id: '2', name: 'Giáo dục', slug: 'giao-duc' }
      ]);
      setShouldShowCategoriesSkeleton(false);
    }, 500);

    setTimeout(() => {
      setAuthors([
        { id: '1', full_name: 'Nguyễn Văn A', email: 'admin@example.com', role: 'admin' }
      ]);
      setShouldShowAuthorsSkeleton(false);
    }, 800);
  }, []);

  // Simple handlers
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Mock functions để match interface của edit
  const handleTitleChange = (title: string) => handleFieldChange('title', title);
  const handleSlugChange = (slug: string) => handleFieldChange('slug', slug);
  const validateSlug = () => Promise.resolve(true);
  const getSeoScoreColor = () => 'text-gray-500';
  const getSeoScoreGradient = () => 'from-gray-400 to-gray-600';
  const getSeoScoreBadge = () => ({ className: 'bg-gray-100', text: 'Chưa phân tích' });
  const getSeoCheckColor = () => 'text-gray-400';

  // Copy chính xác JSX structure từ ArticleEditor
  return (
    <ArticleEditorLayout>
      <MainContent>
        {/* Title Section - Copy từ edit */}
        <TitleSection
          formData={formData}
          shouldShowArticleSkeleton={shouldShowArticleSkeleton}
          showSlugEdit={false}
          setShowSlugEdit={() => {}}
          slugError=""
          loadingState={{}}
          handleTitleChange={handleTitleChange}
          handleSlugChange={handleSlugChange}
          validateSlug={validateSlug}
          setFormData={setFormData}
        />

        {/* Content Editor Section - Copy từ edit */}
        <ContentEditorSection
          formData={formData}
          shouldShowArticleSkeleton={shouldShowArticleSkeleton}
          setFormData={setFormData}
          TiptapEditor={TiptapEditor}
        />

        {/* Excerpt Section - Copy từ edit */}
        <ExcerptSection
          formData={formData}
          shouldShowArticleSkeleton={shouldShowArticleSkeleton}
          setFormData={setFormData}
        />

        {/* SEO Settings Section - Copy từ edit */}
        <SEOSection
          formData={formData}
          shouldShowArticleSkeleton={shouldShowArticleSkeleton}
          seoAnalysis={{
            score: 0,
            checks: [], // Fix: Thêm empty array để tránh lỗi map
            suggestions: []
          }}
          setFormData={setFormData}
          getSeoScoreColor={getSeoScoreColor}
          getSeoScoreGradient={getSeoScoreGradient}
          getSeoScoreBadge={getSeoScoreBadge}
          getSeoCheckColor={getSeoCheckColor}
        />
      </MainContent>

      <Sidebar>
        {/* Publish Box - Copy từ edit với any type để tránh lỗi */}
        <PublishBox
          formData={formData as any}
          setFormData={setFormData as any}
          saveStates={{
            isSaving: isSubmitting,
            isAutoSaving: false,
            isManualSaving: false,
            saveProgress: 0
          }}
          lastSaved={null}
          hasUnsavedChanges={false}
          hasChangesFromOriginal={false}
          hasDraftInDatabase={false}
          validationError=""
          handleManualSave={() => {}}
          handleManualSaveWithData={() => {}}
          loadingState={{
            isLoading: false,
            isDataLoaded: true,
            isValidatingSlug: false,
            isEditorReady: true,
            isLoadingArticleData: false,
            isLoadingCategories: false,
            isLoadingAuthors: false,
            isLoadingTags: false
          }}
          shouldShowSkeleton={shouldShowArticleSkeleton}
          isEditMode={false}
          formHandlers={{
            handlePublishedDateChange: (date: string) => handleFieldChange('published_at', date)
          }}
          onRevertToOriginal={() => {}}
        />

        {/* Categories Section - Copy từ edit với any type để tránh lỗi */}
        <CategoriesSection
          formData={formData as any}
          setFormData={setFormData as any}
          categories={categories}
          loadingState={{
            isLoading: false,
            isDataLoaded: true,
            isValidatingSlug: false,
            isEditorReady: true,
            isLoadingArticleData: false,
            isLoadingCategories: shouldShowCategoriesSkeleton,
            isLoadingAuthors: false,
            isLoadingTags: false
          }}
          shouldShowSkeleton={shouldShowCategoriesSkeleton}
        />
      </Sidebar>
    </ArticleEditorLayout>
  );
}

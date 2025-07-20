import { useState, useEffect, startTransition } from 'react';
import { ArticlesService, AuthService } from '../../../../../../backend';
import type { Category, AuthorOption } from '../../../../../../backend';
import { 
  getInstantCategoriesData, 
  preloadCategoriesData, 
  isCategoriesDataReady 
} from '../../../../../utils/admin/preloaders/categories-preloader';
import { 
  getInstantAuthorsData, 
  preloadAuthorsData, 
  isAuthorsDataReady 
} from '../../../../../utils/admin/preloaders/authors-preloader';
import { FALLBACK_AUTHORS } from '../articleEditorUtils';
import { createLoadingActions, createInitialLoadingState } from '../components/LoadingStates';

interface UseArticleDataProps {
  currentArticleId: string | null;
  isEditMode: boolean;
  setFormData: (data: any) => void;
  setOriginalContent: (content: string) => void;
  setCurrentUserId: (id: string | null) => void;
  setLoadError: (error: string) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setInitialFormData: (data: any) => void;
  formData: any;
}

export const useArticleData = ({
  currentArticleId,
  isEditMode,
  setFormData,
  setOriginalContent,
  setCurrentUserId,
  setLoadError,
  setHasUnsavedChanges,
  setInitialFormData,
  formData
}: UseArticleDataProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [loadingState, setLoadingState] = useState(() =>
    createInitialLoadingState(isEditMode)
  );

  const loadingActions = createLoadingActions(setLoadingState);

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

      // Load current user first
      let userId: string | undefined;
      try {
        const { user } = await AuthService.getCurrentUser();
        if (user?.id) {
          setCurrentUserId(user.id);
          userId = user.id;
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      }

      // Start preloading immediately (non-blocking)
      preloadCategoriesData();
      preloadAuthorsData();

      try {
        if (currentArticleId) {
          // EDIT MODE: Load article + preloaded data
          const [articleResult, categoriesData, authorsData] = await Promise.all([
            ArticlesService.getArticleForEdit(currentArticleId, userId),
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
            // DEBUG: Log article data để kiểm tra tags
            console.log(`🔍 DEBUG: Article data received:`, {
              tag_names: articleResult.data.tag_names,
              tags: articleResult.data.tags,
              title: articleResult.data.title
            });

            // Populate form with article data
            const articleContent = articleResult.data.content || '';
            const formData = {
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
                  return [...articleResult.data.category_ids];
                }
                if (articleResult.data.category_id) {
                  return [articleResult.data.category_id];
                }
                if (articleResult.data.categories) {
                  return articleResult.data.categories.map((cat: any) => typeof cat === 'string' ? cat : cat.id);
                }
                return [];
              })(),
              tags: (() => {
                const tags = articleResult.data.tag_names ? [...articleResult.data.tag_names] :
                            articleResult.data.tags?.map((tag: any) => typeof tag === 'string' ? tag : tag.name) || [];
                console.log(`🔍 DEBUG: Processed tags for FormData:`, tags);
                return tags;
              })(),
              cover_image: articleResult.data.cover_image || '',
              cover_image_alt: articleResult.data.cover_image_alt || '',
              lang: articleResult.data.lang || 'vi',
              article_type: articleResult.data.article_type || 'article',
              is_public: articleResult.data.status === 'published',
              is_featured: articleResult.data.featured === true,
              schema_type: articleResult.data.schema_type || 'Article',
              robots_noindex: articleResult.data.robots_directive?.includes('noindex') || false,
              published_date: articleResult.data.published_at || '', // Read-only display
              scheduled_at: (articleResult.data as any).scheduled_at ? new Date((articleResult.data as any).scheduled_at).toISOString().slice(0, 16) : '',
              author_id: articleResult.data.author_id || ''
            };

            setFormData(formData);
            console.log(`🔍 DEBUG: FormData set with tags:`, formData.tags);

            // Store original content for image cleanup
            setOriginalContent(articleContent);

            // Mark article data as loaded
            loadingActions.setArticleDataLoaded();

            // Add a small delay for tags loading to ensure user sees the skeleton
            setTimeout(() => {
              loadingActions.setTagsLoaded();
            }, 800); // 800ms delay to show tags skeleton

            // Reset unsaved changes after loading article data
            setHasUnsavedChanges(false);
            setInitialFormData(formData);
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
            loadingActions.setCreateModeDataLoaded();

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

  return {
    categories,
    authors,
    loadingState,
    loadingActions
  };
};

/**
 * FORM HANDLERS HOOK
 * Tách các form handlers để dễ quản lý
 */

import { useState, useCallback } from 'react';
import { generateSlug } from '../../../../../utils/slug-generator';
import { processBulkTags, createTagFeedbackMessage, lowercaseNormalizeTag } from '../../../../../utils/tag-processing';
import { ArticlesService } from '../../../../../../backend';

// Form data type
export interface FormData {
  title: string;
  content: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  slug: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  focus_keyword: string;
  categories: string[];
  tags: string[];
  cover_image: string;
  cover_image_alt: string;
  lang: string;
  article_type: 'article' | 'page' | 'post';
  is_public: boolean;
  is_featured: boolean;
  schema_type: string;
  robots_noindex: boolean;
  published_date: string;
  scheduled_at: string;
  author_id: string;
}

// Hook props
interface UseFormHandlersProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  setSlugError: React.Dispatch<React.SetStateAction<string>>;
  validateSlug: (slug: string) => Promise<void>;
  isEditMode: boolean;
  currentArticleId: string | null;
}

export const useFormHandlers = ({
  formData,
  setFormData,
  setHasUnsavedChanges,
  setSlugError,
  validateSlug,
  isEditMode,
  currentArticleId
}: UseFormHandlersProps) => {

  // Handle title change with auto-slug generation
  const handleTitleChange = useCallback((title: string) => {
    setFormData(prev => ({ ...prev, title }));
    setHasUnsavedChanges(true);

    // Auto-generate slug only for new articles or when slug is empty
    if (!isEditMode || !prev.slug) {
      const newSlug = generateSlug(title);
      setFormData(prev => ({ ...prev, slug: newSlug }));
      
      // Validate the new slug
      if (newSlug) {
        validateSlug(newSlug);
      }
    }
  }, [setFormData, setHasUnsavedChanges, isEditMode, validateSlug]);

  // Handle content change
  const handleContentChange = useCallback((content: string) => {
    setFormData(prev => ({ ...prev, content }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle excerpt change
  const handleExcerptChange = useCallback((excerpt: string) => {
    setFormData(prev => ({ ...prev, excerpt }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle manual slug change with smart filtering
  const handleSlugChange = useCallback((slug: string) => {
    // Smart slug filtering: allow letters, numbers, hyphens
    const filteredSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    setFormData(prev => ({ ...prev, slug: filteredSlug }));
    setHasUnsavedChanges(true);
    setSlugError('');

    // Validate slug after a delay
    if (filteredSlug) {
      setTimeout(() => validateSlug(filteredSlug), 500);
    }
  }, [setFormData, setHasUnsavedChanges, setSlugError, validateSlug]);

  // Generate new slug from title
  const handleGenerateSlug = useCallback(() => {
    const newSlug = generateSlug(formData.title);
    setFormData(prev => ({ ...prev, slug: newSlug }));
    setHasUnsavedChanges(true);
    setSlugError('');

    if (newSlug) {
      validateSlug(newSlug);
    }
  }, [formData.title, setFormData, setHasUnsavedChanges, setSlugError, validateSlug]);

  // Handle meta title change
  const handleMetaTitleChange = useCallback((meta_title: string) => {
    setFormData(prev => ({ ...prev, meta_title }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle meta description change
  const handleMetaDescriptionChange = useCallback((meta_description: string) => {
    setFormData(prev => ({ ...prev, meta_description }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle focus keyword change
  const handleFocusKeywordChange = useCallback((focus_keyword: string) => {
    setFormData(prev => ({ ...prev, focus_keyword }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle categories change
  const handleCategoriesChange = useCallback((categories: string[]) => {
    setFormData(prev => ({ ...prev, categories }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle tags change
  const handleTagsChange = useCallback((tags: string[]) => {
    setFormData(prev => ({ ...prev, tags }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle cover image change
  const handleCoverImageChange = useCallback((url: string, alt?: string) => {
    setFormData(prev => ({
      ...prev,
      cover_image: url,
      cover_image_alt: alt !== undefined ? alt : (prev.title || 'Ảnh đại diện bài viết')
    }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle cover image removal
  const handleCoverImageRemove = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      cover_image: '',
      cover_image_alt: ''
    }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle author change
  const handleAuthorChange = useCallback((author_id: string) => {
    setFormData(prev => ({ ...prev, author_id }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle status change
  const handleStatusChange = useCallback((status: FormData['status']) => {
    setFormData(prev => ({ ...prev, status }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle public toggle
  const handlePublicToggle = useCallback(() => {
    setFormData(prev => ({ ...prev, is_public: !prev.is_public }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle featured toggle
  const handleFeaturedToggle = useCallback(() => {
    setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle robots noindex toggle
  const handleRobotsToggle = useCallback(() => {
    setFormData(prev => ({ ...prev, robots_noindex: !prev.robots_noindex }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle schema type change
  const handleSchemaTypeChange = useCallback((schema_type: string) => {
    setFormData(prev => ({ ...prev, schema_type }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  // Handle scheduled date change
  const handleScheduledDateChange = useCallback((scheduled_at: string) => {
    setFormData(prev => ({ ...prev, scheduled_at }));
    setHasUnsavedChanges(true);
  }, [setFormData, setHasUnsavedChanges]);

  return {
    handleTitleChange,
    handleContentChange,
    handleExcerptChange,
    handleSlugChange,
    handleGenerateSlug,
    handleMetaTitleChange,
    handleMetaDescriptionChange,
    handleFocusKeywordChange,
    handleCategoriesChange,
    handleTagsChange,
    handleCoverImageChange,
    handleCoverImageRemove,
    handleAuthorChange,
    handleStatusChange,
    handlePublicToggle,
    handleFeaturedToggle,
    handleRobotsToggle,
    handleSchemaTypeChange,
    handleScheduledDateChange
  };
};

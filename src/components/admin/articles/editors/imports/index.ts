// ===== EXTERNAL IMPORTS =====
import React, { lazy } from 'react';
export { useState, useEffect, Suspense, startTransition } from 'react';
export { React };

// ===== BACKEND IMPORTS =====
export { ArticlesService } from '../../../../../../backend';
export type { Category, CreateArticleData, AuthorOption, Article } from '../../../../../../backend';

// ===== UTILS IMPORTS =====
export { generateSlug } from '../../../../../utils/slug-generator';
export { processBulkTags, createTagFeedbackMessage, lowercaseNormalizeTag } from '../../../../../utils/tag-processing';

// ===== COMMON COMPONENTS =====
export { default as LoadingSpinner } from '../../../common/LoadingSpinner';

// ===== CREATE COMPONENTS =====
export { default as MediaUpload } from '../../create/components/MediaUpload';
export { default as TagsInput } from '../../create/components/TagsInput';
export { default as AuthorSelector } from '../../create/components/AuthorSelector';
export { default as CategorySelector } from '../../create/components/CategorySelector';
export { default as DateTimePicker } from '../../create/components/DateTimePicker';

// ===== SERVICES =====
export { BlogService } from '../../../../../services/blog-service';

// ===== OTHER COMPONENTS =====
export { default as SchemaPreview } from '../../SchemaPreview';

// ===== STYLES =====
import '../../../../../styles/article-editor.css';
import '../../../../../styles/tiptap-editor.css';

// ===== UTILS & CONSTANTS =====
export {
  FALLBACK_AUTHORS,
  type ArticleEditorProps
} from '../articleEditorUtils';

export {
  DEFAULT_FORM_DATA,
  DEFAULT_SIDEBAR_DROPDOWNS,
  INITIAL_LOADING_STATE
} from '../constants/articleEditorConstants';

export {
  getArticleId,
  getSidebarDropdownState,
  saveDropdownState,
  formatDate,
  hasFormChanges,
  validateFormData,
  cleanFormData,
  extractImagesFromContent,
  calculateSaveProgress
} from '../utils/articleEditorHelpers';

// ===== UI COMPONENTS =====
export { DropdownSection } from '../components/DropdownSection';

// ===== SIDEBAR COMPONENTS =====
export { PublishBox } from '../components/sidebar/PublishBox';
export { CategoriesSection } from '../components/sidebar/CategoriesSection';

// ===== SECTIONS =====
export { TitleSection, ContentEditorSection, ExcerptSection, SEOSection, SchemaTypeSection } from '../components/sections';

// ===== SKELETON COMPONENTS =====
export {
  EditorSkeleton,
  ExcerptSkeleton,
  SidebarSkeleton,
  CategoriesSkeleton,
  TagsSkeleton,
  AuthorsSkeleton
} from '../components/SkeletonComponents';

// ===== LOADING COMPONENTS =====
export {
  useLoadingHelpers
} from '../components/LoadingStates';

// ===== HOOKS =====
export { useArticleData } from '../hooks/useArticleData';
export { useFormHandlers, type FormData } from '../hooks/useFormHandlers';
export {
  useSeoAnalysis,
  getSeoScoreColor,
  getSeoScoreGradient,
  getSeoScoreBadge,
  getSeoCheckColor
} from '../hooks/useSeoAnalysis';
export { useSaveHandlers } from '../hooks/useSaveHandlers';

// ===== LAZY COMPONENTS =====
const TiptapEditorComponent = lazy(() => import('../TiptapEditor'));
export { TiptapEditorComponent as TiptapEditor };

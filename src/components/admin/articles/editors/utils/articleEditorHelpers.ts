/**
 * ARTICLE EDITOR HELPER FUNCTIONS
 * Tách các utility functions an toàn - không có side effects
 */

/**
 * Get article ID from props or URL params
 */
export const getArticleId = (articleId?: string | null): string | null => {
  if (articleId) return articleId;
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }
  return null;
};

/**
 * Get draft ID from URL params
 */
export const getDraftId = (): string | null => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('draft_id');
  }
  return null;
};

/**
 * Check if current mode is editing a draft
 */
export const isDraftMode = (): boolean => {
  return !!getDraftId();
};

/**
 * Get sidebar dropdown state from localStorage or window cache
 */
export const getSidebarDropdownState = (defaultState: Record<string, boolean>) => {
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
  
  return defaultState;
};

/**
 * Save dropdown state to localStorage
 */
export const saveDropdownState = (key: string, isOpen: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`article-editor-dropdown-${key}`, String(isOpen));
  }
};

/**
 * Format date for display
 */
export const formatDate = (date: Date | string | null): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Check if form has unsaved changes
 */
export const hasFormChanges = (
  currentData: any,
  initialData: any,
  excludeFields: string[] = []
): boolean => {
  const fieldsToCheck = Object.keys(currentData).filter(
    key => !excludeFields.includes(key)
  );
  
  return fieldsToCheck.some(key => {
    const current = currentData[key];
    const initial = initialData[key];
    
    // Handle arrays
    if (Array.isArray(current) && Array.isArray(initial)) {
      return JSON.stringify(current) !== JSON.stringify(initial);
    }
    
    // Handle other types
    return current !== initial;
  });
};

/**
 * Validate form data
 */
export const validateFormData = (formData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields
  if (!formData.title?.trim()) {
    errors.push('Tiêu đề không được để trống');
  }
  
  if (!formData.content?.trim()) {
    errors.push('Nội dung không được để trống');
  }
  
  // Length validations
  if (formData.title && formData.title.length > 200) {
    errors.push('Tiêu đề không được vượt quá 200 ký tự');
  }
  
  if (formData.meta_title && formData.meta_title.length > 60) {
    errors.push('Meta title không được vượt quá 60 ký tự');
  }
  
  if (formData.meta_description && formData.meta_description.length > 160) {
    errors.push('Meta description không được vượt quá 160 ký tự');
  }
  
  if (formData.excerpt && formData.excerpt.length > 500) {
    errors.push('Tóm tắt không được vượt quá 500 ký tự');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Clean form data before saving
 */
export const cleanFormData = (formData: any) => {
  return {
    ...formData,
    title: formData.title?.trim() || '',
    content: formData.content?.trim() || '',
    excerpt: formData.excerpt?.trim() || '',
    meta_title: formData.meta_title?.trim() || '',
    meta_description: formData.meta_description?.trim() || '',
    slug: formData.slug?.trim() || '',
    focus_keyword: formData.focus_keyword?.trim() || '',
    cover_image: formData.cover_image?.trim() || '',
    cover_image_alt: formData.cover_image_alt?.trim() || '',
    // Include published_date for SEO date editing
    published_date: formData.published_date || null
  };
};

/**
 * Extract images from content for cleanup
 */
export const extractImagesFromContent = (content: string): string[] => {
  const imageRegex = /<img[^>]+src="([^"]+)"/g;
  const images: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }
  
  return images;
};

/**
 * Generate save progress percentage
 */
export const calculateSaveProgress = (step: number, totalSteps: number = 5): number => {
  return Math.min(Math.round((step / totalSteps) * 100), 100);
};

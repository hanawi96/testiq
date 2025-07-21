/**
 * ARTICLE EDITOR CONSTANTS
 * Tách constants an toàn - không gây lỗi
 */

// DEFAULT FORM DATA
export const DEFAULT_FORM_DATA = {
  title: '',
  content: '',
  excerpt: '',
  meta_title: '',
  meta_description: '',
  slug: '',
  status: 'draft' as 'draft' | 'published' | 'archived' | 'scheduled',
  focus_keyword: '',
  categories: [] as string[],
  tags: [] as string[],
  cover_image: '',
  cover_image_alt: '',
  lang: 'vi',
  article_type: 'article' as 'article' | 'page' | 'post',

  is_featured: false,
  schema_type: 'Article',
  robots_noindex: false,
  scheduled_at: '', // Hẹn ngày giờ đăng bài
  author_id: ''
};

// DEFAULT SIDEBAR DROPDOWNS STATE
export const DEFAULT_SIDEBAR_DROPDOWNS = {
  categories: true,
  tags: true,
  author: true,
  featuredImage: true,
  seo: true,
  seoIndex: true
};

// INITIAL LOADING STATE
export const INITIAL_LOADING_STATE = {
  isLoading: false, // UI tĩnh hiển thị ngay
  isDataLoaded: false, // Will be set based on edit/create mode
  isValidatingSlug: false,
  isEditorReady: false,
  // Separate loading states for different sections
  isLoadingArticleData: false, // Will be set based on edit mode
  isLoadingCategories: false,
  isLoadingAuthors: false,
  isLoadingTags: false
};

// VALIDATION CONSTANTS
export const VALIDATION_RULES = {
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 200,
  EXCERPT_MAX_LENGTH: 500,
  META_TITLE_MAX_LENGTH: 60,
  META_DESCRIPTION_MAX_LENGTH: 160,
  SLUG_MAX_LENGTH: 100,
  FOCUS_KEYWORD_MAX_LENGTH: 50
};

// UI CONSTANTS
export const UI_CONSTANTS = {
  AUTOSAVE_DELAY: 3000, // 3 seconds
  SLUG_VALIDATION_DELAY: 500, // 0.5 seconds
  DROPDOWN_ANIMATION_DURATION: 300, // ms
  SAVE_PROGRESS_STEPS: 5
};

// ERROR MESSAGES
export const ERROR_MESSAGES = {
  LOAD_FAILED: 'Không thể tải dữ liệu bài viết',
  SAVE_FAILED: 'Không thể lưu bài viết',
  VALIDATION_FAILED: 'Dữ liệu không hợp lệ',
  SLUG_DUPLICATE: 'Slug này đã tồn tại',
  NETWORK_ERROR: 'Lỗi kết nối mạng',
  PERMISSION_DENIED: 'Không có quyền thực hiện thao tác này'
};

// SUCCESS MESSAGES
export const SUCCESS_MESSAGES = {
  SAVED: 'Đã lưu bài viết',
  PUBLISHED: 'Đã xuất bản bài viết',
  DRAFT_SAVED: 'Đã lưu bản nháp',
  AUTO_SAVED: 'Tự động lưu thành công'
};

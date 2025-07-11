/**
 * Articles Module - Type Definitions (OPTIMIZED)
 * Tất cả interfaces và types cho articles module
 *
 * TYPES OPTIMIZATION:
 * ✅ Base interfaces with composition
 * ✅ Eliminated duplicate field definitions
 * ✅ Consistent type definitions
 * ✅ Simplified nested structures
 */

// ===== ENUMS & CONSTANTS =====
export type ArticleStatus = 'published' | 'draft' | 'archived';
export type ArticleType = 'article' | 'page' | 'post';
export type SortField = 'created_at' | 'updated_at' | 'views' | 'title';
export type SortOrder = 'asc' | 'desc';
export type SchemaType = 'Article' | 'BlogPosting' | 'NewsArticle' | 'WebPage';

// ===== SHARED INTERFACES =====
export interface BaseEntity {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  avatar_url?: string;
}

// ===== SEO & METADATA INTERFACES =====
export interface SEOFields {
  meta_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  keywords?: string[];
  canonical_url?: string;
}

export interface OpenGraphFields {
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
}

export interface TwitterFields {
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_card_type?: string;
}

export interface MediaFields {
  cover_image?: string;
  cover_image_alt?: string;
  gallery_images?: Record<string, unknown>;
}

export interface SchemaFields {
  schema_type?: SchemaType;
  author_schema?: Record<string, unknown>;
  organization_schema?: Record<string, unknown>;
  faq_schema?: Record<string, unknown>;
  howto_schema?: Record<string, unknown>;
  breadcrumb_schema?: Record<string, unknown>;
}

export interface SEOSettings {
  robots_directive?: string;
  sitemap_include?: boolean;
  sitemap_priority?: number;
  sitemap_changefreq?: string;
}

// ===== CORE ARTICLE INTERFACES =====
export interface BaseArticle extends SEOFields, OpenGraphFields, TwitterFields, MediaFields, SchemaFields, SEOSettings {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  lang?: string;
  article_type?: ArticleType;
  status: ArticleStatus;
  featured?: boolean;
  author_id?: string;
  category_id?: string;
  parent_id?: string;
}

export interface ContentAnalysis {
  word_count?: number;
  character_count?: number;
  reading_time?: number;
  paragraph_count?: number;
  heading_count?: Record<string, number>;
  content_score?: number;
  readability_score?: number;
  keyword_density?: number;
}

export interface ArticleAnalytics {
  view_count?: number;
  unique_views?: number;
  like_count?: number;
  bounce_rate?: number;
  avg_time_on_page?: number;
  social_shares?: Record<string, number>;
  backlinks_count?: number;
}

export interface ArticleTimestamps {
  created_at: string;
  updated_at: string;
  published_at?: string;
  scheduled_at?: string;
  expires_at?: string;
}

export interface ArticleVersioning {
  version?: number;
  revision_notes?: string;
  slug_history?: string[];
}

export interface ArticleRelations {
  // From database joins
  user_profiles?: UserProfile;
  categories?: BaseEntity[];
  tags?: BaseEntity[];

  // Computed fields for backward compatibility
  author?: string;
  category?: string;
  tag_names?: string[];
  category_names?: string[];
  category_ids?: string[];
  related_articles?: string[];

  // Link analysis
  internal_links?: LinkInfo[];
  external_links?: LinkInfo[];
}

// ===== MAIN ARTICLE INTERFACE =====
export interface Article extends
  BaseArticle,
  ContentAnalysis,
  ArticleAnalytics,
  ArticleTimestamps,
  ArticleVersioning,
  ArticleRelations {}

// ===== UTILITY INTERFACES =====
export interface LinkInfo {
  url: string;
  text: string;
  title?: string;
  domain?: string;
}

export interface ArticleStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  totalViews: number;
  avgReadingTime: number;
  recentArticles: number;
}

export interface ArticlesFilters {
  search?: string;
  status?: ArticleStatus | 'all';
  author?: string;
  tag?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: SortField;
  sort_order?: SortOrder;
}

export interface ArticlesListResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ===== CREATE/UPDATE INTERFACES =====
export interface CreateArticleData extends
  Partial<SEOFields>,
  Partial<OpenGraphFields>,
  Partial<TwitterFields>,
  Partial<MediaFields>,
  Partial<SchemaFields>,
  Partial<SEOSettings> {

  // Required fields
  title: string;
  content: string;

  // Optional core fields
  slug?: string;
  excerpt?: string;
  lang?: string;
  article_type?: ArticleType;
  status?: ArticleStatus;
  featured?: boolean;
  author_id?: string;
  category_id?: string;
  parent_id?: string;

  // Relations (handled separately)
  categories?: string[];
  tags?: string[];
  related_articles?: string[];

  // Publishing
  published_at?: string;
  scheduled_at?: string;
  expires_at?: string;
  revision_notes?: string;
}

// Utility types for different operations
export type UpdateArticleData = Partial<CreateArticleData>;
export type ArticleFormData = Pick<CreateArticleData, 'title' | 'content' | 'excerpt' | 'status' | 'featured'> &
  Partial<SEOFields>;
export type ArticlePreview = Pick<Article, 'id' | 'title' | 'slug' | 'excerpt' | 'status' | 'created_at' | 'author'>;

// ===== ANALYSIS & INTERNAL TYPES =====
export interface LinkAnalysis {
  internal_links: LinkInfo[];
  external_links: LinkInfo[];
  total_links: number;
  internal_count: number;
  external_count: number;
}

export interface RelatedData {
  categories: Array<{
    article_id: string;
    categories: BaseEntity;
  }>;
  tags: Array<{
    article_id: string;
    tags: BaseEntity;
  }>;
  profiles: UserProfile[];
}

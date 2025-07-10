/**
 * Articles Module - Type Definitions
 * Tất cả interfaces và types cho articles module
 */

export interface Article {
  id: string;
  title: string;
  slug: string;
  slug_history?: string[];
  content: string;
  excerpt?: string;
  lang?: string;
  article_type?: 'article' | 'page' | 'post';
  status: 'published' | 'draft' | 'archived';
  featured?: boolean;
  author_id?: string;
  category_id?: string;
  parent_id?: string;

  // Author profile information from join
  user_profiles?: {
    id: string;
    full_name: string;
    email?: string;
    role: string;
  };

  // SEO fields
  meta_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  keywords?: string[];
  canonical_url?: string;

  // Open Graph fields
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;

  // Twitter fields
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_card_type?: string;

  // Media fields
  cover_image?: string;
  cover_image_alt?: string;
  gallery_images?: any;

  // Schema fields
  schema_type?: string;
  author_schema?: any;
  organization_schema?: any;
  faq_schema?: any;
  howto_schema?: any;
  breadcrumb_schema?: any;

  // Content analysis
  word_count?: number;
  character_count?: number;
  reading_time?: number; // in minutes
  paragraph_count?: number;
  heading_count?: any;
  content_score?: number;
  readability_score?: number;
  keyword_density?: number;

  // SEO settings
  robots_directive?: string;
  sitemap_include?: boolean;
  sitemap_priority?: number;
  sitemap_changefreq?: string;

  // Links and relations
  internal_links?: any;
  external_links?: any;
  related_articles?: string[];

  // Analytics
  view_count?: number;
  unique_views?: number;
  like_count?: number;
  bounce_rate?: number;
  avg_time_on_page?: number;
  social_shares?: any;
  backlinks_count?: number;

  // Search
  search_index?: any;
  indexed_at?: string;
  last_crawled_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  scheduled_at?: string;
  expires_at?: string;

  // Versioning
  version?: number;
  revision_notes?: string;

  // Categories and tags (from joins)
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
  }>;
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
  }>;

  // Additional computed fields
  author?: string;
  category?: string;
  tag_names?: string[];
  category_names?: string[];
  category_ids?: string[];
}

export interface ArticleStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  totalViews: number;
  avgReadingTime: number;
  recentArticles: number; // articles in last 7 days
}

export interface ArticlesFilters {
  search?: string;
  status?: 'published' | 'draft' | 'archived' | 'all';
  author?: string;
  tag?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'updated_at' | 'views' | 'title';
  sort_order?: 'asc' | 'desc';
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

export interface CreateArticleData {
  // Required fields
  title: string;
  content: string;
  slug?: string; // Auto-generated if not provided

  // Basic article info
  excerpt?: string;
  lang?: string;
  article_type?: 'article' | 'page' | 'post';
  status?: 'published' | 'draft' | 'archived';
  featured?: boolean;
  author_id?: string;
  category_id?: string; // Primary category
  parent_id?: string;

  // SEO fields
  meta_title?: string;
  meta_description?: string;
  focus_keyword?: string;
  keywords?: string[];
  canonical_url?: string;

  // Open Graph fields
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;

  // Twitter fields
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_card_type?: string;

  // Media fields
  cover_image?: string;
  cover_image_alt?: string;
  gallery_images?: any;

  // Schema fields
  schema_type?: string;
  author_schema?: any;
  organization_schema?: any;
  faq_schema?: any;
  howto_schema?: any;
  breadcrumb_schema?: any;

  // SEO settings
  robots_directive?: string;
  sitemap_include?: boolean;
  sitemap_priority?: number;
  sitemap_changefreq?: string;

  // Relations (will be handled separately)
  categories?: string[]; // Array of category IDs
  tags?: string[]; // Array of tag IDs or names
  related_articles?: string[];

  // Publishing
  published_at?: string;
  scheduled_at?: string;
  expires_at?: string;

  // Versioning
  revision_notes?: string;
}

// Additional types for internal use
export interface LinkAnalysis {
  internal_links: Array<{
    url: string;
    text: string;
    title?: string;
  }>;
  external_links: Array<{
    url: string;
    text: string;
    domain: string;
  }>;
  total_links: number;
  internal_count: number;
  external_count: number;
}

export interface RelatedData {
  categories: Array<{
    article_id: string;
    categories: {
      id: string;
      name: string;
      slug: string;
      description?: string;
    };
  }>;
  tags: Array<{
    article_id: string;
    tags: {
      id: string;
      name: string;
      slug: string;
      description?: string;
    };
  }>;
  profiles: Array<{
    id: string;
    full_name: string;
    email?: string;
    avatar_url?: string;
  }>;
}

/**
 * Articles Module - Data Processing Logic
 * Chứa tất cả logic xử lý và chuẩn bị dữ liệu cho articles module
 */

import { generateSlug } from '../../../src/utils/slug-generator';
import { ArticleQueries } from './queries';
import type { CreateArticleData, LinkAnalysis } from './types';

export class ProcessingUtils {
  // ===== CACHED UTILITIES =====

  private static _cachedBaseDomain: string | null = null;
  private static readonly LINK_REGEX = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;

  /**
   * OPTIMIZED: Cached base domain detection
   */
  static getBaseDomain(): string {
    if (!this._cachedBaseDomain) {
      this._cachedBaseDomain = this.detectBaseDomain();
    }
    return this._cachedBaseDomain;
  }

  /**
   * EXTRACTED: Environment detection logic
   */
  private static detectBaseDomain(): string {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }

    // Check if we're in Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      return process.env.SITE_URL || 'localhost:4321';
    }

    // Fallback
    return 'localhost:4321';
  }

  /**
   * OPTIMIZED: Generate unique slug with collision handling
   * Combines slug generation and uniqueness check
   */
  static async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    let baseSlug = generateSlug(title);
    let finalSlug = baseSlug;
    let counter = 1;

    // Check for slug conflicts and resolve them
    while (true) {
      const { exists } = await ArticleQueries.checkSlugExists(finalSlug, excludeId);
      if (!exists) {
        break;
      }
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }

  /**
   * REFACTORED: Fast link analysis with cached regex
   */
  static analyzeContentLinks(content: string, baseDomain: string): LinkAnalysis {
    const internal_links: any[] = [];
    const external_links: any[] = [];
    let match;

    // Reset regex lastIndex for reuse
    this.LINK_REGEX.lastIndex = 0;

    // Single pass processing with pre-compiled regex
    while ((match = this.LINK_REGEX.exec(content)) !== null) {
      const url = match[1];
      const isInternal = url.includes(baseDomain) || url.startsWith('/');

      if (isInternal) {
        internal_links.push({ url, text: '' });
      } else {
        try {
          external_links.push({
            url,
            text: '',
            domain: new URL(url).hostname
          });
        } catch {
          // Skip invalid URLs
        }
      }
    }

    const internal_count = internal_links.length;
    const external_count = external_links.length;

    return {
      internal_links,
      external_links,
      total_links: internal_count + external_count,
      internal_count,
      external_count,
      total_internal: internal_count,
      total_external: external_count
    };
  }

  /**
   * OPTIMIZED: Calculate both word count and reading time in single pass
   */
  static calculateContentMetrics(content: string): { wordCount: number; readingTime: number } {
    const wordCount = content.split(/\s+/).length;
    return {
      wordCount,
      readingTime: Math.ceil(wordCount / 200) // 200 words per minute
    };
  }

  /**
   * EXTRACTED: Process content data (metrics + links) in single operation
   */
  private static processContentData(content: string) {
    const metrics = this.calculateContentMetrics(content);
    const linkAnalysis = this.analyzeContentLinks(content, this.getBaseDomain());

    return {
      word_count: metrics.wordCount,
      reading_time: metrics.readingTime,
      internal_links: linkAnalysis.internal_links,
      external_links: linkAnalysis.external_links
    };
  }



  /**
   * REFACTORED: Process article data - Compact & Efficient
   */
  static async processArticleData(articleData: CreateArticleData, authorId: string) {
    // Pre-process strings
    const trimmedTitle = articleData.title.trim();
    const trimmedContent = articleData.content.trim();

    // Generate unique slug
    const slug = articleData.slug?.trim() || await this.generateUniqueSlug(trimmedTitle);

    // Process content data (metrics + links) in single operation
    const contentData = this.processContentData(trimmedContent);

    // Build processed data
    const processedData = {
      title: trimmedTitle,
      slug,
      content: trimmedContent,
      excerpt: articleData.excerpt?.trim() || null,
      lang: articleData.lang || 'vi',
      article_type: articleData.article_type || 'article',
      status: articleData.status || 'draft',
      featured: articleData.featured === true,
      author_id: authorId,
      category_id: articleData.category_id || null,

      // Content metrics & links
      ...contentData,

      // SEO fields
      meta_title: articleData.meta_title || null,
      meta_description: articleData.meta_description || null,
      focus_keyword: articleData.focus_keyword || null,
      keywords: articleData.keywords || null,
      canonical_url: articleData.canonical_url || null,

      // Open Graph fields
      og_title: articleData.og_title || null,
      og_description: articleData.og_description || null,
      og_image: articleData.og_image || null,
      og_type: articleData.og_type || 'article',

      // Media fields
      cover_image: articleData.cover_image?.trim() || null,
      cover_image_alt: articleData.cover_image_alt?.trim() || null,

      // Schema fields
      schema_type: articleData.schema_type || 'Article',

      // SEO settings
      robots_directive: articleData.robots_directive || 'index,follow',

      // Publishing
      published_at: articleData.status === 'published' ? new Date().toISOString() : null,
      scheduled_at: articleData.scheduled_at || null,

      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return { processedData, slug };
  }

  /**
   * REFACTORED: Process update data - Compact & Efficient
   */
  static async processUpdateData(
    updateData: Partial<CreateArticleData> & { updated_at?: string },
    articleId?: string
  ): Promise<any> {
    // Loại bỏ các trường không còn tồn tại trong bảng articles
    const {
      twitter_title, twitter_description, twitter_image, twitter_card_type,
      author_schema, organization_schema, faq_schema, howto_schema, breadcrumb_schema,
      sitemap_include, sitemap_priority, sitemap_changefreq,
      expires_at, revision_notes, gallery_images,
      ...validUpdateData
    } = updateData;

    const processedUpdateData: any = {
      ...validUpdateData,
      updated_at: validUpdateData.updated_at || new Date().toISOString()
    };

    // Handle slug update with automatic uniqueness
    if (validUpdateData.slug) {
      processedUpdateData.slug = await this.generateUniqueSlug(validUpdateData.slug, articleId);
    }

    // Process content data if content changed
    if (validUpdateData.content) {
      Object.assign(processedUpdateData, this.processContentData(validUpdateData.content));
    }

    // Handle media fields - convert empty strings to null
    if ('cover_image' in validUpdateData) {
      processedUpdateData.cover_image = validUpdateData.cover_image?.trim() || null;
    }
    if ('cover_image_alt' in validUpdateData) {
      processedUpdateData.cover_image_alt = validUpdateData.cover_image_alt?.trim() || null;
    }

    // Set published_at when publishing
    if (validUpdateData.status === 'published') {
      processedUpdateData.published_at = new Date().toISOString();
    }

    return processedUpdateData;
  }
}

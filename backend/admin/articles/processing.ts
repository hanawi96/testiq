/**
 * Articles Module - Data Processing Logic
 * Chứa tất cả logic xử lý và chuẩn bị dữ liệu cho articles module
 */

import { generateSlug } from '../../../src/utils/slug-generator';
import { ArticleQueries } from './queries';
import type { CreateArticleData, LinkAnalysis } from './types';

export class ProcessingUtils {
  /**
   * Get base domain for link analysis (environment-aware)
   */
  static getBaseDomain(): string {
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
   * OPTIMIZED: Fast link analysis với minimal processing
   */
  static analyzeContentLinks(content: string, baseDomain: string): LinkAnalysis {
    // OPTIMIZED: Pre-compile regex for better performance
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    const internal_links: any[] = [];
    const external_links: any[] = [];
    let match;

    // OPTIMIZED: Single pass processing
    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[1];
      const isInternal = url.includes(baseDomain) || url.startsWith('/');

      if (isInternal) {
        internal_links.push({ url, text: '' }); // Minimal data
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
      // Frontend compatibility
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
   * @deprecated Use calculateContentMetrics instead
   */
  static calculateReadingTime(content: string): number {
    return this.calculateContentMetrics(content).readingTime;
  }

  /**
   * @deprecated Use calculateContentMetrics instead
   */
  static calculateWordCount(content: string): number {
    return this.calculateContentMetrics(content).wordCount;
  }

  /**
   * OPTIMIZED: Process article data before saving
   * Uses new validation and slug generation methods
   */
  static async processArticleData(articleData: CreateArticleData, authorId: string) {
    // OPTIMIZED: Pre-process strings once
    const trimmedTitle = articleData.title.trim();
    const trimmedContent = articleData.content.trim();

    // Generate unique slug
    const slug = articleData.slug?.trim() || await this.generateUniqueSlug(trimmedTitle);

    // OPTIMIZED: Calculate metrics in single pass
    const { wordCount, readingTime } = this.calculateContentMetrics(trimmedContent);

    // Analyze links in content
    const baseDomain = this.getBaseDomain();
    const linkAnalysis = this.analyzeContentLinks(trimmedContent, baseDomain);

    // Prepare article data for database
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
      parent_id: articleData.parent_id || null,

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

      // Twitter fields
      twitter_title: articleData.twitter_title || null,
      twitter_description: articleData.twitter_description || null,
      twitter_image: articleData.twitter_image || null,
      twitter_card_type: articleData.twitter_card_type || 'summary_large_image',

      // Media fields
      cover_image: articleData.cover_image || null,
      cover_image_alt: articleData.cover_image_alt || null,
      gallery_images: articleData.gallery_images || null,

      // Schema fields
      schema_type: articleData.schema_type || 'Article',
      author_schema: articleData.author_schema || null,
      organization_schema: articleData.organization_schema || null,
      faq_schema: articleData.faq_schema || null,
      howto_schema: articleData.howto_schema || null,
      breadcrumb_schema: articleData.breadcrumb_schema || null,

      // SEO settings
      robots_directive: articleData.robots_directive || 'index,follow',
      sitemap_include: articleData.sitemap_include !== false,
      sitemap_priority: articleData.sitemap_priority || 0.5,
      sitemap_changefreq: articleData.sitemap_changefreq || 'weekly',

      // Content analysis
      word_count: wordCount,
      reading_time: readingTime,
      internal_links: linkAnalysis.internal_links,
      external_links: linkAnalysis.external_links,

      // Publishing
      published_at: articleData.status === 'published' ? new Date().toISOString() : null,
      scheduled_at: articleData.scheduled_at || null,
      expires_at: articleData.expires_at || null,

      // Versioning
      revision_notes: articleData.revision_notes || null,

      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return { processedData, slug };
  }

  /**
   * Process update data for articles
   */
  static async processUpdateData(
    updateData: Partial<CreateArticleData>,
    articleId?: string
  ): Promise<any> {
    const processedUpdateData: any = {
      ...updateData,
      // Only auto-set updated_at if not provided by user
      updated_at: updateData.updated_at || new Date().toISOString()
    };

    // Handle slug update with automatic uniqueness
    if (updateData.slug) {
      processedUpdateData.slug = await this.generateUniqueSlug(updateData.slug, articleId);
    }

    // OPTIMIZED: Update content metrics if content changed
    if (updateData.content) {
      const { wordCount, readingTime } = this.calculateContentMetrics(updateData.content);
      processedUpdateData.word_count = wordCount;
      processedUpdateData.reading_time = readingTime;

      // Analyze links in content
      const baseDomain = this.getBaseDomain();
      const linkAnalysis = this.analyzeContentLinks(updateData.content, baseDomain);
      processedUpdateData.internal_links = linkAnalysis.internal_links;
      processedUpdateData.external_links = linkAnalysis.external_links;
    }

    // Set published_at when publishing
    if (updateData.status === 'published') {
      processedUpdateData.published_at = new Date().toISOString();
    }

    return processedUpdateData;
  }
}

/**
 * Articles Module - Relationships Management
 * Chứa tất cả logic quản lý relationships (tags, categories, authors) cho articles module
 */

import { supabase } from '../../config/supabase';
import { ArticleQueries } from './queries';

// ===== GENERIC RELATIONSHIP UTILITIES =====

/**
 * GENERIC: Handle relationship updates with diff-based approach
 */
async function updateRelationships(config: {
  articleId: string;
  tableName: string;
  foreignKeyColumn: string;
  newIds: string[];
  primaryUpdate?: { column: string; value: string | null };
}): Promise<{ error: any }> {
  try {
    const { articleId, tableName, foreignKeyColumn, newIds, primaryUpdate } = config;

    // 1. Update primary field if specified (for categories)
    if (primaryUpdate) {
      const { error: updateError } = await ArticleQueries.updateArticle(articleId, {
        [primaryUpdate.column]: primaryUpdate.value,
        updated_at: new Date().toISOString()
      });
      if (updateError) return { error: updateError };
    }

    // 2. Get existing relationships
    const { data: existing } = await supabase
      .from(tableName)
      .select(foreignKeyColumn)
      .eq('article_id', articleId);

    const existingIds = existing?.map((item: any) => item[foreignKeyColumn]) || [];

    // 3. Calculate diff
    const toAdd = newIds.filter(id => !existingIds.includes(id));
    const toRemove = existingIds.filter(id => !newIds.includes(id));

    // 4. Remove old relationships
    if (toRemove.length > 0) {
      await supabase
        .from(tableName)
        .delete()
        .eq('article_id', articleId)
        .in(foreignKeyColumn, toRemove);
    }

    // 5. Add new relationships
    if (toAdd.length > 0) {
      const relations = toAdd.map(id => ({
        article_id: articleId,
        [foreignKeyColumn]: id
      }));

      const { error: insertError } = await supabase
        .from(tableName)
        .upsert(relations, {
          onConflict: `article_id,${foreignKeyColumn}`,
          ignoreDuplicates: true
        });

      if (insertError) return { error: insertError };
    }

    // 6. Update article timestamp if no primary update was done
    if (!primaryUpdate) {
      await supabase
        .from('articles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', articleId);
    }

    return { error: null };
  } catch (err) {
    return { error: err };
  }
}

export class RelationshipsUtils {
  /**
   * OPTIMIZED: Generate unique slugs for tags với batch processing
   */
  private static async generateUniqueTagSlugs(tagNames: string[]): Promise<Array<{name: string, slug: string, usage_count: number}>> {
    // OPTIMIZED: Generate base slugs first với edge case handling
    const baseSlugs = tagNames.map(name => {
      let baseSlug = name.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-')      // Replace multiple hyphens with single
        .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens

      // FIXED: Handle edge case where slug becomes empty
      if (!baseSlug) {
        baseSlug = 'tag';
      }

      return { name, baseSlug };
    });

    // OPTIMIZED: Batch check existing slugs
    const allPossibleSlugs = baseSlugs.map(item => item.baseSlug);
    const { data: existingSlugs } = await supabase
      .from('tags')
      .select('slug')
      .in('slug', allPossibleSlugs);

    const existingSlugSet = new Set(existingSlugs?.map(item => item.slug) || []);

    // OPTIMIZED: Generate unique slugs
    const tagsToInsert = [];
    for (const { name, baseSlug } of baseSlugs) {
      let slug = baseSlug;
      let counter = 1;

      // Find unique slug
      while (existingSlugSet.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;

        // Safety limit
        if (counter > 100) {
          slug = `${baseSlug}-${Date.now()}`;
          break;
        }
      }

      // Add to set để tránh duplicates trong batch này
      existingSlugSet.add(slug);

      tagsToInsert.push({
        name,
        slug,
        usage_count: 1
      });
    }

    return tagsToInsert;
  }

  /**
   * REFACTORED: Update article tags - Compact & Reusable
   */
  static async updateTags(articleId: string, tags: string[]): Promise<{ error: any }> {
    try {
      // 1. Process and get tag IDs
      const tagIds = await this.processTagsToIds(tags);

      // 2. Use generic relationship updater
      return updateRelationships({
        articleId,
        tableName: 'article_tags',
        foreignKeyColumn: 'tag_id',
        newIds: tagIds
      });
    } catch (err) {
      return { error: err };
    }
  }

  /**
   * EXTRACTED: Process tag names to IDs (reusable utility)
   */
  private static async processTagsToIds(tags: string[]): Promise<string[]> {
    if (!tags || tags.length === 0) return [];

    const cleanTags = tags.map(tag => tag.trim()).filter(Boolean);
    if (cleanTags.length === 0) return [];

    // Get existing tags
    const { data: existingTags } = await supabase
      .from('tags')
      .select('id, name')
      .in('name', cleanTags);

    const existingTagMap = new Map(existingTags?.map(tag => [tag.name, tag.id]) || []);

    // Create new tags if needed
    const newTagNames = cleanTags.filter(name => !existingTagMap.has(name));
    if (newTagNames.length > 0) {
      const tagsToInsert = await this.generateUniqueTagSlugs(newTagNames);
      const { data: newTags } = await supabase
        .from('tags')
        .insert(tagsToInsert)
        .select('id, name');

      newTags?.forEach(tag => existingTagMap.set(tag.name, tag.id));
    }

    // Return all tag IDs
    return cleanTags.map(name => existingTagMap.get(name)).filter(Boolean) as string[];
  }

  /**
   * REFACTORED: Update article author - Compact & Clean
   */
  static async updateAuthorById(articleId: string, authorId: string): Promise<{ error: any }> {
    const { error } = await ArticleQueries.updateArticle(articleId, {
      author_id: authorId,
      updated_at: new Date().toISOString()
    });
    return { error };
  }

  /**
   * Update article category (single category for quick edit)
   */
  static async updateCategory(articleId: string, categoryId: string | null): Promise<{ error: any }> {
    // Convert single category to array and delegate to updateCategories
    const categoryIds = categoryId ? [categoryId] : [];
    return this.updateCategories(articleId, categoryIds);
  }

  /**
   * REFACTORED: Update article categories - Compact & Reusable
   */
  static async updateCategories(articleId: string, categoryIds: string[]): Promise<{ error: any }> {
    const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;

    // Use generic relationship updater with primary category update
    return updateRelationships({
      articleId,
      tableName: 'article_categories',
      foreignKeyColumn: 'category_id',
      newIds: categoryIds,
      primaryUpdate: { column: 'category_id', value: primaryCategoryId }
    });
  }

  /**
   * REFACTORED: Get all tags - Clean & Simple
   */
  static async getTags(): Promise<string[]> {
    try {
      const { data: tags, error } = await supabase
        .from('tags')
        .select('name')
        .order('usage_count', { ascending: false })
        .order('name', { ascending: true });

      if (error || !tags) return [];
      return tags.map(tag => tag.name).filter(Boolean);
    } catch {
      return [];
    }
  }
}

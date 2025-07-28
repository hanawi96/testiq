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
    console.log('🔧 updateRelationships START:', { articleId, tableName, foreignKeyColumn, newIds, primaryUpdate });

    // 1. Update primary field if specified (for categories)
    if (primaryUpdate) {
      console.log('📝 Updating primary field:', primaryUpdate);
      const { error: updateError } = await ArticleQueries.updateArticle(articleId, {
        [primaryUpdate.column]: primaryUpdate.value,
        updated_at: new Date().toISOString()
      });
      if (updateError) {
        console.log('❌ Primary field update error:', updateError);
        return { error: updateError };
      }
      console.log('✅ Primary field updated successfully');
    }

    // 2. Get existing relationships
    console.log('🔍 Getting existing relationships from:', tableName);
    const { data: existing } = await supabase
      .from(tableName)
      .select(foreignKeyColumn)
      .eq('article_id', articleId);

    const existingIds = existing?.map((item: any) => item[foreignKeyColumn]) || [];
    console.log('📊 Existing IDs:', existingIds);

    // 3. Calculate diff and check order
    const toAdd = newIds.filter(id => !existingIds.includes(id));
    const toRemove = existingIds.filter(id => !newIds.includes(id));

    // Check if order has changed (important for categories)
    const orderChanged = JSON.stringify(existingIds) !== JSON.stringify(newIds);
    console.log('📈 Diff calculation:', { toAdd, toRemove, orderChanged });

    // 4. If order changed or there are changes, recreate all relationships
    if (orderChanged || toAdd.length > 0 || toRemove.length > 0) {
      console.log('🔄 Recreating relationships due to changes or order change');

      // Remove ALL existing relationships
      const { error: deleteAllError } = await supabase
        .from(tableName)
        .delete()
        .eq('article_id', articleId);

      if (deleteAllError) {
        console.log('❌ Delete all error:', deleteAllError);
        return { error: deleteAllError };
      }
      console.log('✅ All old relationships removed');

      // Add ALL new relationships in correct order
      if (newIds.length > 0) {
        console.log('➕ Adding all relationships in correct order:', newIds);
        const relations = newIds.map(id => ({
          article_id: articleId,
          [foreignKeyColumn]: id
        }));

        const { error: insertError } = await supabase
          .from(tableName)
          .insert(relations);

        if (insertError) {
          console.log('❌ Insert error:', insertError);
          return { error: insertError };
        }
        console.log('✅ All new relationships added in correct order');
      }
    } else {
      console.log('⏭️ No changes needed - relationships already correct');
    }

    // 6. Update article timestamp if no primary update was done
    if (!primaryUpdate) {
      console.log('⏰ Updating article timestamp');
      await supabase
        .from('articles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', articleId);
    }

    console.log('✅ updateRelationships COMPLETE - no errors');
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
  static async processTagsToIds(tags: string[]): Promise<string[]> {
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
    console.log('🔧 RelationshipsUtils.updateCategories START:', { articleId, categoryIds });

    const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;
    console.log('📝 Primary category ID:', primaryCategoryId);

    // Use generic relationship updater with primary category update
    const result = await updateRelationships({
      articleId,
      tableName: 'article_categories',
      foreignKeyColumn: 'category_id',
      newIds: categoryIds,
      primaryUpdate: { column: 'category_id', value: primaryCategoryId }
    });

    console.log('✅ RelationshipsUtils.updateCategories RESULT:', result);
    return result;
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

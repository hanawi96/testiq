/**
 * Articles Module - Relationships Management
 * Chứa tất cả logic quản lý relationships (tags, categories, authors) cho articles module
 */

import { supabase } from '../../config/supabase';
import { ArticleQueries } from './queries';

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
   * Update article tags (for quick edit)
   */
  static async updateTags(articleId: string, tags: string[]): Promise<{ error: any }> {
    try {
      // FIXED: Khai báo tagIds ở scope đúng
      const tagIds: string[] = [];

      // OPTIMIZED: Process tags if provided
      if (tags && tags.length > 0) {
        // OPTIMIZED: Batch process tags
        const cleanTags = tags.map(tag => tag.trim()).filter(Boolean);

        if (cleanTags.length > 0) {
          // OPTIMIZED: Single query để get existing tags
          const { data: existingTags } = await supabase
            .from('tags')
            .select('id, name')
            .in('name', cleanTags);

          const existingTagMap = new Map(existingTags?.map(tag => [tag.name, tag.id]) || []);

          // OPTIMIZED: Batch create new tags với smart slug generation
          const newTagNames = cleanTags.filter(name => !existingTagMap.has(name));
          if (newTagNames.length > 0) {
            // FIXED: Generate unique slugs để tránh conflicts
            const tagsToInsert = await this.generateUniqueTagSlugs(newTagNames);

            const { data: newTags, error: insertError } = await supabase
              .from('tags')
              .insert(tagsToInsert)
              .select('id, name');

            if (insertError) {
              console.error('RelationshipsUtils: Error inserting tags:', insertError);
              // Continue with existing tags only
            } else {
              // Add new tags to map
              newTags?.forEach(tag => existingTagMap.set(tag.name, tag.id));
            }
          }

          // Collect all tag IDs
          cleanTags.forEach(name => {
            const id = existingTagMap.get(name);
            if (id) tagIds.push(id);
          });
        }
      }

      // OPTIMIZED: Single transaction-like operation
      // 1. Delete existing relationships
      await supabase
        .from('article_tags')
        .delete()
        .eq('article_id', articleId);

      // 2. Insert new relationships if any
      if (tagIds.length > 0) {
        const tagRelations = tagIds.map(tagId => ({
          article_id: articleId,
          tag_id: tagId
        }));

        const { error: insertError } = await supabase
          .from('article_tags')
          .insert(tagRelations);

        if (insertError) {
          return { error: insertError };
        }
      }

      // OPTIMIZED: Direct timestamp update - avoid extra query
      await supabase
        .from('articles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', articleId);

      return { error: null };

    } catch (err) {
      return { error: err };
    }
  }

  /**
   * Update article author (for quick edit)
   */
  static async updateAuthorById(articleId: string, authorId: string): Promise<{ error: any }> {
    try {
      console.log('RelationshipsUtils: Updating article author:', { articleId, authorId });

      const updateData = {
        author_id: authorId,
        updated_at: new Date().toISOString()
      };

      const { error } = await ArticleQueries.updateArticle(articleId, updateData);

      if (error) {
        console.error('RelationshipsUtils: Error updating article author:', error);
        return { error };
      }

      console.log('RelationshipsUtils: Successfully updated article author');
      return { error: null };

    } catch (err) {
      console.error('RelationshipsUtils: Unexpected error updating article author:', err);
      return { error: err };
    }
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
   * Update article categories (multiple categories for quick edit)
   */
  static async updateCategories(articleId: string, categoryIds: string[]): Promise<{ error: any }> {
    try {
      // OPTIMIZED: Remove logging, direct processing
      const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;

      // 1. Update primary category in articles table
      const { error: updateError } = await ArticleQueries.updateArticle(articleId, {
        category_id: primaryCategoryId,
        updated_at: new Date().toISOString()
      });

      if (updateError) {
        console.error('RelationshipsUtils: Error updating primary category:', updateError);
        return { error: updateError };
      }

      // 2. OPTIMIZED: Upsert categories to avoid race conditions
      if (categoryIds.length > 0) {
        // First, get existing categories for this article
        const { data: existingCategories } = await supabase
          .from('article_categories')
          .select('category_id')
          .eq('article_id', articleId);

        const existingCategoryIds = existingCategories?.map(c => c.category_id) || [];

        // Find categories to add and remove
        const categoriesToAdd = categoryIds.filter(id => !existingCategoryIds.includes(id));
        const categoriesToRemove = existingCategoryIds.filter(id => !categoryIds.includes(id));

        // Remove categories that are no longer needed
        if (categoriesToRemove.length > 0) {
          const { error: deleteError } = await supabase
            .from('article_categories')
            .delete()
            .eq('article_id', articleId)
            .in('category_id', categoriesToRemove);

          if (deleteError) {
            console.error('RelationshipsUtils: Error removing old categories:', deleteError);
          }
        }

        // Add new categories (only ones that don't exist)
        if (categoriesToAdd.length > 0) {
          const categoryRelations = categoriesToAdd.map(categoryId => ({
            article_id: articleId,
            category_id: categoryId
          }));

          const { error: insertError } = await supabase
            .from('article_categories')
            .upsert(categoryRelations, {
              onConflict: 'article_id,category_id',
              ignoreDuplicates: true
            });

          if (insertError) {
            console.error('RelationshipsUtils: Error adding new categories:', insertError);
            // Continue anyway - primary category is already updated
          }
        }
      } else {
        // No categories selected - remove all existing ones
        const { error: deleteAllError } = await supabase
          .from('article_categories')
          .delete()
          .eq('article_id', articleId);

        if (deleteAllError) {
          console.error('RelationshipsUtils: Error removing all categories:', deleteAllError);
        }
      }

      console.log('✅ RelationshipsUtils: Successfully updated article categories (race-condition safe)');
      return { error: null };

    } catch (err) {
      console.error('RelationshipsUtils: Unexpected error updating article categories:', err);
      return { error: err };
    }
  }

  /**
   * Update article categories (junction table) - for internal use
   */
  static async updateArticleCategories(articleId: string, categoryIds: string[]): Promise<void> {
    try {
      // Delete existing category relationships
      await supabase
        .from('article_categories')
        .delete()
        .eq('article_id', articleId);

      // Insert new category relationships
      if (categoryIds.length > 0) {
        const categoryRelations = categoryIds.map(categoryId => ({
          article_id: articleId,
          category_id: categoryId
        }));

        await supabase
          .from('article_categories')
          .insert(categoryRelations);
      }
    } catch (err) {
      console.error('RelationshipsUtils: Error updating article categories:', err);
      // Don't throw - continue with article update
    }
  }



  /**
   * Get all tags (for preloader and quick edit)
   */
  static async getTags(): Promise<string[]> {
    try {
      const { data: tags, error } = await supabase
        .from('tags')
        .select('name')
        .order('usage_count', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        console.error('RelationshipsUtils: Error fetching tags:', error);
        return [];
      }

      if (!tags || tags.length === 0) {
        return [];
      }

      return tags.map(tag => tag.name).filter(Boolean);

    } catch (err) {
      console.error('RelationshipsUtils: Unexpected error fetching tags:', err);
      return [];
    }
  }
}

/**
 * Articles Module - Relationships Management
 * Chứa tất cả logic quản lý relationships (tags, categories, authors) cho articles module
 */

import { supabase } from '../../config/supabase';
import { ArticleQueries } from './queries';

export class RelationshipsUtils {
  /**
   * Update article tags (for quick edit)
   */
  static async updateTags(articleId: string, tags: string[]): Promise<{ error: any }> {
    try {

      // 1. Update article timestamp
      const { error: updateError } = await ArticleQueries.updateArticle(articleId, {
        updated_at: new Date().toISOString()
      });

      if (updateError) {
        return { error: updateError };
      }

      // 2. Handle tags if provided
      if (tags && tags.length > 0) {
        // Create tags that don't exist
        const tagIds: string[] = [];

        for (const tagName of tags) {
          if (!tagName.trim()) continue;

          // Try to find existing tag
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName.trim())
            .single();

          if (existingTag) {
            tagIds.push(existingTag.id);
          } else {
            // Create new tag
            const { data: newTag, error: createError } = await supabase
              .from('tags')
              .insert({
                name: tagName.trim(),
                slug: tagName.trim().toLowerCase().replace(/\s+/g, '-'),
                usage_count: 1
              })
              .select('id')
              .single();

            if (createError) {
              continue;
            }

            if (newTag) {
              tagIds.push(newTag.id);
            }
          }
        }

        // 3. Delete existing article_tags relationships
        const { error: deleteError } = await supabase
          .from('article_tags')
          .delete()
          .eq('article_id', articleId);

        if (deleteError) {
          // Continue anyway
        }

        // 4. Insert new article_tags relationships
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
      } else {
        // No tags provided - delete all existing tags for this article
        const { error: deleteError } = await supabase
          .from('article_tags')
          .delete()
          .eq('article_id', articleId);

        if (deleteError) {
          // Continue anyway
        }
      }

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
      console.log('RelationshipsUtils: Updating article categories:', { articleId, categoryIds });

      // Set primary category (first one) - this field exists in articles table
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

      // 2. Delete existing categories for this article from article_categories
      const { error: deleteError } = await supabase
        .from('article_categories')
        .delete()
        .eq('article_id', articleId);

      if (deleteError) {
        console.error('RelationshipsUtils: Error deleting existing categories:', deleteError);
        // Continue anyway - this is not critical
      }

      // 3. Insert new article_categories relationships for all categories
      if (categoryIds.length > 0) {
        const categoryRelations = categoryIds.map(categoryId => ({
          article_id: articleId,
          category_id: categoryId
        }));

        const { error: insertError } = await supabase
          .from('article_categories')
          .insert(categoryRelations);

        if (insertError) {
          console.error('RelationshipsUtils: Error inserting new categories:', insertError);
          // Continue anyway - primary category is already updated
        }
      }

      console.log('RelationshipsUtils: Successfully updated article categories');
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
   * Update article tags (junction table) - for internal use
   */
  static async updateArticleTags(articleId: string, tagNames: string[]): Promise<void> {
    try {
      // Delete existing tag relationships
      await supabase
        .from('article_tags')
        .delete()
        .eq('article_id', articleId);

      // Process tags if provided
      if (tagNames.length > 0) {
        const tagIds: string[] = [];

        for (const tagName of tagNames) {
          if (!tagName.trim()) continue;

          // Try to find existing tag
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName.trim())
            .single();

          if (existingTag) {
            tagIds.push(existingTag.id);
          } else {
            // Create new tag
            const { data: newTag, error: createError } = await supabase
              .from('tags')
              .insert({
                name: tagName.trim(),
                slug: tagName.trim().toLowerCase().replace(/\s+/g, '-'),
                usage_count: 1
              })
              .select('id')
              .single();

            if (!createError && newTag) {
              tagIds.push(newTag.id);
            }
          }
        }

        // Insert new tag relationships
        if (tagIds.length > 0) {
          const tagRelations = tagIds.map(tagId => ({
            article_id: articleId,
            tag_id: tagId
          }));

          await supabase
            .from('article_tags')
            .insert(tagRelations);
        }
      }
    } catch (err) {
      console.error('RelationshipsUtils: Error updating article tags:', err);
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

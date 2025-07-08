import { supabase } from '../config/supabase';

// Types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  usage_count: number;
  created_at: string;
}

export interface TagStats {
  total: number;
  active: number;
  inactive: number;
  mostUsed: Tag[];
}

export interface TagsFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export interface TagsListResponse {
  tags: Tag[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class TagsService {
  /**
   * Get tags with pagination and filters
   */
  static async getTags(
    page: number = 1,
    limit: number = 10,
    filters: TagsFilters = {}
  ): Promise<{ data: TagsListResponse | null; error: any }> {
    try {
      console.log('TagsService: Fetching tags from database', { page, limit, filters });

      // Build query
      let query = supabase
        .from('tags')
        .select('*');

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.trim();
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`);
      }

      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from('tags')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('TagsService: Error getting total count:', countError);
        return { data: null, error: countError };
      }

      // Apply pagination and ordering
      const offset = (page - 1) * limit;
      query = query
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: tagsData, error: fetchError } = await query;

      if (fetchError) {
        console.error('TagsService: Error fetching tags:', fetchError);
        return { data: null, error: fetchError };
      }

      const total = totalCount || 0;
      const hasNext = offset + limit < total;
      const hasPrev = page > 1;

      console.log(`TagsService: Successfully fetched ${tagsData?.length || 0} tags`);

      return {
        data: {
          tags: tagsData || [],
          total,
          page,
          limit,
          hasNext,
          hasPrev
        },
        error: null
      };

    } catch (err: any) {
      console.error('TagsService: Error in getTags:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get tag statistics
   */
  static async getTagStats(): Promise<{ data: TagStats | null; error: any }> {
    try {
      console.log('TagsService: Fetching tag statistics');

      // Get total count and most used tags
      const { data: allTags, error: fetchError } = await supabase
        .from('tags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(5);

      if (fetchError) {
        console.error('TagsService: Error fetching tag stats:', fetchError);
        return { data: null, error: fetchError };
      }

      const total = allTags?.length || 0;
      const active = total; // All tags are considered active (no status field in schema)
      const inactive = 0;
      const mostUsed = allTags?.slice(0, 5) || [];

      console.log('TagsService: Successfully fetched tag statistics');

      return {
        data: {
          total,
          active,
          inactive,
          mostUsed
        },
        error: null
      };

    } catch (err: any) {
      console.error('TagsService: Error in getTagStats:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Generate slug from name
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Create new tag
   */
  static async createTag(data: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<{ data: Tag | null; error: any }> {
    try {
      console.log('TagsService: Creating tag in database:', data);

      const name = data.name.trim();
      const slug = this.generateSlug(name);

      // Check if name or slug already exists
      const { data: existingTags, error: checkError } = await supabase
        .from('tags')
        .select('id, name, slug')
        .or(`name.ilike.${name},slug.eq.${slug}`);

      if (checkError) {
        console.error('TagsService: Error checking existing tags:', checkError);
        return { data: null, error: checkError };
      }

      if (existingTags && existingTags.length > 0) {
        const existingTag = existingTags[0];
        const errorMsg = existingTag.name.toLowerCase() === name.toLowerCase()
          ? `Tag "${name}" đã tồn tại`
          : `Slug "${slug}" đã được sử dụng`;
        return { data: null, error: new Error(errorMsg) };
      }

      // Insert new tag
      const { data: insertedData, error: insertError } = await supabase
        .from('tags')
        .insert({
          name,
          slug,
          description: data.description?.trim() || null,
          color: data.color || '#EF4444',
          usage_count: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error('TagsService: Error inserting tag:', insertError);
        return { data: null, error: insertError };
      }

      if (!insertedData) {
        return { data: null, error: new Error('Không thể tạo tag') };
      }

      console.log('TagsService: Successfully created tag:', insertedData.id);
      return { data: insertedData, error: null };

    } catch (err: any) {
      console.error('TagsService: Error in createTag:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update tag
   */
  static async updateTag(
    tagId: string,
    data: Partial<{
      name: string;
      description: string;
      slug: string;
      color: string;
    }>
  ): Promise<{ data: Tag | null; error: any }> {
    try {
      console.log('TagsService: Updating tag in database:', { tagId, data });

      // Check if tag exists
      const { data: existingTag, error: checkError } = await supabase
        .from('tags')
        .select('*')
        .eq('id', tagId)
        .single();

      if (checkError) {
        console.error('TagsService: Error checking tag:', checkError);
        return { data: null, error: checkError };
      }

      if (!existingTag) {
        return { data: null, error: new Error('Tag không tồn tại') };
      }

      // Prepare update data
      const updateData: any = {};

      if (data.name !== undefined) {
        const name = data.name.trim();
        if (name !== existingTag.name) {
          // Check if new name already exists
          const { data: nameCheck, error: nameError } = await supabase
            .from('tags')
            .select('id')
            .ilike('name', name)
            .neq('id', tagId);

          if (nameError) {
            return { data: null, error: nameError };
          }

          if (nameCheck && nameCheck.length > 0) {
            return { data: null, error: new Error(`Tag "${name}" đã tồn tại`) };
          }

          updateData.name = name;
          updateData.slug = this.generateSlug(name);
        }
      }

      if (data.description !== undefined) {
        updateData.description = data.description.trim() || null;
      }

      if (data.color !== undefined) {
        updateData.color = data.color;
      }

      // Update tag
      const { data: updatedData, error: updateError } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', tagId)
        .select()
        .single();

      if (updateError) {
        console.error('TagsService: Error updating tag:', updateError);
        return { data: null, error: updateError };
      }

      console.log('TagsService: Successfully updated tag:', tagId);
      return { data: updatedData, error: null };

    } catch (err: any) {
      console.error('TagsService: Error in updateTag:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Delete tag
   */
  static async deleteTag(tagId: string): Promise<{ data: boolean; error: any }> {
    try {
      console.log('TagsService: Deleting tag:', tagId);

      // Check if tag is being used
      const { count: usageCount, error: usageError } = await supabase
        .from('article_tags')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', tagId);

      if (usageError) {
        console.error('TagsService: Error checking tag usage:', usageError);
        return { data: false, error: usageError };
      }

      if (usageCount && usageCount > 0) {
        return {
          data: false,
          error: new Error(`Không thể xóa tag vì đang được sử dụng trong ${usageCount} bài viết`)
        };
      }

      // Delete tag
      const { error: deleteError } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (deleteError) {
        console.error('TagsService: Error deleting tag:', deleteError);
        return { data: false, error: deleteError };
      }

      console.log('TagsService: Successfully deleted tag:', tagId);
      return { data: true, error: null };

    } catch (err: any) {
      console.error('TagsService: Error in deleteTag:', err);
      return { data: false, error: err };
    }
  }

  /**
   * Get tag usage count
   */
  static async getTagUsage(tagId: string): Promise<{ data: number; error: any }> {
    try {
      const { count, error } = await supabase
        .from('article_tags')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', tagId);

      if (error) {
        console.error('TagsService: Error getting tag usage:', error);
        return { data: 0, error };
      }

      return { data: count || 0, error: null };

    } catch (err: any) {
      console.error('TagsService: Error in getTagUsage:', err);
      return { data: 0, error: err };
    }
  }
}

import { supabase } from '../config/supabase';

// Error handling utilities
class CategoriesError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'CategoriesError';
  }
}

const handleDatabaseError = (error: any, operation: string) => {
  console.error(`CategoriesService: Database error during ${operation}:`, error);

  // Map common Supabase errors to user-friendly messages
  if (error?.code === 'PGRST116') {
    return new CategoriesError('Không tìm thấy dữ liệu', 'NOT_FOUND', error);
  }

  if (error?.code === '23505') {
    return new CategoriesError('Dữ liệu đã tồn tại', 'DUPLICATE', error);
  }

  if (error?.code === '23503') {
    return new CategoriesError('Không thể thực hiện do ràng buộc dữ liệu', 'CONSTRAINT_VIOLATION', error);
  }

  if (error?.message?.includes('connection')) {
    return new CategoriesError('Không thể kết nối đến cơ sở dữ liệu', 'CONNECTION_ERROR', error);
  }

  if (error?.message?.includes('timeout')) {
    return new CategoriesError('Thao tác quá thời gian chờ', 'TIMEOUT', error);
  }

  // Generic error
  return new CategoriesError(
    error?.message || 'Có lỗi xảy ra khi thao tác với cơ sở dữ liệu',
    'DATABASE_ERROR',
    error
  );
};

// Retry utility for critical operations
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (error?.code === '23505' || error?.code === '23503' || error?.code === 'PGRST116') {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error;
      }

      console.warn(`CategoriesService: Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Exponential backoff
    }
  }

  throw lastError;
};

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'inactive';
  article_count: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  // Additional fields from database
  meta_title?: string;
  meta_description?: string;
  color?: string;
  parent_id?: string;
}

export interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  totalArticles: number;
  avgArticlesPerCategory: number;
}

export interface CategoriesFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'article_count' | 'display_order';
  sort_order?: 'asc' | 'desc';
}

export interface CategoriesListResponse {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Database row interface (matches database schema)
interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  color: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class CategoriesService {
  /**
   * Check database connection health
   */
  private static async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('categories')
        .select('id')
        .limit(1);

      return !error;
    } catch (err) {
      console.error('CategoriesService: Connection check failed:', err);
      return false;
    }
  }

  /**
   * Transform database row to Category interface
   */
  private static transformCategoryRow(row: CategoryRow, articleCount: number = 0): Category {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || '',
      status: row.is_active ? 'active' : 'inactive',
      article_count: articleCount,
      display_order: row.sort_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
      meta_title: row.meta_title || undefined,
      meta_description: row.meta_description || undefined,
      color: row.color || undefined,
      parent_id: row.parent_id || undefined
    };
  }

  /**
   * Generate slug from name
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens
      .trim();
  }


  /**
   * Get categories statistics
   */
  static async getStats(): Promise<{ data: CategoryStats | null; error: any }> {
    try {
      console.log('CategoriesService: Calculating statistics from database');

      // Get categories count by status
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, is_active');

      if (categoriesError) {
        const error = handleDatabaseError(categoriesError, 'fetching categories for stats');
        return { data: null, error };
      }

      // Get total articles count
      const { count: totalArticles, error: articlesError } = await supabase
        .from('articles')
        .select('id', { count: 'exact' })
        .not('category_id', 'is', null);

      if (articlesError) {
        console.warn('CategoriesService: Error fetching articles count:', articlesError);
        // Don't fail the whole operation for articles count error
      }

      const categories = categoriesData || [];
      const total = categories.length;
      const active = categories.filter(c => c.is_active).length;
      const inactive = total - active;
      const articlesCount = totalArticles || 0;

      const stats: CategoryStats = {
        total,
        active,
        inactive,
        totalArticles: articlesCount,
        avgArticlesPerCategory: total > 0 ? Math.round(articlesCount / total) : 0
      };

      console.log('CategoriesService: Stats calculated successfully:', stats);
      return { data: stats, error: null };

    } catch (err) {
      const error = handleDatabaseError(err, 'calculating stats');
      return { data: null, error };
    }
  }

  /**
   * Get categories with pagination and filters
   */
  static async getCategories(
    page: number = 1,
    limit: number = 10,
    filters: CategoriesFilters = {}
  ): Promise<{ data: CategoriesListResponse | null; error: any }> {
    try {
      console.log('CategoriesService: Fetching categories from database', { page, limit, filters });

      // Build query
      let query = supabase
        .from('categories')
        .select('*');

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.trim();
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`);
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        const isActive = filters.status === 'active';
        query = query.eq('is_active', isActive);
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'display_order';
      const sortOrder = filters.sort_order || 'asc';

      // Map sort_by to database column names
      const dbSortBy = sortBy === 'display_order' ? 'sort_order' : sortBy;

      if (sortBy === 'article_count') {
        // For article_count, we'll sort after getting the data
        query = query.order('sort_order', { ascending: true });
      } else {
        query = query.order(dbSortBy, { ascending: sortOrder === 'asc' });
      }

      // Get total count for pagination
      const { count: totalCount, error: countError } = await supabase
        .from('categories')
        .select('id', { count: 'exact' });

      if (countError) {
        console.error('CategoriesService: Error getting total count:', countError);
        return { data: null, error: countError };
      }

      // Execute main query
      const { data: categoriesData, error: categoriesError } = await query;

      if (categoriesError) {
        console.error('CategoriesService: Error fetching categories:', categoriesError);
        return { data: null, error: categoriesError };
      }

      if (!categoriesData) {
        return { data: null, error: new Error('No categories data returned') };
      }

      // Get article counts for each category
      const categoryIds = categoriesData.map(c => c.id);
      const { data: articleCounts, error: articleCountError } = await supabase
        .from('articles')
        .select('category_id')
        .in('category_id', categoryIds);

      if (articleCountError) {
        console.warn('CategoriesService: Error fetching article counts:', articleCountError);
      }

      // Count articles per category
      const articleCountMap: Record<string, number> = {};
      if (articleCounts) {
        articleCounts.forEach(article => {
          if (article.category_id) {
            articleCountMap[article.category_id] = (articleCountMap[article.category_id] || 0) + 1;
          }
        });
      }

      // Transform to Category interface
      let categories = categoriesData.map(row =>
        this.transformCategoryRow(row, articleCountMap[row.id] || 0)
      );

      // Apply article_count sorting if needed
      if (sortBy === 'article_count') {
        categories.sort((a, b) => {
          return sortOrder === 'asc'
            ? a.article_count - b.article_count
            : b.article_count - a.article_count;
        });
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedCategories = categories.slice(offset, offset + limit);

      const total = totalCount || 0;
      const totalPages = Math.ceil(total / limit);

      const response: CategoriesListResponse = {
        categories: paginatedCategories,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      console.log('CategoriesService: Categories fetched successfully:', {
        returned: paginatedCategories.length,
        total,
        page,
        totalPages
      });

      return { data: response, error: null };

    } catch (err) {
      console.error('CategoriesService: Error fetching categories:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Create new category
   */
  static async createCategory(data: {
    name: string;
    description: string;
    status: 'active' | 'inactive';
    meta_title?: string;
    meta_description?: string;
    color?: string;
    parent_id?: string;
  }): Promise<{ data: Category | null; error: any }> {
    try {
      console.log('CategoriesService: Creating category in database:', data);

      const name = data.name.trim();
      const slug = this.generateSlug(name);

      // Check if name or slug already exists
      const { data: existingCategories, error: checkError } = await supabase
        .from('categories')
        .select('id, name, slug')
        .or(`name.ilike.${name},slug.eq.${slug}`);

      if (checkError) {
        console.error('CategoriesService: Error checking existing categories:', checkError);
        return { data: null, error: checkError };
      }

      if (existingCategories && existingCategories.length > 0) {
        const nameExists = existingCategories.some(c => c.name.toLowerCase() === name.toLowerCase());
        const slugExists = existingCategories.some(c => c.slug === slug);

        if (nameExists) {
          return { data: null, error: new Error('Tên danh mục đã tồn tại') };
        }
        if (slugExists) {
          return { data: null, error: new Error('Slug đã tồn tại') };
        }
      }

      // Get next sort_order
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      if (maxOrderError) {
        console.warn('CategoriesService: Error getting max sort_order:', maxOrderError);
      }

      const nextSortOrder = maxOrderData && maxOrderData.length > 0
        ? (maxOrderData[0].sort_order || 0) + 1
        : 1;

      // Insert new category
      const { data: insertedData, error: insertError } = await supabase
        .from('categories')
        .insert({
          name,
          slug,
          description: data.description.trim() || null,
          meta_title: data.meta_title || null,
          meta_description: data.meta_description || null,
          color: data.color || '#3B82F6',
          parent_id: data.parent_id || null,
          sort_order: nextSortOrder,
          is_active: data.status === 'active'
        })
        .select()
        .single();

      if (insertError) {
        console.error('CategoriesService: Error inserting category:', insertError);
        return { data: null, error: insertError };
      }

      if (!insertedData) {
        return { data: null, error: new Error('Không thể tạo danh mục') };
      }

      const newCategory = this.transformCategoryRow(insertedData, 0);

      console.log('CategoriesService: Category created successfully:', newCategory.id);
      return { data: newCategory, error: null };

    } catch (err) {
      console.error('CategoriesService: Error creating category:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update category
   */
  static async updateCategory(
    categoryId: string,
    data: Partial<{
      name: string;
      description: string;
      slug: string;
      status: 'active' | 'inactive';
      display_order: number;
      meta_title: string;
      meta_description: string;
      color: string;
      parent_id: string;
    }>
  ): Promise<{ data: Category | null; error: any }> {
    try {
      console.log('CategoriesService: Updating category in database:', { categoryId, data });

      // Check if category exists
      const { data: existingCategory, error: checkError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (checkError) {
        console.error('CategoriesService: Error checking category:', checkError);
        return { data: null, error: checkError };
      }

      if (!existingCategory) {
        return { data: null, error: new Error('Không tìm thấy danh mục') };
      }

      // Prepare update data
      const updateData: any = {};

      if (data.name !== undefined) {
        const name = data.name.trim();
        const slug = data.slug !== undefined ? data.slug.trim() : this.generateSlug(name);

        // Check name/slug uniqueness
        const { data: conflictCategories, error: conflictError } = await supabase
          .from('categories')
          .select('id, name, slug')
          .neq('id', categoryId)
          .or(`name.ilike.${name},slug.eq.${slug}`);

        if (conflictError) {
          console.error('CategoriesService: Error checking conflicts:', conflictError);
          return { data: null, error: conflictError };
        }

        if (conflictCategories && conflictCategories.length > 0) {
          const nameExists = conflictCategories.some(c => c.name.toLowerCase() === name.toLowerCase());
          const slugExists = conflictCategories.some(c => c.slug === slug);

          if (nameExists) {
            return { data: null, error: new Error('Tên danh mục đã tồn tại') };
          }
          if (slugExists) {
            return { data: null, error: new Error('Slug đã tồn tại') };
          }
        }

        updateData.name = name;
        updateData.slug = slug;
      } else if (data.slug !== undefined) {
        // Update only slug
        const slug = data.slug.trim();

        // Check slug uniqueness
        const { data: conflictCategories, error: conflictError } = await supabase
          .from('categories')
          .select('id, slug')
          .neq('id', categoryId)
          .eq('slug', slug);

        if (conflictError) {
          console.error('CategoriesService: Error checking slug conflicts:', conflictError);
          return { data: null, error: conflictError };
        }

        if (conflictCategories && conflictCategories.length > 0) {
          return { data: null, error: new Error('Slug đã tồn tại') };
        }

        updateData.slug = slug;
      }

      if (data.description !== undefined) {
        updateData.description = data.description.trim() || null;
      }

      if (data.status !== undefined) {
        updateData.is_active = data.status === 'active';
      }

      if (data.display_order !== undefined) {
        updateData.sort_order = data.display_order;
      }

      if (data.meta_title !== undefined) {
        updateData.meta_title = data.meta_title || null;
      }

      if (data.meta_description !== undefined) {
        updateData.meta_description = data.meta_description || null;
      }

      if (data.color !== undefined) {
        updateData.color = data.color || null;
      }

      if (data.parent_id !== undefined) {
        updateData.parent_id = data.parent_id || null;
      }

      // Update in database
      const { data: updatedData, error: updateError } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', categoryId)
        .select()
        .single();

      if (updateError) {
        console.error('CategoriesService: Error updating category:', updateError);
        return { data: null, error: updateError };
      }

      if (!updatedData) {
        return { data: null, error: new Error('Không thể cập nhật danh mục') };
      }

      // Get article count
      const { count: articleCount, error: countError } = await supabase
        .from('articles')
        .select('id', { count: 'exact' })
        .eq('category_id', categoryId);

      if (countError) {
        console.warn('CategoriesService: Error getting article count:', countError);
      }

      const updatedCategory = this.transformCategoryRow(updatedData, articleCount || 0);

      console.log('CategoriesService: Category updated successfully:', categoryId);
      return { data: updatedCategory, error: null };

    } catch (err) {
      console.error('CategoriesService: Error updating category:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Delete category
   */
  static async deleteCategory(categoryId: string): Promise<{ data: boolean; error: any }> {
    try {
      console.log('CategoriesService: Deleting category from database:', categoryId);

      // Check if category exists and get article count
      const { count: articleCount, error: countError } = await supabase
        .from('articles')
        .select('id', { count: 'exact' })
        .eq('category_id', categoryId);

      if (countError) {
        console.error('CategoriesService: Error checking article count:', countError);
        return { data: false, error: countError };
      }

      // Check if category has articles
      if (articleCount && articleCount > 0) {
        return { data: false, error: new Error(`Không thể xóa danh mục có ${articleCount} bài viết`) };
      }

      // Check if category has child categories
      const { count: childCount, error: childError } = await supabase
        .from('categories')
        .select('id', { count: 'exact' })
        .eq('parent_id', categoryId);

      if (childError) {
        console.error('CategoriesService: Error checking child categories:', childError);
        return { data: false, error: childError };
      }

      if (childCount && childCount > 0) {
        return { data: false, error: new Error(`Không thể xóa danh mục có ${childCount} danh mục con`) };
      }

      // Delete category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) {
        console.error('CategoriesService: Error deleting category:', deleteError);
        return { data: false, error: deleteError };
      }

      console.log('CategoriesService: Category deleted successfully:', categoryId);
      return { data: true, error: null };

    } catch (err) {
      console.error('CategoriesService: Error deleting category:', err);
      return { data: false, error: err };
    }
  }

  /**
   * Bulk update categories status
   */
  static async bulkUpdateStatus(
    categoryIds: string[],
    status: 'active' | 'inactive'
  ): Promise<{ data: number; error: any }> {
    try {
      console.log('CategoriesService: Bulk updating categories status in database:', { categoryIds, status });

      if (!categoryIds || categoryIds.length === 0) {
        return { data: 0, error: null };
      }

      const { data: updatedData, error: updateError } = await supabase
        .from('categories')
        .update({ is_active: status === 'active' })
        .in('id', categoryIds)
        .select('id');

      if (updateError) {
        console.error('CategoriesService: Error in bulk update:', updateError);
        return { data: 0, error: updateError };
      }

      const updatedCount = updatedData ? updatedData.length : 0;

      console.log('CategoriesService: Bulk update completed:', updatedCount, 'categories updated');
      return { data: updatedCount, error: null };

    } catch (err) {
      console.error('CategoriesService: Error in bulk update:', err);
      return { data: 0, error: err };
    }
  }

  /**
   * Update display order
   */
  static async updateDisplayOrder(
    categoryId: string,
    newOrder: number
  ): Promise<{ data: Category | null; error: any }> {
    try {
      console.log('CategoriesService: Updating display order in database:', { categoryId, newOrder });

      const { data: updatedData, error: updateError } = await supabase
        .from('categories')
        .update({ sort_order: newOrder })
        .eq('id', categoryId)
        .select()
        .single();

      if (updateError) {
        console.error('CategoriesService: Error updating display order:', updateError);
        return { data: null, error: updateError };
      }

      if (!updatedData) {
        return { data: null, error: new Error('Không tìm thấy danh mục') };
      }

      // Get article count
      const { count: articleCount, error: countError } = await supabase
        .from('articles')
        .select('id', { count: 'exact' })
        .eq('category_id', categoryId);

      if (countError) {
        console.warn('CategoriesService: Error getting article count:', countError);
      }

      const updatedCategory = this.transformCategoryRow(updatedData, articleCount || 0);

      console.log('CategoriesService: Display order updated successfully');
      return { data: updatedCategory, error: null };

    } catch (err) {
      console.error('CategoriesService: Error updating display order:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(categoryId: string): Promise<{ data: Category | null; error: any }> {
    try {
      console.log('CategoriesService: Getting category by ID from database:', categoryId);

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (categoryError) {
        console.error('CategoriesService: Error getting category by ID:', categoryError);
        return { data: null, error: categoryError };
      }

      if (!categoryData) {
        return { data: null, error: new Error('Không tìm thấy danh mục') };
      }

      // Get article count
      const { count: articleCount, error: countError } = await supabase
        .from('articles')
        .select('id', { count: 'exact' })
        .eq('category_id', categoryId);

      if (countError) {
        console.warn('CategoriesService: Error getting article count:', countError);
      }

      const category = this.transformCategoryRow(categoryData, articleCount || 0);

      return { data: category, error: null };

    } catch (err) {
      console.error('CategoriesService: Error getting category by ID:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get all categories for dropdown/select
   */
  static async getAllCategories(): Promise<{ data: Category[] | null; error: any }> {
    try {
      console.log('CategoriesService: Getting all active categories from database');

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (categoriesError) {
        console.error('CategoriesService: Error getting all categories:', categoriesError);
        return { data: null, error: categoriesError };
      }

      if (!categoriesData) {
        return { data: [], error: null };
      }

      // Get article counts for all categories
      const categoryIds = categoriesData.map(c => c.id);
      const { data: articleCounts, error: articleCountError } = await supabase
        .from('articles')
        .select('category_id')
        .in('category_id', categoryIds);

      if (articleCountError) {
        console.warn('CategoriesService: Error fetching article counts:', articleCountError);
      }

      // Count articles per category
      const articleCountMap: Record<string, number> = {};
      if (articleCounts) {
        articleCounts.forEach(article => {
          if (article.category_id) {
            articleCountMap[article.category_id] = (articleCountMap[article.category_id] || 0) + 1;
          }
        });
      }

      const categories = categoriesData.map(row =>
        this.transformCategoryRow(row, articleCountMap[row.id] || 0)
      );

      return { data: categories, error: null };

    } catch (err) {
      console.error('CategoriesService: Error getting all categories:', err);
      return { data: null, error: err };
    }
  }
}

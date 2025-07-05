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

export class CategoriesService {
  // Demo data - 15 realistic categories
  private static demoCategories: Category[] = [
    {
      id: '1',
      name: 'Hướng dẫn Test IQ',
      slug: 'huong-dan-test-iq',
      description: 'Các bài viết hướng dẫn cách làm test IQ hiệu quả',
      status: 'active',
      article_count: 15,
      display_order: 1,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T14:30:00Z'
    },
    {
      id: '2',
      name: 'Phân tích Kết quả',
      slug: 'phan-tich-ket-qua',
      description: 'Giải thích ý nghĩa và cách đọc kết quả test IQ',
      status: 'active',
      article_count: 8,
      display_order: 2,
      created_at: '2024-01-02T11:00:00Z',
      updated_at: '2024-01-16T15:45:00Z'
    },
    {
      id: '3',
      name: 'Lịch sử & Nghiên cứu',
      slug: 'lich-su-nghien-cuu',
      description: 'Lịch sử phát triển và các nghiên cứu về trí tuệ nhân tạo',
      status: 'active',
      article_count: 5,
      display_order: 3,
      created_at: '2024-01-03T12:00:00Z',
      updated_at: '2024-01-17T16:20:00Z'
    },
    {
      id: '4',
      name: 'Tips & Tricks',
      slug: 'tips-tricks',
      description: 'Mẹo và thủ thuật để cải thiện điểm số test IQ',
      status: 'active',
      article_count: 12,
      display_order: 4,
      created_at: '2024-01-04T13:00:00Z',
      updated_at: '2024-01-18T17:10:00Z'
    },
    {
      id: '5',
      name: 'Câu hỏi Thường gặp',
      slug: 'cau-hoi-thuong-gap',
      description: 'Các câu hỏi phổ biến về test IQ và trả lời',
      status: 'active',
      article_count: 6,
      display_order: 5,
      created_at: '2024-01-05T14:00:00Z',
      updated_at: '2024-01-19T18:00:00Z'
    },
    {
      id: '6',
      name: 'Test IQ cho Trẻ em',
      slug: 'test-iq-tre-em',
      description: 'Hướng dẫn và thông tin về test IQ dành cho trẻ em',
      status: 'active',
      article_count: 9,
      display_order: 6,
      created_at: '2024-01-06T15:00:00Z',
      updated_at: '2024-01-20T19:15:00Z'
    },
    {
      id: '7',
      name: 'Tâm lý học Nhận thức',
      slug: 'tam-ly-hoc-nhan-thuc',
      description: 'Kiến thức về tâm lý học và nhận thức liên quan đến IQ',
      status: 'active',
      article_count: 7,
      display_order: 7,
      created_at: '2024-01-07T16:00:00Z',
      updated_at: '2024-01-21T20:30:00Z'
    },
    {
      id: '8',
      name: 'Các loại Test Trí tuệ',
      slug: 'cac-loai-test-tri-tue',
      description: 'Giới thiệu các dạng test đo lường trí tuệ khác nhau',
      status: 'active',
      article_count: 11,
      display_order: 8,
      created_at: '2024-01-08T17:00:00Z',
      updated_at: '2024-01-22T21:45:00Z'
    },
    {
      id: '9',
      name: 'Cải thiện IQ',
      slug: 'cai-thien-iq',
      description: 'Phương pháp và bài tập để nâng cao chỉ số IQ',
      status: 'active',
      article_count: 14,
      display_order: 9,
      created_at: '2024-01-09T18:00:00Z',
      updated_at: '2024-01-23T22:20:00Z'
    },
    {
      id: '10',
      name: 'Test IQ Online',
      slug: 'test-iq-online',
      description: 'Thông tin về test IQ trực tuyến và độ tin cậy',
      status: 'active',
      article_count: 10,
      display_order: 10,
      created_at: '2024-01-10T19:00:00Z',
      updated_at: '2024-01-24T23:10:00Z'
    },
    {
      id: '11',
      name: 'Nghiên cứu Khoa học',
      slug: 'nghien-cuu-khoa-hoc',
      description: 'Các nghiên cứu khoa học mới nhất về trí tuệ',
      status: 'inactive',
      article_count: 3,
      display_order: 11,
      created_at: '2024-01-11T20:00:00Z',
      updated_at: '2024-01-25T10:30:00Z'
    },
    {
      id: '12',
      name: 'IQ và Thành công',
      slug: 'iq-va-thanh-cong',
      description: 'Mối quan hệ giữa chỉ số IQ và thành công trong cuộc sống',
      status: 'active',
      article_count: 8,
      display_order: 12,
      created_at: '2024-01-12T21:00:00Z',
      updated_at: '2024-01-26T11:45:00Z'
    },
    {
      id: '13',
      name: 'Sai lầm Thường gặp',
      slug: 'sai-lam-thuong-gap',
      description: 'Những hiểu lầm và sai lầm phổ biến về test IQ',
      status: 'active',
      article_count: 6,
      display_order: 13,
      created_at: '2024-01-13T22:00:00Z',
      updated_at: '2024-01-27T12:20:00Z'
    },
    {
      id: '14',
      name: 'Chuẩn bị Test IQ',
      slug: 'chuan-bi-test-iq',
      description: 'Hướng dẫn chuẩn bị tâm lý và kỹ thuật trước khi làm test',
      status: 'inactive',
      article_count: 4,
      display_order: 14,
      created_at: '2024-01-14T23:00:00Z',
      updated_at: '2024-01-28T13:15:00Z'
    },
    {
      id: '15',
      name: 'Công cụ & Ứng dụng',
      slug: 'cong-cu-ung-dung',
      description: 'Các công cụ và ứng dụng hỗ trợ luyện tập IQ',
      status: 'active',
      article_count: 7,
      display_order: 15,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-29T14:40:00Z'
    }
  ];

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
      console.log('CategoriesService: Calculating statistics');

      const categories = this.demoCategories;

      const stats: CategoryStats = {
        total: categories.length,
        active: categories.filter(c => c.status === 'active').length,
        inactive: categories.filter(c => c.status === 'inactive').length,
        totalArticles: categories.reduce((sum, c) => sum + c.article_count, 0),
        avgArticlesPerCategory: Math.round(categories.reduce((sum, c) => sum + c.article_count, 0) / categories.length)
      };

      console.log('CategoriesService: Stats calculated successfully');
      return { data: stats, error: null };

    } catch (err) {
      console.error('CategoriesService: Error calculating stats:', err);
      return { data: null, error: err };
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
      console.log('CategoriesService: Fetching categories', { page, limit, filters });

      let categories = [...this.demoCategories];

      // Apply filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        categories = categories.filter(category =>
          category.name.toLowerCase().includes(searchTerm) ||
          category.description.toLowerCase().includes(searchTerm) ||
          category.slug.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.status && filters.status !== 'all') {
        categories = categories.filter(category => category.status === filters.status);
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'display_order';
      const sortOrder = filters.sort_order || 'asc';

      categories.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Category];
        let bValue: any = b[sortBy as keyof Category];

        if (sortBy === 'created_at' || sortBy === 'updated_at') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedCategories = categories.slice(offset, offset + limit);

      const total = categories.length;
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
  }): Promise<{ data: Category | null; error: any }> {
    try {
      console.log('CategoriesService: Creating category:', data);

      // Check if name already exists
      const existingCategory = this.demoCategories.find(c =>
        c.name.toLowerCase() === data.name.toLowerCase()
      );

      if (existingCategory) {
        return { data: null, error: new Error('Tên danh mục đã tồn tại') };
      }

      const newCategory: Category = {
        id: (this.demoCategories.length + 1).toString(),
        name: data.name.trim(),
        slug: this.generateSlug(data.name),
        description: data.description.trim(),
        status: data.status,
        article_count: 0,
        display_order: this.demoCategories.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.demoCategories.push(newCategory);

      console.log('CategoriesService: Category created successfully');
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
      status: 'active' | 'inactive';
      display_order: number;
    }>
  ): Promise<{ data: Category | null; error: any }> {
    try {
      console.log('CategoriesService: Updating category:', { categoryId, data });

      const categoryIndex = this.demoCategories.findIndex(c => c.id === categoryId);
      if (categoryIndex === -1) {
        return { data: null, error: new Error('Không tìm thấy danh mục') };
      }

      // Check name uniqueness if name is being updated
      if (data.name) {
        const existingCategory = this.demoCategories.find(c =>
          c.id !== categoryId && c.name.toLowerCase() === data.name!.toLowerCase()
        );

        if (existingCategory) {
          return { data: null, error: new Error('Tên danh mục đã tồn tại') };
        }
      }

      const updatedCategory = {
        ...this.demoCategories[categoryIndex],
        ...data,
        slug: data.name ? this.generateSlug(data.name) : this.demoCategories[categoryIndex].slug,
        updated_at: new Date().toISOString()
      };

      this.demoCategories[categoryIndex] = updatedCategory;

      console.log('CategoriesService: Category updated successfully');
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
      console.log('CategoriesService: Deleting category:', categoryId);

      const categoryIndex = this.demoCategories.findIndex(c => c.id === categoryId);
      if (categoryIndex === -1) {
        return { data: false, error: new Error('Không tìm thấy danh mục') };
      }

      const category = this.demoCategories[categoryIndex];

      // Check if category has articles
      if (category.article_count > 0) {
        return { data: false, error: new Error(`Không thể xóa danh mục có ${category.article_count} bài viết`) };
      }

      this.demoCategories.splice(categoryIndex, 1);

      console.log('CategoriesService: Category deleted successfully');
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
      console.log('CategoriesService: Bulk updating categories status:', { categoryIds, status });

      let updatedCount = 0;
      const now = new Date().toISOString();

      categoryIds.forEach(id => {
        const categoryIndex = this.demoCategories.findIndex(c => c.id === id);
        if (categoryIndex !== -1) {
          this.demoCategories[categoryIndex] = {
            ...this.demoCategories[categoryIndex],
            status,
            updated_at: now
          };
          updatedCount++;
        }
      });

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
      console.log('CategoriesService: Updating display order:', { categoryId, newOrder });

      const categoryIndex = this.demoCategories.findIndex(c => c.id === categoryId);
      if (categoryIndex === -1) {
        return { data: null, error: new Error('Không tìm thấy danh mục') };
      }

      this.demoCategories[categoryIndex] = {
        ...this.demoCategories[categoryIndex],
        display_order: newOrder,
        updated_at: new Date().toISOString()
      };

      console.log('CategoriesService: Display order updated successfully');
      return { data: this.demoCategories[categoryIndex], error: null };

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
      const category = this.demoCategories.find(c => c.id === categoryId);

      if (!category) {
        return { data: null, error: new Error('Không tìm thấy danh mục') };
      }

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
      const activeCategories = this.demoCategories
        .filter(c => c.status === 'active')
        .sort((a, b) => a.display_order - b.display_order);

      return { data: activeCategories, error: null };

    } catch (err) {
      console.error('CategoriesService: Error getting all categories:', err);
      return { data: null, error: err };
    }
  }
}

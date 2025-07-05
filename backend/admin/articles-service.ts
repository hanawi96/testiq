export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  featured_image?: string;
  tags: string[];
  views: number;
  likes: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  seo_title?: string;
  seo_description?: string;
  reading_time: number; // in minutes
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
  sort_by?: 'created_at' | 'updated_at' | 'views' | 'likes' | 'title';
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

export class ArticlesService {
  // Demo data - 20 realistic articles
  private static demoArticles: Article[] = [
    {
      id: '1',
      title: 'Hướng dẫn làm bài test IQ hiệu quả',
      slug: 'huong-dan-lam-bai-test-iq-hieu-qua',
      excerpt: 'Những tips và chiến lược giúp bạn đạt điểm cao trong các bài test IQ',
      content: 'Nội dung chi tiết về cách làm bài test IQ...',
      author: 'Admin',
      status: 'published',
      featured_image: '/images/iq-test-guide.jpg',
      tags: ['IQ Test', 'Hướng dẫn', 'Tips'],
      views: 1250,
      likes: 89,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-16T14:20:00Z',
      published_at: '2024-01-15T10:30:00Z',
      seo_title: 'Hướng dẫn làm bài test IQ hiệu quả - Tips từ chuyên gia',
      seo_description: 'Khám phá những chiến lược và tips hiệu quả để đạt điểm cao trong bài test IQ',
      reading_time: 8
    },
    {
      id: '2',
      title: 'Phân tích kết quả test IQ: Ý nghĩa các mức điểm',
      slug: 'phan-tich-ket-qua-test-iq-y-nghia-cac-muc-diem',
      excerpt: 'Tìm hiểu ý nghĩa của từng mức điểm IQ và cách diễn giải kết quả',
      content: 'Nội dung chi tiết về phân tích kết quả IQ...',
      author: 'Dr. Nguyễn Văn A',
      status: 'published',
      featured_image: '/images/iq-analysis.jpg',
      tags: ['IQ Test', 'Phân tích', 'Kết quả'],
      views: 2100,
      likes: 156,
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-01-12T16:45:00Z',
      published_at: '2024-01-10T09:15:00Z',
      seo_title: 'Phân tích kết quả test IQ - Ý nghĩa các mức điểm',
      seo_description: 'Hiểu rõ ý nghĩa của điểm IQ và cách diễn giải kết quả test một cách chính xác',
      reading_time: 12
    },
    {
      id: '3',
      title: 'Lịch sử và phát triển của test IQ',
      slug: 'lich-su-va-phat-trien-cua-test-iq',
      excerpt: 'Khám phá lịch sử hình thành và phát triển của các bài test đo trí tuệ',
      content: 'Nội dung về lịch sử test IQ...',
      author: 'Prof. Trần Thị B',
      status: 'draft',
      tags: ['Lịch sử', 'IQ Test', 'Giáo dục'],
      views: 0,
      likes: 0,
      created_at: '2024-01-20T11:00:00Z',
      updated_at: '2024-01-22T13:30:00Z',
      reading_time: 15
    },
    {
      id: '4',
      title: 'Các loại test IQ phổ biến hiện nay',
      slug: 'cac-loai-test-iq-pho-bien-hien-nay',
      excerpt: 'Tổng quan về các dạng test IQ khác nhau và đặc điểm của từng loại',
      content: 'Nội dung về các loại test IQ...',
      author: 'Admin',
      status: 'published',
      featured_image: '/images/iq-types.jpg',
      tags: ['IQ Test', 'Phân loại', 'Giáo dục'],
      views: 890,
      likes: 67,
      created_at: '2024-01-08T14:20:00Z',
      updated_at: '2024-01-09T10:15:00Z',
      published_at: '2024-01-08T14:20:00Z',
      seo_title: 'Các loại test IQ phổ biến - So sánh và phân tích',
      seo_description: 'Tìm hiểu về các dạng test IQ khác nhau và lựa chọn phù hợp với nhu cầu',
      reading_time: 10
    },
    {
      id: '5',
      title: 'Cách cải thiện chỉ số IQ của bạn',
      slug: 'cach-cai-thien-chi-so-iq-cua-ban',
      excerpt: 'Những phương pháp khoa học để rèn luyện và nâng cao trí tuệ',
      content: 'Nội dung về cách cải thiện IQ...',
      author: 'Dr. Lê Văn C',
      status: 'published',
      featured_image: '/images/improve-iq.jpg',
      tags: ['Cải thiện', 'IQ', 'Rèn luyện'],
      views: 3200,
      likes: 245,
      created_at: '2024-01-05T08:45:00Z',
      updated_at: '2024-01-07T15:20:00Z',
      published_at: '2024-01-05T08:45:00Z',
      seo_title: 'Cách cải thiện chỉ số IQ hiệu quả - Phương pháp khoa học',
      seo_description: 'Khám phá các phương pháp được chứng minh khoa học để nâng cao trí tuệ',
      reading_time: 14
    },
    {
      id: '6',
      title: 'Test IQ cho trẻ em: Những điều cần biết',
      slug: 'test-iq-cho-tre-em-nhung-dieu-can-biet',
      excerpt: 'Hướng dẫn đánh giá trí tuệ trẻ em một cách chính xác và phù hợp',
      content: 'Nội dung về test IQ trẻ em...',
      author: 'Dr. Phạm Thị D',
      status: 'published',
      tags: ['Trẻ em', 'IQ Test', 'Giáo dục'],
      views: 1800,
      likes: 134,
      created_at: '2024-01-12T16:30:00Z',
      updated_at: '2024-01-14T09:45:00Z',
      published_at: '2024-01-12T16:30:00Z',
      reading_time: 11
    },
    {
      id: '7',
      title: 'Mối quan hệ giữa IQ và thành công trong cuộc sống',
      slug: 'moi-quan-he-giua-iq-va-thanh-cong-trong-cuoc-song',
      excerpt: 'Phân tích tác động của chỉ số IQ đến sự nghiệp và cuộc sống',
      content: 'Nội dung về mối quan hệ IQ và thành công...',
      author: 'Prof. Hoàng Văn E',
      status: 'draft',
      tags: ['IQ', 'Thành công', 'Cuộc sống'],
      views: 0,
      likes: 0,
      created_at: '2024-01-18T12:15:00Z',
      updated_at: '2024-01-20T14:30:00Z',
      reading_time: 16
    },
    {
      id: '8',
      title: 'Những sai lầm thường gặp khi làm test IQ',
      slug: 'nhung-sai-lam-thuong-gap-khi-lam-test-iq',
      excerpt: 'Tránh những lỗi phổ biến để có kết quả test chính xác nhất',
      content: 'Nội dung về sai lầm trong test IQ...',
      author: 'Admin',
      status: 'published',
      featured_image: '/images/iq-mistakes.jpg',
      tags: ['Sai lầm', 'IQ Test', 'Tips'],
      views: 1450,
      likes: 98,
      created_at: '2024-01-14T10:20:00Z',
      updated_at: '2024-01-15T11:30:00Z',
      published_at: '2024-01-14T10:20:00Z',
      reading_time: 9
    },
    {
      id: '9',
      title: 'Test IQ online vs Test IQ truyền thống',
      slug: 'test-iq-online-vs-test-iq-truyen-thong',
      excerpt: 'So sánh ưu nhược điểm của hai phương pháp test IQ',
      content: 'Nội dung so sánh test IQ online và truyền thống...',
      author: 'Dr. Vũ Thị F',
      status: 'published',
      tags: ['Online', 'Truyền thống', 'So sánh'],
      views: 2300,
      likes: 187,
      created_at: '2024-01-06T13:45:00Z',
      updated_at: '2024-01-08T16:20:00Z',
      published_at: '2024-01-06T13:45:00Z',
      reading_time: 13
    },
    {
      id: '10',
      title: 'Chuẩn bị tâm lý trước khi làm test IQ',
      slug: 'chuan-bi-tam-ly-truoc-khi-lam-test-iq',
      excerpt: 'Những bước chuẩn bị tinh thần để đạt kết quả tốt nhất',
      content: 'Nội dung về chuẩn bị tâm lý...',
      author: 'Dr. Ngô Văn G',
      status: 'archived',
      tags: ['Tâm lý', 'Chuẩn bị', 'IQ Test'],
      views: 750,
      likes: 45,
      created_at: '2023-12-20T09:30:00Z',
      updated_at: '2023-12-22T14:15:00Z',
      published_at: '2023-12-20T09:30:00Z',
      reading_time: 7
    }
  ];

  /**
   * Get articles statistics
   */
  static async getStats(): Promise<{ data: ArticleStats | null; error: any }> {
    try {
      console.log('ArticlesService: Calculating statistics');

      const articles = this.demoArticles;
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: ArticleStats = {
        total: articles.length,
        published: articles.filter(a => a.status === 'published').length,
        draft: articles.filter(a => a.status === 'draft').length,
        archived: articles.filter(a => a.status === 'archived').length,
        totalViews: articles.reduce((sum, a) => sum + a.views, 0),
        avgReadingTime: Math.round(articles.reduce((sum, a) => sum + a.reading_time, 0) / articles.length),
        recentArticles: articles.filter(a => new Date(a.created_at) > weekAgo).length
      };

      console.log('ArticlesService: Stats calculated successfully');
      return { data: stats, error: null };

    } catch (err) {
      console.error('ArticlesService: Error calculating stats:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get articles with pagination and filters
   */
  static async getArticles(
    page: number = 1,
    limit: number = 10,
    filters: ArticlesFilters = {}
  ): Promise<{ data: ArticlesListResponse | null; error: any }> {
    try {
      console.log('ArticlesService: Fetching articles', { page, limit, filters });

      let articles = [...this.demoArticles];

      // Apply filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        articles = articles.filter(article =>
          article.title.toLowerCase().includes(searchTerm) ||
          article.excerpt.toLowerCase().includes(searchTerm) ||
          article.author.toLowerCase().includes(searchTerm) ||
          article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (filters.status && filters.status !== 'all') {
        articles = articles.filter(article => article.status === filters.status);
      }

      if (filters.author) {
        articles = articles.filter(article => 
          article.author.toLowerCase().includes(filters.author!.toLowerCase())
        );
      }

      if (filters.tag) {
        articles = articles.filter(article =>
          article.tags.some(tag => tag.toLowerCase().includes(filters.tag!.toLowerCase()))
        );
      }

      if (filters.date_from) {
        articles = articles.filter(article => 
          new Date(article.created_at) >= new Date(filters.date_from!)
        );
      }

      if (filters.date_to) {
        articles = articles.filter(article => 
          new Date(article.created_at) <= new Date(filters.date_to!)
        );
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'desc';

      articles.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Article];
        let bValue: any = b[sortBy as keyof Article];

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
      const paginatedArticles = articles.slice(offset, offset + limit);

      const total = articles.length;
      const totalPages = Math.ceil(total / limit);

      const response: ArticlesListResponse = {
        articles: paginatedArticles,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      console.log('ArticlesService: Articles fetched successfully:', {
        returned: paginatedArticles.length,
        total,
        page,
        totalPages
      });

      return { data: response, error: null };

    } catch (err) {
      console.error('ArticlesService: Error fetching articles:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update article status
   */
  static async updateStatus(
    articleId: string, 
    status: 'published' | 'draft' | 'archived'
  ): Promise<{ data: Article | null; error: any }> {
    try {
      console.log('ArticlesService: Updating article status:', { articleId, status });

      const articleIndex = this.demoArticles.findIndex(a => a.id === articleId);
      if (articleIndex === -1) {
        return { data: null, error: new Error('Article not found') };
      }

      this.demoArticles[articleIndex] = {
        ...this.demoArticles[articleIndex],
        status,
        updated_at: new Date().toISOString(),
        published_at: status === 'published' ? new Date().toISOString() : this.demoArticles[articleIndex].published_at
      };

      console.log('ArticlesService: Article status updated successfully');
      return { data: this.demoArticles[articleIndex], error: null };

    } catch (err) {
      console.error('ArticlesService: Error updating article status:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Delete article
   */
  static async deleteArticle(articleId: string): Promise<{ data: boolean; error: any }> {
    try {
      console.log('ArticlesService: Deleting article:', articleId);

      const articleIndex = this.demoArticles.findIndex(a => a.id === articleId);
      if (articleIndex === -1) {
        return { data: false, error: new Error('Article not found') };
      }

      this.demoArticles.splice(articleIndex, 1);

      console.log('ArticlesService: Article deleted successfully');
      return { data: true, error: null };

    } catch (err) {
      console.error('ArticlesService: Error deleting article:', err);
      return { data: false, error: err };
    }
  }

  /**
   * Bulk update articles status
   */
  static async bulkUpdateStatus(
    articleIds: string[], 
    status: 'published' | 'draft' | 'archived'
  ): Promise<{ data: number; error: any }> {
    try {
      console.log('ArticlesService: Bulk updating articles status:', { articleIds, status });

      let updatedCount = 0;
      const now = new Date().toISOString();

      articleIds.forEach(id => {
        const articleIndex = this.demoArticles.findIndex(a => a.id === id);
        if (articleIndex !== -1) {
          this.demoArticles[articleIndex] = {
            ...this.demoArticles[articleIndex],
            status,
            updated_at: now,
            published_at: status === 'published' ? now : this.demoArticles[articleIndex].published_at
          };
          updatedCount++;
        }
      });

      console.log('ArticlesService: Bulk update completed:', updatedCount, 'articles updated');
      return { data: updatedCount, error: null };

    } catch (err) {
      console.error('ArticlesService: Error in bulk update:', err);
      return { data: 0, error: err };
    }
  }

  /**
   * Get unique authors
   */
  static getAuthors(): string[] {
    const authors = [...new Set(this.demoArticles.map(a => a.author))];
    return authors.sort();
  }

  /**
   * Get unique tags
   */
  static getTags(): string[] {
    const tags = [...new Set(this.demoArticles.flatMap(a => a.tags))];
    return tags.sort();
  }
}

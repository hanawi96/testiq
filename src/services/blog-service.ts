import { supabase } from '../../backend/config/supabase';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorAvatar: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  image: string;
  imageAlt: string;
  featured: boolean;
}

// Cache để tránh duplicate queries
let articlesCache: BlogPost[] | null = null;
let categoriesCache: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

export class BlogService {
  /**
   * Kiểm tra cache có hợp lệ không
   */
  private static isCacheValid(): boolean {
    return articlesCache !== null &&
           Date.now() - cacheTimestamp < CACHE_DURATION;
  }

  /**
   * Lấy danh sách bài viết published cho trang blog (với caching)
   */
  static async getPublishedArticles(): Promise<BlogPost[]> {
    // Kiểm tra cache trước
    if (this.isCacheValid()) {
      console.log('BlogService: Using cached articles');
      return articlesCache!;
    }

    try {
      console.log('BlogService: Fetching fresh articles from database...');

      // Optimized query - lấy articles trước, sau đó join manual để tránh lỗi FK
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          slug,
          excerpt,
          content,
          author_id,
          featured,
          cover_image,
          cover_image_alt,
          reading_time,
          created_at,
          updated_at,
          published_at,
          status
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50);

      if (articlesError) {
        console.error('BlogService: Error fetching articles:', articlesError);
        return [];
      }

      console.log(`BlogService: Found ${articles?.length || 0} published articles`);

      if (!articles || articles.length === 0) {
        console.log('BlogService: No published articles found');
        return [];
      }

      const articleIds = articles.map(article => article.id);
      const authorIds = [...new Set(articles.map(a => a.author_id).filter(Boolean))];

      // Parallel queries cho related data
      const [authorsResult, categoriesResult, tagsResult] = await Promise.all([
        // Lấy thông tin authors
        authorIds.length > 0 ? supabase
          .from('user_profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', authorIds) : Promise.resolve({ data: [] }),

        // Lấy categories
        supabase
          .from('article_categories')
          .select(`
            article_id,
            categories (
              id,
              name,
              slug
            )
          `)
          .in('article_id', articleIds),

        // Lấy tags
        supabase
          .from('article_tags')
          .select(`
            article_id,
            tags (
              id,
              name,
              slug
            )
          `)
          .in('article_id', articleIds)
      ]);

      // Check for errors in related data queries
      if (authorsResult.error) {
        console.error('BlogService: Error fetching authors:', authorsResult.error);
      }
      if (categoriesResult.error) {
        console.error('BlogService: Error fetching categories:', categoriesResult.error);
      }
      if (tagsResult.error) {
        console.error('BlogService: Error fetching tags:', tagsResult.error);
      }

      // Tạo lookup maps
      const authorsMap = new Map();
      authorsResult.data?.forEach(author => {
        authorsMap.set(author.id, author);
      });

      const categoriesMap = new Map();
      categoriesResult.data?.forEach(item => {
        if (!categoriesMap.has(item.article_id)) {
          categoriesMap.set(item.article_id, []);
        }
        categoriesMap.get(item.article_id).push(item.categories);
      });

      const tagsMap = new Map();
      tagsResult.data?.forEach(item => {
        if (!tagsMap.has(item.article_id)) {
          tagsMap.set(item.article_id, []);
        }
        tagsMap.get(item.article_id).push(item.tags);
      });



      // Transform dữ liệu
      const blogPosts: BlogPost[] = articles.map((article, index) => {
        const author = authorsMap.get(article.author_id);
        const categories = categoriesMap.get(article.id) || [];
        const tags = tagsMap.get(article.id) || [];

        // Tạo author avatar từ tên
        const getAuthorAvatar = (name: string) => {
          if (!name) return 'UN';
          const words = name.split(' ');
          if (words.length >= 2) {
            return words[0][0] + words[words.length - 1][0];
          }
          return name.substring(0, 2);
        };

        // Format ngày tháng
        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        };

        // Format reading time
        const formatReadingTime = (minutes: number) => {
          return minutes ? `${minutes} phút đọc` : '5 phút đọc';
        };

        const authorName = author?.full_name || 'Tác giả';

        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt || 'Nội dung thú vị đang chờ bạn khám phá...',
          content: article.content,
          author: authorName,
          authorAvatar: getAuthorAvatar(authorName),
          date: formatDate(article.published_at || article.created_at),
          readTime: formatReadingTime(article.reading_time),
          category: categories.length > 0 ? categories[0].name : 'Chung',
          tags: tags.map(tag => tag.name),
          image: article.cover_image || '/api/placeholder/400/240',
          imageAlt: article.cover_image_alt || article.title,
          featured: article.featured || false
        };
      });

      // Đảm bảo chỉ có 1 bài viết featured (bài mới nhất nếu không có bài nào featured)
      const featuredArticles = blogPosts.filter(post => post.featured);

      if (featuredArticles.length === 0 && blogPosts.length > 0) {
        // Nếu không có bài nào featured, chọn bài mới nhất làm featured
        blogPosts[0].featured = true;
        console.log(`BlogService: Set first article as featured: ${blogPosts[0].title}`);
      } else if (featuredArticles.length > 1) {
        // Nếu có nhiều hơn 1 bài featured, chỉ giữ lại bài đầu tiên
        blogPosts.forEach((post, index) => {
          if (post.featured && index > 0) {
            const firstFeaturedIndex = blogPosts.findIndex(p => p.featured);
            if (index !== firstFeaturedIndex) {
              post.featured = false;
            }
          }
        });
        console.log(`BlogService: Limited to 1 featured article: ${featuredArticles[0].title}`);
      }

      // Cache kết quả
      articlesCache = blogPosts;
      cacheTimestamp = Date.now();

      console.log(`BlogService: Successfully fetched and cached ${blogPosts.length} articles`);
      return blogPosts;

    } catch (error) {
      console.error('BlogService: Error in getPublishedArticles:', error);
      return [];
    }
  }

  /**
   * Lấy bài viết featured (sử dụng cache)
   */
  static async getFeaturedArticles(): Promise<BlogPost[]> {
    const allArticles = await this.getPublishedArticles();
    return allArticles.filter(article => article.featured);
  }

  /**
   * Lấy bài viết không featured (sử dụng cache)
   */
  static async getRegularArticles(): Promise<BlogPost[]> {
    const allArticles = await this.getPublishedArticles();
    return allArticles.filter(article => !article.featured);
  }

  /**
   * Lấy danh sách categories unique (với cache riêng)
   */
  static async getCategories(): Promise<string[]> {
    // Kiểm tra cache categories
    if (categoriesCache !== null && this.isCacheValid()) {
      console.log('BlogService: Using cached categories');
      return categoriesCache;
    }

    const allArticles = await this.getPublishedArticles();
    const categories = [...new Set(allArticles.map(post => post.category))];

    // Cache categories
    categoriesCache = categories.sort();
    console.log('BlogService: Cached categories');

    return categoriesCache;
  }

  /**
   * Lấy tất cả data cần thiết cho blog trong 1 lần gọi
   */
  static async getBlogData(): Promise<{
    allArticles: BlogPost[];
    featuredArticles: BlogPost[];
    regularArticles: BlogPost[];
    categories: string[];
  }> {
    const allArticles = await this.getPublishedArticles();
    const featuredArticles = allArticles.filter(article => article.featured);
    const regularArticles = allArticles.filter(article => !article.featured);
    const categories = [...new Set(allArticles.map(post => post.category))].sort();



    return {
      allArticles,
      featuredArticles,
      regularArticles,
      categories
    };
  }
}

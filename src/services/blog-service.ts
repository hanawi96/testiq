import { supabase } from '../../backend/config/supabase';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorAvatar: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  image: string;
  featured: boolean;
}

export class BlogService {
  /**
   * Lấy danh sách bài viết published cho trang blog
   */
  static async getPublishedArticles(): Promise<BlogPost[]> {
    try {
      console.log('BlogService: Fetching published articles...');

      // Lấy articles với status published
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
          reading_time,
          view_count,
          created_at,
          updated_at,
          published_at
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50);

      if (articlesError) {
        console.error('BlogService: Error fetching articles:', articlesError);
        return [];
      }

      if (!articles || articles.length === 0) {
        console.log('BlogService: No published articles found');
        return [];
      }

      const articleIds = articles.map(article => article.id);

      // Lấy thông tin tác giả, categories và tags song song
      const [authorsResult, categoriesResult, tagsResult] = await Promise.all([
        // Lấy thông tin tác giả
        supabase
          .from('user_profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', articles.map(a => a.author_id).filter(Boolean)),

        // Lấy categories cho articles
        supabase
          .from('article_categories')
          .select(`
            article_id,
            categories:category_id (
              id,
              name,
              slug
            )
          `)
          .in('article_id', articleIds),

        // Lấy tags cho articles
        supabase
          .from('article_tags')
          .select(`
            article_id,
            tags:tag_id (
              id,
              name,
              slug
            )
          `)
          .in('article_id', articleIds)
      ]);

      // Tạo maps để lookup nhanh
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
          excerpt: article.excerpt || 'Nội dung thú vị đang chờ bạn khám phá...',
          content: article.content,
          author: authorName,
          authorAvatar: getAuthorAvatar(authorName),
          date: formatDate(article.published_at || article.created_at),
          readTime: formatReadingTime(article.reading_time),
          category: categories.length > 0 ? categories[0].name : 'Chung',
          tags: tags.map(tag => tag.name),
          image: article.cover_image || '/api/placeholder/400/240',
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

      console.log(`BlogService: Successfully fetched ${blogPosts.length} articles`);
      return blogPosts;

    } catch (error) {
      console.error('BlogService: Error in getPublishedArticles:', error);
      return [];
    }
  }

  /**
   * Lấy bài viết featured
   */
  static async getFeaturedArticles(): Promise<BlogPost[]> {
    const allArticles = await this.getPublishedArticles();
    return allArticles.filter(article => article.featured);
  }

  /**
   * Lấy bài viết không featured
   */
  static async getRegularArticles(): Promise<BlogPost[]> {
    const allArticles = await this.getPublishedArticles();
    return allArticles.filter(article => !article.featured);
  }

  /**
   * Lấy danh sách categories unique
   */
  static async getCategories(): Promise<string[]> {
    const allArticles = await this.getPublishedArticles();
    const categories = [...new Set(allArticles.map(post => post.category))];
    return categories.sort();
  }
}

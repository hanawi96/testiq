import React from 'react';

// Mock data for demo
const mockArticle = {
  id: '1',
  title: 'Hướng dẫn hoàn chỉnh về React Hooks: Từ cơ bản đến nâng cao',
  slug: 'huong-dan-hoan-chinh-react-hooks',
  excerpt: 'Khám phá sức mạnh của React Hooks và cách sử dụng chúng để xây dựng ứng dụng React hiện đại, hiệu quả và dễ bảo trì.',
  content: `
    <h2>Giới thiệu về React Hooks</h2>
    <p>React Hooks là một tính năng mạnh mẽ được giới thiệu trong React 16.8, cho phép bạn sử dụng state và các tính năng khác của React mà không cần viết class component.</p>
    
    <h3>Tại sao nên sử dụng Hooks?</h3>
    <ul>
      <li><strong>Code ngắn gọn hơn:</strong> Functional components với hooks thường ngắn hơn class components</li>
      <li><strong>Dễ test:</strong> Logic được tách biệt và có thể test độc lập</li>
      <li><strong>Tái sử dụng logic:</strong> Custom hooks cho phép chia sẻ logic giữa các components</li>
      <li><strong>Performance tốt hơn:</strong> Tối ưu hóa re-render hiệu quả</li>
    </ul>

    <h3>Các Hook cơ bản</h3>
    <h4>1. useState Hook</h4>
    <p>useState là hook cơ bản nhất, cho phép bạn thêm state vào functional component:</p>
    
    <pre><code>import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    &lt;div&gt;
      &lt;p&gt;Bạn đã click {count} lần&lt;/p&gt;
      &lt;button onClick={() =&gt; setCount(count + 1)}&gt;
        Click me
      &lt;/button&gt;
    &lt;/div&gt;
  );
}</code></pre>

    <h4>2. useEffect Hook</h4>
    <p>useEffect cho phép bạn thực hiện side effects trong functional components:</p>
    
    <pre><code>import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() =&gt; {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return user ? &lt;div&gt;{user.name}&lt;/div&gt; : &lt;div&gt;Loading...&lt;/div&gt;;
}</code></pre>

    <h3>Custom Hooks</h3>
    <p>Custom hooks cho phép bạn tái sử dụng logic state giữa các components:</p>
    
    <pre><code>function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () =&gt; setCount(count + 1);
  const decrement = () =&gt; setCount(count - 1);
  const reset = () =&gt; setCount(initialValue);

  return { count, increment, decrement, reset };
}</code></pre>

    <h3>Best Practices</h3>
    <ol>
      <li><strong>Luôn sử dụng dependency array:</strong> Trong useEffect, hãy luôn khai báo dependencies</li>
      <li><strong>Tách logic phức tạp:</strong> Sử dụng custom hooks cho logic phức tạp</li>
      <li><strong>Tối ưu performance:</strong> Sử dụng useMemo và useCallback khi cần thiết</li>
      <li><strong>Tuân thủ Rules of Hooks:</strong> Chỉ gọi hooks ở top level của function</li>
    </ol>

    <h3>Kết luận</h3>
    <p>React Hooks đã thay đổi cách chúng ta viết React components, mang lại nhiều lợi ích về performance, khả năng tái sử dụng và maintainability. Hãy bắt đầu áp dụng hooks vào dự án của bạn ngay hôm nay!</p>
  `,
  author: {
    name: 'Nguyễn Văn An',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    bio: 'Senior Frontend Developer với 5+ năm kinh nghiệm React'
  },
  category: {
    name: 'Lập trình',
    slug: 'lap-trinh',
    color: '#3B82F6'
  },
  tags: [
    { name: 'React', slug: 'react', color: '#61DAFB' },
    { name: 'JavaScript', slug: 'javascript', color: '#F7DF1E' },
    { name: 'Frontend', slug: 'frontend', color: '#FF6B6B' },
    { name: 'Hooks', slug: 'hooks', color: '#4ECDC4' }
  ],
  publishedAt: '2024-01-15T10:30:00Z',
  readingTime: 8,
  views: 1247,
  likes: 89,
  featuredImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=600&fit=crop',
  isLiked: false
};

export default function ArticleDetail() {
  const [isLiked, setIsLiked] = React.useState(mockArticle.isLiked);
  const [likes, setLikes] = React.useState(mockArticle.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-8 pt-6">
        <a href="/blog" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Blog
        </a>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <a
          href={`/blog/category/${mockArticle.category.slug}`}
          className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          {mockArticle.category.name}
        </a>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 dark:text-gray-100">{mockArticle.title}</span>
      </nav>

      {/* Article Header */}
      <header className="mb-10">
        {/* Category Badge */}
        <div className="mb-4">
          <span 
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: mockArticle.category.color }}
          >
            {mockArticle.category.name}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4">
          {mockArticle.title}
        </h1>

        {/* Excerpt */}
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          {mockArticle.excerpt}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(mockArticle.publishedAt)}</span>
          </div>

          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{mockArticle.readingTime} phút đọc</span>
          </div>

          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{mockArticle.views.toLocaleString()} lượt xem</span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="mb-8">
        <img
          src={mockArticle.featuredImage}
          alt={mockArticle.title}
          className="w-full h-64 md:h-96 object-cover rounded-xl shadow-lg"
        />
      </div>

      {/* Article Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: mockArticle.content }}
        />
      </div>

      {/* Tags */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {mockArticle.tags.map((tag) => (
            <a
              key={tag.slug}
              href={`/blog/tag/${tag.slug}`}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white hover:opacity-80 transition-opacity"
              style={{ backgroundColor: tag.color }}
            >
              #{tag.name}
            </a>
          ))}
        </div>
      </div>

      {/* Article Actions */}
      <div className="flex items-center justify-between py-6 border-t border-b border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isLiked
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{likes}</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Chia sẻ</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Lưu</span>
          </button>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Cập nhật lần cuối: {formatDate(mockArticle.publishedAt)}
        </div>
      </div>

      {/* Author Bio */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8">
        <div className="flex items-start space-x-4">
          <img
            src={mockArticle.author.avatar}
            alt={mockArticle.author.name}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Về tác giả: {mockArticle.author.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {mockArticle.author.bio}. Chuyên gia trong lĩnh vực phát triển web với nhiều năm kinh nghiệm
              làm việc tại các công ty công nghệ hàng đầu. Đam mê chia sẻ kiến thức và giúp đỡ cộng đồng developer Việt Nam.
            </p>
            <div className="flex space-x-3">
              <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm">
                Xem thêm bài viết
              </button>
              <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm">
                Theo dõi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Bài viết liên quan</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <article key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              <img
                src={`https://images.unsplash.com/photo-163335612254${i}?w=400&h=200&fit=crop`}
                alt={`Bài viết liên quan ${i}`}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <span
                  className="inline-block px-2 py-1 rounded text-xs font-medium text-white mb-2"
                  style={{ backgroundColor: mockArticle.category.color }}
                >
                  {mockArticle.category.name}
                </span>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  Hướng dẫn sử dụng React Context API hiệu quả {i}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  Tìm hiểu cách sử dụng Context API để quản lý state global trong ứng dụng React...
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>5 phút đọc</span>
                  <span>2 ngày trước</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Bình luận (12)</h3>

        {/* Comment Form */}
        <div className="mb-8">
          <textarea
            placeholder="Viết bình luận của bạn..."
            className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            rows={4}
          />
          <div className="flex justify-end mt-3">
            <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
              Gửi bình luận
            </button>
          </div>
        </div>

        {/* Sample Comments */}
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex space-x-4">
              <img
                src={`https://images.unsplash.com/photo-147209978${i}785?w=40&h=40&fit=crop&crop=face`}
                alt={`User ${i}`}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Người dùng {i}</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">2 giờ trước</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    Bài viết rất hữu ích! Tôi đã áp dụng được những kiến thức này vào dự án của mình.
                    Cảm ơn tác giả đã chia sẻ.
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <button className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                    Thích (5)
                  </button>
                  <button className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                    Trả lời
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

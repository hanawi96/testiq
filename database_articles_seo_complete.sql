-- ==========================================
-- SUPABASE SQL: ARTICLES TABLE - SEO PROFESSIONAL
-- Thiết kế bởi chuyên gia SEO 10 năm kinh nghiệm
-- ==========================================

-- 1. TẠO ENUM TYPES
CREATE TYPE article_status AS ENUM ('draft', 'review', 'published', 'archived', 'scheduled');
CREATE TYPE article_type AS ENUM ('article', 'page', 'post', 'guide', 'tutorial', 'news');
CREATE TYPE schema_type AS ENUM ('Article', 'BlogPosting', 'NewsArticle', 'HowTo', 'FAQ', 'Recipe');
CREATE TYPE sitemap_changefreq AS ENUM ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never');

-- 2. TẠO TABLE CATEGORIES (Hỗ trợ)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  meta_title TEXT,
  meta_description TEXT,
  color TEXT DEFAULT '#3B82F6',
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TẠO TABLE TAGS (Hỗ trợ)
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#EF4444',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TẠO TABLE ARTICLES CHÍNH - SEO HOÀN CHỈNH
CREATE TABLE IF NOT EXISTS articles (
  -- CƠ BẢN
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  
  -- CONTENT CLASSIFICATION
  article_type article_type DEFAULT 'article',
  status article_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  
  -- RELATIONS
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES articles(id) ON DELETE SET NULL, -- For series
  
  -- SEO CORE FIELDS
  meta_title TEXT, -- Max 60 characters
  meta_description TEXT, -- Max 160 characters  
  focus_keyword TEXT,
  keywords TEXT[], -- Array of keywords
  canonical_url TEXT,
  
  -- SOCIAL MEDIA SEO (Open Graph)
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  og_type TEXT DEFAULT 'article',
  
  -- TWITTER CARDS
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  twitter_card_type TEXT DEFAULT 'summary_large_image',
  
  -- IMAGES & MEDIA
  cover_image TEXT,
  cover_image_alt TEXT,
  gallery_images JSONB, -- Array of {url, alt, caption}
  
  -- SCHEMA.ORG STRUCTURED DATA
  schema_type schema_type DEFAULT 'Article',
  author_schema JSONB, -- Author structured data
  organization_schema JSONB, -- Organization data
  faq_schema JSONB, -- FAQ schema if applicable
  howto_schema JSONB, -- HowTo schema if applicable
  breadcrumb_schema JSONB, -- Breadcrumb navigation
  
  -- CONTENT METRICS (Auto-calculated)
  word_count INTEGER DEFAULT 0,
  character_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0, -- Minutes
  paragraph_count INTEGER DEFAULT 0,
  heading_count JSONB, -- {h1: 1, h2: 3, h3: 5}
  
  -- SEO QUALITY METRICS
  content_score INTEGER DEFAULT 0, -- 0-100 SEO score
  readability_score DECIMAL(5,2), -- Flesch Reading Ease
  keyword_density DECIMAL(5,2), -- Focus keyword density %
  
  -- TECHNICAL SEO
  robots_directive TEXT DEFAULT 'index,follow',
  sitemap_include BOOLEAN DEFAULT true,
  sitemap_priority DECIMAL(2,1) DEFAULT 0.8, -- 0.0 to 1.0
  sitemap_changefreq sitemap_changefreq DEFAULT 'weekly',
  
  -- INTERNAL LINKING
  internal_links JSONB, -- Array of internal URLs
  external_links JSONB, -- Array of external URLs  
  related_articles UUID[], -- Related article IDs
  
  -- PERFORMANCE & ANALYTICS
  view_count INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2), -- Percentage
  avg_time_on_page INTEGER, -- Seconds
  social_shares JSONB, -- {facebook: 10, twitter: 5, linkedin: 2}
  backlinks_count INTEGER DEFAULT 0,
  
  -- SEARCH & INDEXING
  search_index TSVECTOR, -- Full-text search
  indexed_at TIMESTAMP WITH TIME ZONE,
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  
  -- PUBLISHING WORKFLOW
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- VERSIONING & AUDIT
  version INTEGER DEFAULT 1,
  revision_notes TEXT,
  last_modified_by UUID REFERENCES auth.users(id),
  
  -- TIMESTAMPS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TẠO TABLE ARTICLE_TAGS (Many-to-Many)
CREATE TABLE IF NOT EXISTS article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- 6. TẠO TABLE ARTICLE_REVISIONS (Version Control)
CREATE TABLE IF NOT EXISTS article_revisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL,
  changes_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TẠO INDEXES ĐỂ TỐI ƯU PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(featured);
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles USING GIN(search_index);
CREATE INDEX IF NOT EXISTS idx_articles_keywords ON articles USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- 8. TẠO FULL-TEXT SEARCH INDEX
CREATE INDEX IF NOT EXISTS idx_articles_fulltext ON articles 
USING GIN(to_tsvector('english', title || ' ' || content || ' ' || COALESCE(excerpt, '')));

-- 9. TẠO FUNCTIONS TỰ ĐỘNG CẬP NHẬT
CREATE OR REPLACE FUNCTION update_article_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Tính word count
  NEW.word_count = array_length(string_to_array(strip_tags(NEW.content), ' '), 1);
  
  -- Tính character count
  NEW.character_count = char_length(NEW.content);
  
  -- Tính reading time (200 words per minute)
  NEW.reading_time = CEILING(NEW.word_count::DECIMAL / 200);
  
  -- Update search index
  NEW.search_index = to_tsvector('english', NEW.title || ' ' || NEW.content || ' ' || COALESCE(NEW.excerpt, ''));
  
  -- Update timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function để strip HTML tags (đơn giản)
CREATE OR REPLACE FUNCTION strip_tags(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(input_text, '<[^>]*>', '', 'g');
END;
$$ LANGUAGE plpgsql;

-- 10. TẠO TRIGGERS
CREATE TRIGGER trigger_update_article_metrics
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_article_metrics();

-- Trigger cập nhật tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tag_usage
  AFTER INSERT OR DELETE ON article_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage();

-- 11. ENABLE ROW LEVEL SECURITY
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;

-- 12. TẠO RLS POLICIES
-- Public có thể đọc articles published
CREATE POLICY "Public can read published articles" ON articles
  FOR SELECT USING (status = 'published');

-- Admin có thể làm tất cả
CREATE POLICY "Admins can do everything with articles" ON articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Author có thể chỉnh sửa bài của mình
CREATE POLICY "Authors can edit own articles" ON articles
  FOR ALL USING (author_id = auth.uid());

-- Public đọc categories và tags
CREATE POLICY "Public can read categories" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read tags" ON tags
  FOR SELECT USING (true);

-- 13. INSERT SAMPLE DATA
INSERT INTO categories (name, slug, description, meta_title, meta_description) VALUES
('SEO Tips', 'seo-tips', 'Các mẹo và thủ thuật SEO hiệu quả', 'SEO Tips - Hướng dẫn tối ưu hóa website', 'Tổng hợp các mẹo SEO hiệu quả giúp website của bạn xếp hạng cao trên Google. Cập nhật thường xuyên các chiến lược SEO mới nhất.'),
('Web Development', 'web-development', 'Lập trình và phát triển website', 'Web Development - Hướng dẫn lập trình web', 'Các bài viết về lập trình web, frontend, backend, framework và công nghệ mới nhất trong phát triển website.'),
('Digital Marketing', 'digital-marketing', 'Marketing số và quảng cáo online', 'Digital Marketing - Chiến lược marketing online', 'Tìm hiểu các chiến lược digital marketing hiệu quả, từ SEO, SEM, Social Media đến Content Marketing.');

INSERT INTO tags (name, slug, description) VALUES
('SEO', 'seo', 'Tối ưu hóa công cụ tìm kiếm'),
('JavaScript', 'javascript', 'Ngôn ngữ lập trình JavaScript'),
('React', 'react', 'Thư viện React JS'),
('Performance', 'performance', 'Tối ưu hiệu suất website'),
('Tutorial', 'tutorial', 'Hướng dẫn chi tiết');

-- 14. COMMENTS
COMMENT ON TABLE articles IS 'Bảng quản lý articles với đầy đủ tính năng SEO professional';
COMMENT ON COLUMN articles.content_score IS 'Điểm SEO tổng thể từ 0-100';
COMMENT ON COLUMN articles.readability_score IS 'Điểm dễ đọc theo thang Flesch Reading Ease';
COMMENT ON COLUMN articles.sitemap_priority IS 'Độ ưu tiên trong sitemap (0.0 - 1.0)';

-- ==========================================
-- SETUP HOÀN TẤT!
-- ==========================================

-- Để sử dụng:
-- 1. Copy toàn bộ script này
-- 2. Paste vào Supabase SQL Editor  
-- 3. Click "RUN" để thực thi
-- 4. Kiểm tra trong Table Editor để xác nhận

SELECT 'Articles table với đầy đủ SEO features đã được tạo thành công!' as status; 
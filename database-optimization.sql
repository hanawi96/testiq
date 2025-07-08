-- Database Optimization Script for Articles Performance
-- Adds missing indexes and optimizations for better query performance

-- 1. Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_articles_status_created_at 
ON articles (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_author_status 
ON articles (author_id, status);

CREATE INDEX IF NOT EXISTS idx_articles_view_count 
ON articles (view_count DESC);

-- 2. Add composite indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_articles_status_published_at 
ON articles (status, published_at DESC) 
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_articles_featured_status 
ON articles (featured, status) 
WHERE featured = true;

-- 3. Optimize junction table indexes
CREATE INDEX IF NOT EXISTS idx_article_categories_article_id 
ON article_categories (article_id);

CREATE INDEX IF NOT EXISTS idx_article_categories_category_id 
ON article_categories (category_id);

CREATE INDEX IF NOT EXISTS idx_article_tags_article_id 
ON article_tags (article_id);

CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id 
ON article_tags (tag_id);

-- 4. Add full-text search optimization (if not exists)
CREATE INDEX IF NOT EXISTS idx_articles_search_content 
ON articles USING gin(to_tsvector('english', title || ' ' || content || ' ' || COALESCE(excerpt, '')));

-- 5. Add user_profiles indexes for author joins
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name 
ON user_profiles (full_name);

-- 6. Update table statistics for better query planning
ANALYZE articles;
ANALYZE article_categories;
ANALYZE article_tags;
ANALYZE categories;
ANALYZE tags;
ANALYZE user_profiles;

-- 7. Optional: Add materialized view for article stats (for very large datasets)
-- CREATE MATERIALIZED VIEW IF NOT EXISTS article_stats_mv AS
-- SELECT 
--   COUNT(*) as total,
--   COUNT(*) FILTER (WHERE status = 'published') as published,
--   COUNT(*) FILTER (WHERE status = 'draft') as draft,
--   COUNT(*) FILTER (WHERE status = 'archived') as archived,
--   SUM(view_count) as total_views,
--   AVG(reading_time) as avg_reading_time,
--   COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_articles
-- FROM articles;

-- 8. Create function for efficient article search (optional advanced optimization)
CREATE OR REPLACE FUNCTION search_articles(
  search_term TEXT,
  status_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 10,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  status TEXT,
  author_id UUID,
  view_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  reading_time INTEGER,
  rank REAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.status::TEXT,
    a.author_id,
    a.view_count,
    a.created_at,
    a.updated_at,
    a.published_at,
    a.reading_time,
    ts_rank(
      to_tsvector('english', a.title || ' ' || a.content || ' ' || COALESCE(a.excerpt, '')),
      plainto_tsquery('english', search_term)
    ) as rank
  FROM articles a
  WHERE 
    (status_filter IS NULL OR a.status::TEXT = status_filter)
    AND (
      search_term IS NULL 
      OR to_tsvector('english', a.title || ' ' || a.content || ' ' || COALESCE(a.excerpt, ''))
         @@ plainto_tsquery('english', search_term)
    )
  ORDER BY 
    CASE WHEN search_term IS NOT NULL THEN rank END DESC,
    a.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- 9. Performance monitoring queries (for debugging)
-- Use these to monitor query performance:

-- Check slow queries:
-- SELECT query, mean_time, calls, total_time 
-- FROM pg_stat_statements 
-- WHERE query LIKE '%articles%' 
-- ORDER BY mean_time DESC;

-- Check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- WHERE tablename IN ('articles', 'article_categories', 'article_tags')
-- ORDER BY idx_scan DESC;

-- Check table statistics:
-- SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
-- FROM pg_stat_user_tables 
-- WHERE tablename IN ('articles', 'article_categories', 'article_tags');

COMMIT;

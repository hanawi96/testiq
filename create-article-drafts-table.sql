-- ===== CREATE ARTICLE_DRAFTS TABLE =====
-- Tạo bảng article_drafts để hỗ trợ autosave

CREATE TABLE IF NOT EXISTS public.article_drafts (
  -- Identity & Relationship
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  article_id UUID NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core Content (giống articles)
  title TEXT NOT NULL DEFAULT '',
  slug TEXT NULL,
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT NULL,
  lang TEXT NULL DEFAULT 'vi',
  article_type public.article_type NULL DEFAULT 'article',
  status public.article_status NULL DEFAULT 'draft',
  featured BOOLEAN NULL DEFAULT false,
  category_id UUID NULL REFERENCES public.categories(id) ON DELETE SET NULL,
  
  -- SEO Fields
  meta_title TEXT NULL,
  meta_description TEXT NULL,
  focus_keyword TEXT NULL,
  keywords TEXT[] NULL,
  canonical_url TEXT NULL,
  og_title TEXT NULL,
  og_description TEXT NULL,
  og_image TEXT NULL,
  og_type TEXT NULL DEFAULT 'article',
  
  -- Media
  cover_image TEXT NULL,
  cover_image_alt TEXT NULL,
  
  -- Settings
  schema_type public.schema_type NULL DEFAULT 'Article',
  robots_directive TEXT NULL DEFAULT 'index,follow',
  
  -- Metrics (auto-calculated)
  word_count INTEGER NULL DEFAULT 0,
  reading_time INTEGER NULL DEFAULT 0,
  
  -- Links
  internal_links JSONB NULL,
  external_links JSONB NULL,
  
  -- Publishing
  scheduled_at TIMESTAMP WITH TIME ZONE NULL,
  version INTEGER NULL DEFAULT 1,
  
  -- Draft Management
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_saved BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT article_drafts_pkey PRIMARY KEY (id),
  CONSTRAINT valid_metrics CHECK (word_count >= 0 AND reading_time >= 0)
);

-- Unique constraint với WHERE clause (tạo riêng)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_draft 
ON public.article_drafts(article_id, user_id, is_active) 
WHERE is_active = true;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_article_drafts_user_active 
ON public.article_drafts(user_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_article_drafts_article_user 
ON public.article_drafts(article_id, user_id);

CREATE INDEX IF NOT EXISTS idx_article_drafts_updated_at 
ON public.article_drafts(updated_at DESC);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_article_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_update_article_drafts_updated_at 
BEFORE UPDATE ON public.article_drafts
FOR EACH ROW EXECUTE FUNCTION update_article_drafts_updated_at();

-- Auto-calculate metrics trigger
CREATE OR REPLACE FUNCTION calculate_draft_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate word count (remove HTML tags)
  NEW.word_count = array_length(
    string_to_array(
      trim(regexp_replace(NEW.content, '<[^>]*>', ' ', 'g')), 
      ' '
    ), 
    1
  );
  
  -- Calculate reading time (200 words per minute)
  NEW.reading_time = GREATEST(1, CEIL(NEW.word_count::DECIMAL / 200));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_calculate_draft_metrics 
BEFORE INSERT OR UPDATE ON public.article_drafts
FOR EACH ROW EXECUTE FUNCTION calculate_draft_metrics();

-- RLS
ALTER TABLE public.article_drafts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own drafts" ON public.article_drafts;

CREATE POLICY "Users can manage own drafts" 
ON public.article_drafts 
FOR ALL USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_drafts TO authenticated;

-- ===== CREATE ARTICLE_DRAFT_CATEGORIES TABLE =====
-- Tạo bảng junction cho multiple categories trong drafts

CREATE TABLE IF NOT EXISTS public.article_draft_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  article_draft_id UUID NOT NULL,
  category_id UUID NOT NULL,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT article_draft_categories_pkey PRIMARY KEY (id),
  CONSTRAINT unique_draft_category UNIQUE (article_draft_id, category_id),
  CONSTRAINT fk_article_draft_categories_draft_id 
    FOREIGN KEY (article_draft_id) REFERENCES public.article_drafts(id) ON DELETE CASCADE,
  CONSTRAINT fk_article_draft_categories_category_id 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_draft_categories_draft_id 
ON public.article_draft_categories(article_draft_id);

CREATE INDEX IF NOT EXISTS idx_article_draft_categories_category_id 
ON public.article_draft_categories(category_id);

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_draft_categories TO authenticated;

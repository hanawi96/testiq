-- Tạo bảng article_drafts đơn giản cho autosave
CREATE TABLE IF NOT EXISTS public.article_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Content fields
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT NULL,
  meta_title TEXT NULL,
  meta_description TEXT NULL,
  focus_keyword TEXT NULL,
  
  -- Draft management
  auto_saved BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT article_drafts_pkey PRIMARY KEY (id)
);

-- Index cho performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_article_drafts_unique 
ON public.article_drafts(article_id, user_id) 
WHERE is_active = true;

-- RLS
ALTER TABLE public.article_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own drafts" 
ON public.article_drafts 
FOR ALL USING (user_id = auth.uid());

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_drafts TO authenticated;

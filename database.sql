-- user_test_results
create table public.user_test_results (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  test_type text not null default 'iq'::text,
  score integer not null,
  accuracy numeric(5, 2) null,
  duration_seconds integer null,
  test_data jsonb null,
  tested_at timestamp without time zone null default now(),
  age integer null,
  country text null,
  country_code text null,
  email text null,
  name text null,
  gender text null,
  constraint user_test_results_pkey primary key (id),
  constraint user_test_results_user_id_fkey foreign KEY (user_id) references user_profiles (id) on delete CASCADE,
  constraint duration_non_negative check (
    (
      (duration_seconds is null)
      or (duration_seconds >= 0)
    )
  ),
  constraint score_non_negative check ((score >= 0))
) TABLESPACE pg_default;

-- OPTIMIZED INDEXES for leaderboard performance
create index IF not exists idx_user_test_results_user_id on public.user_test_results using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_user_test_results_tested_at on public.user_test_results using btree (tested_at) TABLESPACE pg_default;

-- New optimized indexes for SUPER FAST leaderboard queries
create index IF not exists idx_user_test_results_score_desc on public.user_test_results using btree (score DESC) TABLESPACE pg_default;
create index IF not exists idx_user_test_results_tested_at_desc on public.user_test_results using btree (tested_at DESC) TABLESPACE pg_default;
create index IF not exists idx_user_test_results_score_tested_at on public.user_test_results using btree (score DESC, tested_at DESC) TABLESPACE pg_default;
create index IF not exists idx_user_test_results_user_id_score on public.user_test_results using btree (user_id, score DESC) TABLESPACE pg_default;

-- ✅ SIMPLE: RPC function để lấy điểm cao nhất mỗi email (anti-spam)
create or replace function public.get_best_scores_per_email()
returns table (
  user_id uuid,
  score integer,
  tested_at timestamp without time zone,
  name text,
  country text,
  gender text,
  age integer,
  email text
) 
language sql
security definer
as $$
  -- ✅ SUPER SIMPLE: Group by email, lấy điểm cao nhất
  -- 🚀 PERFORMANCE: ROW_NUMBER() với PARTITION BY email
  with ranked_scores as (
    select 
      utr.user_id,
      utr.score,
      utr.tested_at,
      utr.name,
      utr.country,
      utr.gender,
      utr.age,
      utr.email,
      row_number() over (
        partition by utr.email
        order by utr.score desc, utr.tested_at desc
      ) as rn
    from user_test_results utr
    where utr.email is not null 
      and utr.score is not null 
      and utr.score >= 0
  )
  select 
    rs.user_id,
    rs.score,
    rs.tested_at,
    rs.name,
    rs.country,
    rs.gender,
    rs.age,
    rs.email
  from ranked_scores rs
  where rs.rn = 1
  order by rs.score desc, rs.tested_at desc;
$$;

-- Grant execute permission
grant execute on function public.get_best_scores_per_email() to authenticated, anon;

-- ✅ RPC function để lấy users với email từ auth.users
CREATE OR REPLACE FUNCTION public.get_users_with_email(
    page_limit INTEGER DEFAULT 10,
    page_offset INTEGER DEFAULT 0,
    role_filter TEXT DEFAULT NULL,
    search_term TEXT DEFAULT NULL,
    verified_filter BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    full_name TEXT,
    role TEXT,
    is_verified BOOLEAN,
    last_login TIMESTAMP,
    age INTEGER,
    country_name TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_users AS (
        SELECT
            up.id,
            au.email::TEXT, -- Cast to TEXT để tránh type mismatch
            au.email_confirmed_at, -- từ auth.users (timestamptz)
            au.created_at, -- từ auth.users (timestamptz)
            au.last_sign_in_at, -- từ auth.users (timestamptz)
            up.full_name,
            up.role,
            up.is_verified,
            up.last_login, -- từ user_profiles (timestamp without time zone)
            up.age,
            up.country_name
        FROM user_profiles up
        INNER JOIN auth.users au ON up.id = au.id
        WHERE
            -- Filter by role
            (role_filter IS NULL OR up.role = role_filter)
            -- Filter by verification status
            AND (verified_filter IS NULL OR up.is_verified = verified_filter)
            -- Search in full_name or email
            AND (
                search_term IS NULL
                OR up.full_name ILIKE '%' || search_term || '%'
                OR au.email ILIKE '%' || search_term || '%'
            )
        ORDER BY au.created_at DESC -- Dùng created_at từ auth.users
    )
    SELECT
        fu.*,
        (SELECT COUNT(*) FROM filtered_users) as total_count
    FROM filtered_users fu
    LIMIT page_limit
    OFFSET page_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_users_with_email(INTEGER, INTEGER, TEXT, TEXT, BOOLEAN) TO authenticated, anon;

-- anonymous_players

create table public.anonymous_players (
  id uuid not null default gen_random_uuid (),
  name text not null,
  age integer null,
  country_name text null,
  test_result jsonb not null,
  test_score integer null,
  test_duration integer null,
  created_at timestamp without time zone null default now(),
  email text null,
  country_code character(2) null,
  gender text null,
  constraint anonymous_players_pkey primary key (id),
  constraint anonymous_players_age_check check (
    (
      (age >= 0)
      and (age <= 120)
    )
  )
) TABLESPACE pg_default;

-- OPTIMIZED INDEXES for anonymous_players leaderboard performance
create index IF not exists idx_anonymous_players_test_score_desc on public.anonymous_players using btree (test_score DESC) TABLESPACE pg_default;
create index IF not exists idx_anonymous_players_created_at_desc on public.anonymous_players using btree (created_at DESC) TABLESPACE pg_default;

-- countries
create table public.countries (
  id uuid not null default gen_random_uuid (),
  name text not null,
  code character(2) not null,
  created_at timestamp with time zone null default now(),
  constraint countries_pkey primary key (id),
  constraint countries_code_key unique (code)
) TABLESPACE pg_default;

-- Migration: Add gender column to anonymous_players if not exists
ALTER TABLE public.anonymous_players ADD COLUMN IF NOT EXISTS gender text;


-- user_profiles
create table public.user_profiles (
  id uuid not null,
  full_name text null,
  age integer null,
  gender text null,
  country_name text null,
  avatar_url text null,
  bio text null,
  role text not null default 'user'::text,
  is_verified boolean null default false,
  last_login timestamp without time zone null,
  settings jsonb null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  country_code character(2) null,
  email text null,
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint user_profiles_gender_check check (
    (
      gender = any (
        array['male'::text, 'female'::text, 'other'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_role on public.user_profiles using btree (role) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_created_at on public.user_profiles using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_is_verified on public.user_profiles using btree (is_verified) TABLESPACE pg_default;

create trigger trigger_user_profiles_updated_at BEFORE
update on user_profiles for EACH row
execute FUNCTION handle_updated_at ();



-- categories
create table public.categories (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  description text null,
  meta_title text null,
  meta_description text null,
  color text null default '#3B82F6'::text,
  parent_id uuid null,
  sort_order integer null default 0,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_slug_key unique (slug),
  constraint categories_parent_id_fkey foreign KEY (parent_id) references categories (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_categories_slug on public.categories using btree (slug) TABLESPACE pg_default;




-- articles
create table public.articles (
  id uuid not null default gen_random_uuid (),
  title text not null,
  slug text not null,
  slug_history text[] null default array[]::text[],
  content text not null,
  excerpt text null,
  lang text null default 'vi'::text,
  article_type public.article_type null default 'article'::article_type,
  status public.article_status null default 'draft'::article_status,
  featured boolean null default false,
  author_id uuid null,
  category_id uuid null,
  parent_id uuid null,
  meta_title text null,
  meta_description text null,
  focus_keyword text null,
  keywords text[] null,
  canonical_url text null,
  og_title text null,
  og_description text null,
  og_image text null,
  og_type text null default 'article'::text,
  twitter_title text null,
  twitter_description text null,
  twitter_image text null,
  twitter_card_type text null default 'summary_large_image'::text,
  cover_image text null,
  cover_image_alt text null,
  gallery_images jsonb null,
  schema_type public.schema_type null default 'Article'::schema_type,
  author_schema jsonb null,
  organization_schema jsonb null,
  faq_schema jsonb null,
  howto_schema jsonb null,
  breadcrumb_schema jsonb null,
  word_count integer null default 0,
  character_count integer null default 0,
  reading_time integer null default 0,
  paragraph_count integer null default 0,
  heading_count jsonb null,
  content_score integer null default 0,
  readability_score numeric(5, 2) null,
  keyword_density numeric(5, 2) null,
  robots_directive text null default 'index,follow'::text,
  sitemap_include boolean null default true,
  sitemap_priority numeric(2, 1) null default 0.8,
  sitemap_changefreq public.sitemap_changefreq null default 'weekly'::sitemap_changefreq,
  internal_links jsonb null,
  external_links jsonb null,
  related_articles uuid[] null,
  view_count integer null default 0,
  unique_views integer null default 0,
  like_count integer null default 0,
  bounce_rate numeric(5, 2) null,
  avg_time_on_page integer null,
  social_shares jsonb null,
  backlinks_count integer null default 0,
  search_index tsvector null,
  indexed_at timestamp with time zone null,
  last_crawled_at timestamp with time zone null,
  published_at timestamp with time zone null,
  scheduled_at timestamp with time zone null,
  expires_at timestamp with time zone null,
  version integer null default 1,
  revision_notes text null,
  last_modified_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint articles_pkey primary key (id),
  constraint articles_slug_key unique (slug),
  constraint articles_author_id_fkey foreign KEY (author_id) references auth.users (id) on delete set null,
  constraint articles_category_id_fkey foreign KEY (category_id) references categories (id) on delete set null,
  constraint articles_last_modified_by_fkey foreign KEY (last_modified_by) references auth.users (id),
  constraint articles_parent_id_fkey foreign KEY (parent_id) references articles (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_articles_slug on public.articles using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_articles_status on public.articles using btree (status) TABLESPACE pg_default;

create index IF not exists idx_articles_published_at on public.articles using btree (published_at desc) TABLESPACE pg_default;

create index IF not exists idx_articles_author_id on public.articles using btree (author_id) TABLESPACE pg_default;

create index IF not exists idx_articles_category_id on public.articles using btree (category_id) TABLESPACE pg_default;

create index IF not exists idx_articles_featured on public.articles using btree (featured) TABLESPACE pg_default;

create index IF not exists idx_articles_search on public.articles using gin (search_index) TABLESPACE pg_default;

create index IF not exists idx_articles_keywords on public.articles using gin (keywords) TABLESPACE pg_default;

create index IF not exists idx_articles_fulltext on public.articles using gin (
  to_tsvector(
    'english'::regconfig,
    (
      (((title || ' '::text) || content) || ' '::text) || COALESCE(excerpt, ''::text)
    )
  )
) TABLESPACE pg_default;

create trigger trigger_update_article_metrics BEFORE INSERT
or
update on articles for EACH row
execute FUNCTION update_article_metrics ();



-- article_categories
create table public.article_categories (
  id uuid not null default gen_random_uuid (),
  article_id uuid not null,
  category_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint article_categories_pkey primary key (id),
  constraint unique_article_category unique (article_id, category_id),
  constraint fk_article_categories_article_id foreign KEY (article_id) references articles (id) on delete CASCADE,
  constraint fk_article_categories_category_id foreign KEY (category_id) references categories (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_article_categories_article_id on public.article_categories using btree (article_id) TABLESPACE pg_default;

create index IF not exists idx_article_categories_category_id on public.article_categories using btree (category_id) TABLESPACE pg_default;

create index IF not exists idx_article_categories_composite on public.article_categories using btree (article_id, category_id) TABLESPACE pg_default;

create trigger trigger_update_category_count_on_article_categories
after INSERT
or DELETE on article_categories for EACH row
execute FUNCTION update_category_article_count ();




-- article_tags
create table public.article_tags (
  article_id uuid not null,
  tag_id uuid not null,
  constraint article_tags_pkey primary key (article_id, tag_id),
  constraint article_tags_article_id_fkey foreign KEY (article_id) references articles (id) on delete CASCADE,
  constraint article_tags_tag_id_fkey foreign KEY (tag_id) references tags (id) on delete CASCADE
) TABLESPACE pg_default;


-- tags
create table public.tags (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  description text null,
  color text null default '#EF4444'::text,
  usage_count integer null default 0,
  created_at timestamp with time zone null default now(),
  title text null,
  constraint tags_pkey primary key (id),
  constraint tags_name_key unique (name),
  constraint tags_slug_key unique (slug),
  constraint tags_usage_count_check check ((usage_count >= 0))
) TABLESPACE pg_default;

create index IF not exists idx_tags_slug on public.tags using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_tags_usage_count on public.tags using btree (usage_count desc) TABLESPACE pg_default;

-- Add some sample data for testing
UPDATE articles SET like_count = FLOOR(RANDOM() * 50) + 5 WHERE like_count IS NULL OR like_count = 0;
UPDATE articles SET view_count = FLOOR(RANDOM() * 1000) + 100 WHERE view_count IS NULL OR view_count = 0;
UPDATE articles SET word_count = FLOOR(RANDOM() * 2000) + 500 WHERE word_count IS NULL OR word_count = 0;


-- system_settings
create table public.system_settings (
  id uuid not null default gen_random_uuid (),
  key text not null,
  value jsonb not null,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint system_settings_pkey primary key (id),
  constraint system_settings_key_unique unique (key)
) TABLESPACE pg_default;

create index IF not exists idx_system_settings_key on public.system_settings using btree (key) TABLESPACE pg_default;





-- Tạo bảng article_views_daily để tracking lượt xem theo ngày
CREATE TABLE article_views_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Composite unique constraint để tránh duplicate
  CONSTRAINT unique_article_date UNIQUE (date, article_id)
);

-- Tạo indexes để tối ưu performance
CREATE INDEX idx_article_views_daily_date ON article_views_daily(date);
CREATE INDEX idx_article_views_daily_article_id ON article_views_daily(article_id);
CREATE INDEX idx_article_views_daily_date_article ON article_views_daily(date, article_id);

-- Tạo function để auto-update updated_at
CREATE OR REPLACE FUNCTION update_article_views_daily_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger để auto-update updated_at
CREATE TRIGGER trigger_update_article_views_daily_updated_at
  BEFORE UPDATE ON article_views_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_article_views_daily_updated_at();

-- Tạo RLS (Row Level Security) policies
ALTER TABLE article_views_daily ENABLE ROW LEVEL SECURITY;

-- Policy cho admin có thể đọc tất cả
CREATE POLICY "Admin can view all article views" ON article_views_daily
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'editor')
    )
  );

-- Policy cho admin có thể insert/update
CREATE POLICY "Admin can manage article views" ON article_views_daily
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'editor')
    )
  );

-- Tạo function để increment view count
CREATE OR REPLACE FUNCTION increment_article_view(
  p_article_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO article_views_daily (date, article_id, view_count, unique_views)
  VALUES (p_date, p_article_id, 1, 1)
  ON CONFLICT (date, article_id)
  DO UPDATE SET 
    view_count = article_views_daily.view_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment để document bảng
COMMENT ON TABLE article_views_daily IS 'Bảng tracking lượt xem bài viết theo ngày';
COMMENT ON COLUMN article_views_daily.date IS 'Ngày tracking (YYYY-MM-DD)';
COMMENT ON COLUMN article_views_daily.article_id IS 'ID bài viết được xem';
COMMENT ON COLUMN article_views_daily.view_count IS 'Tổng số lượt xem trong ngày';
COMMENT ON COLUMN article_views_daily.unique_views IS 'Số lượt xem unique (distinct users)';
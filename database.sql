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
    location TEXT,
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
            up.location
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
  location text null,
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
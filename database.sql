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
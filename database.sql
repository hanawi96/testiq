-- 1. TẠO TABLE USER PROFILES

create table public.user_profiles (
  id uuid not null,
  full_name text not null,
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

-- 2. TẠO TABLE USER TEST RESULTS (UNIFIED - for both authenticated and anonymous users)
create table public.user_test_results (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  test_type text not null default 'iq'::text,
  score integer not null,
  accuracy numeric(5, 2) null,
  duration_seconds integer null,
  test_data jsonb null,
  tested_at timestamp without time zone null default now(),
  guest_name text null,
  guest_age integer null,
  guest_location text null,
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

create index IF not exists idx_user_test_results_user_id on public.user_test_results using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_test_results_tested_at on public.user_test_results using btree (tested_at) TABLESPACE pg_default;

-- Additional indexes for anonymous users queries
create index IF not exists idx_user_test_results_guest_info on public.user_test_results using btree (guest_name, guest_age, guest_location) where user_id is null TABLESPACE pg_default;

-- Comment explaining the unified approach
COMMENT ON TABLE public.user_test_results IS 'Unified table for all IQ test results. Authenticated users have user_id set, anonymous users have user_id=NULL with guest_* fields populated.';
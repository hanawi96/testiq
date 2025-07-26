-- Migration: Add username column to anonymous_players table
-- This fixes the issue where anonymous users can't update username

-- Add username column if not exists
ALTER TABLE public.anonymous_players ADD COLUMN IF NOT EXISTS username text;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_players_username 
ON public.anonymous_players USING btree (username);

-- Optional: Update existing records to have username based on name
-- UPDATE public.anonymous_players 
-- SET username = name 
-- WHERE username IS NULL AND name IS NOT NULL;

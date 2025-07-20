-- Fix autosave author_id issue
-- Thêm cột author_id vào bảng article_drafts

ALTER TABLE public.article_drafts
ADD COLUMN author_id UUID NULL;

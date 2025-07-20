-- Script kiểm tra autosave có lưu đầy đủ dữ liệu không
-- Chạy script này sau khi test autosave

-- 1. Kiểm tra cấu trúc bảng article_drafts
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'article_drafts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Kiểm tra record autosave mới nhất
SELECT 
  id,
  article_id,
  user_id,
  title,
  slug,
  lang,
  article_type,
  status,
  featured,
  category_id,
  meta_title,
  meta_description,
  focus_keyword,
  cover_image,
  cover_image_alt,
  schema_type,
  robots_directive,
  scheduled_at,
  auto_saved,
  is_active,
  created_at,
  updated_at
FROM article_drafts 
WHERE auto_saved = true 
  AND is_active = true
ORDER BY updated_at DESC 
LIMIT 5;

-- 3. Đếm số trường NULL vs có dữ liệu
SELECT 
  'title' as field_name,
  COUNT(*) as total_records,
  COUNT(title) as non_null_count,
  COUNT(*) - COUNT(title) as null_count
FROM article_drafts WHERE auto_saved = true

UNION ALL

SELECT 
  'slug' as field_name,
  COUNT(*) as total_records,
  COUNT(slug) as non_null_count,
  COUNT(*) - COUNT(slug) as null_count
FROM article_drafts WHERE auto_saved = true

UNION ALL

SELECT 
  'cover_image' as field_name,
  COUNT(*) as total_records,
  COUNT(cover_image) as non_null_count,
  COUNT(*) - COUNT(cover_image) as null_count
FROM article_drafts WHERE auto_saved = true

UNION ALL

SELECT 
  'category_id' as field_name,
  COUNT(*) as total_records,
  COUNT(category_id) as non_null_count,
  COUNT(*) - COUNT(category_id) as null_count
FROM article_drafts WHERE auto_saved = true;

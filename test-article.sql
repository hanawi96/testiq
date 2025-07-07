-- Tạo bài viết test để kiểm tra chức năng tags

-- 1. Tạo bài viết test
INSERT INTO articles (
  title,
  slug,
  content,
  excerpt,
  status,
  author_id,
  created_at,
  updated_at
) VALUES (
  'Bài viết test cho chức năng tags',
  'bai-viet-test-cho-chuc-nang-tags',
  'Đây là nội dung bài viết test để kiểm tra chức năng tags trong hệ thống admin.',
  'Bài viết test để kiểm tra tags',
  'published',
  (SELECT id FROM auth.users LIMIT 1), -- Lấy user đầu tiên
  NOW(),
  NOW()
);

-- 2. Tạo một số tags test
INSERT INTO tags (name, slug, color) VALUES 
('React', 'react', '#61DAFB'),
('JavaScript', 'javascript', '#F7DF1E'),
('TypeScript', 'typescript', '#3178C6'),
('Supabase', 'supabase', '#3ECF8E'),
('Test', 'test', '#EF4444')
ON CONFLICT (name) DO NOTHING;

-- 3. Liên kết bài viết với tags
INSERT INTO article_tags (article_id, tag_id)
SELECT 
  (SELECT id FROM articles WHERE slug = 'bai-viet-test-cho-chuc-nang-tags'),
  t.id
FROM tags t
WHERE t.name IN ('React', 'JavaScript', 'Test');

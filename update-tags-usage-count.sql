-- Script để tạo trigger tự động cập nhật usage_count cho tags
-- Khi có thay đổi trong bảng article_tags

-- 1. Tạo function để cập nhật usage_count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Cập nhật usage_count cho tag bị ảnh hưởng
  IF TG_OP = 'INSERT' THEN
    -- Khi thêm relationship mới
    UPDATE tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM article_tags 
      WHERE article_tags.tag_id = NEW.tag_id
    )
    WHERE id = NEW.tag_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Khi xóa relationship
    UPDATE tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM article_tags 
      WHERE article_tags.tag_id = OLD.tag_id
    )
    WHERE id = OLD.tag_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Tạo trigger cho bảng article_tags
DROP TRIGGER IF EXISTS trigger_update_tag_usage_count ON article_tags;
CREATE TRIGGER trigger_update_tag_usage_count
  AFTER INSERT OR DELETE ON article_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_usage_count();

-- 3. Cập nhật usage_count hiện tại cho tất cả tags
UPDATE tags SET usage_count = (
  SELECT COUNT(*) 
  FROM article_tags 
  WHERE article_tags.tag_id = tags.id
);

-- 4. Kiểm tra kết quả
SELECT 
  name,
  usage_count,
  (SELECT COUNT(*) FROM article_tags WHERE tag_id = tags.id) as actual_count
FROM tags 
ORDER BY usage_count DESC, name;

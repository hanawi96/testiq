-- Script để chuẩn hóa tags trong database
-- Xử lý duplicate tags với case-insensitive logic

-- 1. Tìm và hiển thị các tags duplicate (case-insensitive)
SELECT 
  LOWER(name) as normalized_name,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as variations
FROM tags 
GROUP BY LOWER(name) 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Backup dữ liệu trước khi chuẩn hóa
CREATE TABLE IF NOT EXISTS tags_backup AS 
SELECT * FROM tags;

CREATE TABLE IF NOT EXISTS article_tags_backup AS 
SELECT * FROM article_tags;

-- 3. Function để chuẩn hóa tag name
CREATE OR REPLACE FUNCTION normalize_tag_name(tag_name TEXT) 
RETURNS TEXT AS $$
BEGIN
  -- Special cases for common tech tags (keep uppercase)
  CASE UPPER(tag_name)
    WHEN 'SEO' THEN RETURN 'SEO';
    WHEN 'API' THEN RETURN 'API';
    WHEN 'UI' THEN RETURN 'UI';
    WHEN 'UX' THEN RETURN 'UX';
    WHEN 'CSS' THEN RETURN 'CSS';
    WHEN 'HTML' THEN RETURN 'HTML';
    WHEN 'SQL' THEN RETURN 'SQL';
    WHEN 'JSON' THEN RETURN 'JSON';
    WHEN 'XML' THEN RETURN 'XML';
    WHEN 'HTTP' THEN RETURN 'HTTP';
    WHEN 'HTTPS' THEN RETURN 'HTTPS';
    WHEN 'REST' THEN RETURN 'REST';
    WHEN 'GRAPHQL' THEN RETURN 'GraphQL';
    WHEN 'JWT' THEN RETURN 'JWT';
    WHEN 'OAUTH' THEN RETURN 'OAuth';
    WHEN 'AI' THEN RETURN 'AI';
    WHEN 'ML' THEN RETURN 'ML';
    WHEN 'IOT' THEN RETURN 'IoT';
    WHEN 'VR' THEN RETURN 'VR';
    WHEN 'AR' THEN RETURN 'AR';
    WHEN 'JAVASCRIPT' THEN RETURN 'JavaScript';
    WHEN 'TYPESCRIPT' THEN RETURN 'TypeScript';
    WHEN 'NODEJS' THEN RETURN 'Node.js';
    WHEN 'NODE.JS' THEN RETURN 'Node.js';
    WHEN 'REACTJS' THEN RETURN 'React';
    WHEN 'REACT.JS' THEN RETURN 'React';
    WHEN 'VUEJS' THEN RETURN 'Vue.js';
    WHEN 'VUE.JS' THEN RETURN 'Vue.js';
    WHEN 'ANGULARJS' THEN RETURN 'Angular';
    WHEN 'ANGULAR.JS' THEN RETURN 'Angular';
    ELSE 
      -- For other tags, capitalize first letter
      RETURN INITCAP(LOWER(tag_name));
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 4. Chuẩn hóa tags và merge duplicates
DO $$
DECLARE
  tag_record RECORD;
  normalized_name TEXT;
  canonical_tag_id UUID;
  duplicate_tag_ids UUID[];
BEGIN
  -- Loop through each unique normalized name
  FOR tag_record IN 
    SELECT LOWER(name) as lower_name, MIN(id) as canonical_id
    FROM tags 
    GROUP BY LOWER(name)
  LOOP
    normalized_name := normalize_tag_name(tag_record.lower_name);
    canonical_tag_id := tag_record.canonical_id;
    
    -- Get all duplicate tag IDs for this normalized name
    SELECT ARRAY_AGG(id) INTO duplicate_tag_ids
    FROM tags 
    WHERE LOWER(name) = tag_record.lower_name AND id != canonical_tag_id;
    
    -- Update canonical tag with normalized name
    UPDATE tags 
    SET name = normalized_name,
        slug = LOWER(REPLACE(normalized_name, '.', '-'))
    WHERE id = canonical_tag_id;
    
    -- Move all article_tags relationships to canonical tag
    IF array_length(duplicate_tag_ids, 1) > 0 THEN
      UPDATE article_tags 
      SET tag_id = canonical_tag_id 
      WHERE tag_id = ANY(duplicate_tag_ids)
      AND NOT EXISTS (
        SELECT 1 FROM article_tags at2 
        WHERE at2.article_id = article_tags.article_id 
        AND at2.tag_id = canonical_tag_id
      );
      
      -- Delete duplicate relationships
      DELETE FROM article_tags 
      WHERE tag_id = ANY(duplicate_tag_ids);
      
      -- Delete duplicate tags
      DELETE FROM tags 
      WHERE id = ANY(duplicate_tag_ids);
    END IF;
    
    RAISE NOTICE 'Normalized tag: % -> %', tag_record.lower_name, normalized_name;
  END LOOP;
END $$;

-- 5. Update usage_count for all tags
UPDATE tags SET usage_count = (
  SELECT COUNT(*) 
  FROM article_tags 
  WHERE article_tags.tag_id = tags.id
);

-- 6. Verify results
SELECT 
  'After normalization' as status,
  COUNT(*) as total_tags,
  COUNT(DISTINCT LOWER(name)) as unique_normalized_names
FROM tags;

-- 7. Show final tags list
SELECT name, slug, usage_count 
FROM tags 
ORDER BY usage_count DESC, name;

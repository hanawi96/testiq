-- =====================================================
-- SIMPLE ROLLBACK SCRIPT FOR JUNCTION TABLE MIGRATION
-- =====================================================
-- This script provides a simple rollback mechanism to remove
-- the junction table and related objects if needed.
-- Note: This assumes the original category_id field is still intact.

-- Begin transaction
BEGIN;

-- =====================================================
-- 1. VERIFY CURRENT STATE
-- =====================================================

DO $$
DECLARE
    junction_relationships INTEGER;
    articles_with_categories INTEGER;
    original_category_relationships INTEGER;
BEGIN
    -- Check junction table
    SELECT COUNT(*) INTO junction_relationships FROM public.article_categories;
    SELECT COUNT(DISTINCT article_id) INTO articles_with_categories FROM public.article_categories;
    
    -- Check original category_id field
    SELECT COUNT(*) INTO original_category_relationships 
    FROM public.articles 
    WHERE category_id IS NOT NULL;
    
    RAISE NOTICE 'Current state before rollback:';
    RAISE NOTICE '- Junction table relationships: %', junction_relationships;
    RAISE NOTICE '- Articles with categories in junction: %', articles_with_categories;
    RAISE NOTICE '- Articles with original category_id: %', original_category_relationships;
    
    IF junction_relationships = 0 THEN
        RAISE NOTICE 'No data in junction table to rollback';
    END IF;
END;
$$;

-- =====================================================
-- 2. DROP JUNCTION TABLE AND RELATED OBJECTS
-- =====================================================

-- Drop RLS policies
DROP POLICY IF EXISTS "Allow public read access on article_categories" ON public.article_categories;
DROP POLICY IF EXISTS "Allow authenticated insert on article_categories" ON public.article_categories;
DROP POLICY IF EXISTS "Allow authenticated update on article_categories" ON public.article_categories;
DROP POLICY IF EXISTS "Allow authenticated delete on article_categories" ON public.article_categories;

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS trigger_update_category_count_on_article_categories ON public.article_categories;

-- Drop helper functions
DROP FUNCTION IF EXISTS public.update_article_categories(UUID, UUID[]);
DROP FUNCTION IF EXISTS public.get_article_categories(UUID[]);
DROP FUNCTION IF EXISTS public.update_category_article_count();

-- Drop indexes
DROP INDEX IF EXISTS public.idx_article_categories_article_id;
DROP INDEX IF EXISTS public.idx_article_categories_category_id;
DROP INDEX IF EXISTS public.idx_article_categories_composite;

-- Drop junction table
DROP TABLE IF EXISTS public.article_categories;

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

DO $$
DECLARE
    table_exists BOOLEAN;
    original_category_relationships INTEGER;
BEGIN
    -- Check if junction table still exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'article_categories'
    ) INTO table_exists;
    
    -- Check original category_id field
    SELECT COUNT(*) INTO original_category_relationships 
    FROM public.articles 
    WHERE category_id IS NOT NULL;
    
    RAISE NOTICE 'Rollback verification:';
    RAISE NOTICE '- Junction table exists: %', table_exists;
    RAISE NOTICE '- Articles with original category_id: %', original_category_relationships;
    
    IF NOT table_exists THEN
        RAISE NOTICE '✅ Junction table rollback completed successfully!';
        RAISE NOTICE '✅ System reverted to single category_id field';
    ELSE
        RAISE WARNING '⚠️ Junction table still exists - rollback may be incomplete';
    END IF;
END;
$$;

-- Commit transaction
COMMIT;

-- =====================================================
-- ROLLBACK COMPLETED
-- =====================================================

-- Note: After running this rollback:
-- 1. The junction table and all related objects are removed
-- 2. The original category_id field in articles table remains intact
-- 3. You may need to update your application code to use single categories again
-- 4. Consider updating ArticlesService to remove junction table methods

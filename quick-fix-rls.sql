-- =====================================================
-- QUICK FIX FOR RLS AND TRIGGER ISSUES
-- =====================================================

BEGIN;

-- 1. Drop problematic trigger and function
DROP TRIGGER IF EXISTS trigger_update_category_count_on_article_categories ON public.article_categories;
DROP FUNCTION IF EXISTS public.update_category_article_count();

-- 2. Drop and recreate the database function with SECURITY DEFINER
DROP FUNCTION IF EXISTS public.update_article_categories(UUID, UUID[]);

CREATE OR REPLACE FUNCTION public.update_article_categories(
    article_uuid UUID,
    new_category_ids UUID[]
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete existing relationships for this article
    DELETE FROM public.article_categories WHERE article_id = article_uuid;
    
    -- Insert new relationships if any categories provided
    IF new_category_ids IS NOT NULL AND array_length(new_category_ids, 1) > 0 THEN
        INSERT INTO public.article_categories (article_id, category_id, created_at)
        SELECT article_uuid, unnest(new_category_ids), NOW();
    END IF;
    
    RAISE NOTICE 'Updated categories for article %: % categories', article_uuid, 
        CASE WHEN new_category_ids IS NULL THEN 0 ELSE array_length(new_category_ids, 1) END;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.update_article_categories(UUID, UUID[]) TO public;
GRANT EXECUTE ON FUNCTION public.update_article_categories(UUID, UUID[]) TO anon;
GRANT EXECUTE ON FUNCTION public.update_article_categories(UUID, UUID[]) TO authenticated;

-- 4. Update RLS policies (drop all first, then recreate)
DROP POLICY IF EXISTS "Allow public read access on article_categories" ON public.article_categories;
DROP POLICY IF EXISTS "Allow authenticated insert on article_categories" ON public.article_categories;
DROP POLICY IF EXISTS "Allow authenticated update on article_categories" ON public.article_categories;
DROP POLICY IF EXISTS "Allow authenticated delete on article_categories" ON public.article_categories;
DROP POLICY IF EXISTS "Allow admin operations on article_categories" ON public.article_categories;

-- Create simple policies that allow all operations
CREATE POLICY "Allow all read on article_categories"
ON public.article_categories
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow all write on article_categories"
ON public.article_categories
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 5. Verification
DO $$
DECLARE
    policy_count INTEGER;
    function_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'article_categories' 
    AND schemaname = 'public';
    
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'update_article_categories'
    ) INTO function_exists;
    
    RAISE NOTICE '✅ Quick fix completed:';
    RAISE NOTICE '- Policies on article_categories: %', policy_count;
    RAISE NOTICE '- Function exists: %', function_exists;
    RAISE NOTICE '- Problematic trigger removed';
    RAISE NOTICE '- SECURITY DEFINER function created';
END;
$$;

COMMIT;

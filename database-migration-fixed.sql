-- =====================================================
-- JUNCTION TABLE MIGRATION SCRIPT (FIXED VERSION)
-- =====================================================
-- This script creates a proper many-to-many relationship between
-- articles and categories using a junction table approach.
-- It migrates existing data from the category_id field.

-- Begin transaction
BEGIN;

-- =====================================================
-- 1. CREATE JUNCTION TABLE
-- =====================================================

-- Create the junction table for article-category relationships
CREATE TABLE IF NOT EXISTS public.article_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL,
    category_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure unique article-category combinations
    CONSTRAINT unique_article_category UNIQUE (article_id, category_id),
    
    -- Foreign key constraints
    CONSTRAINT fk_article_categories_article_id 
        FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_article_categories_category_id 
        FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for article_id lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_article_categories_article_id 
ON public.article_categories (article_id);

-- Index for category_id lookups
CREATE INDEX IF NOT EXISTS idx_article_categories_category_id 
ON public.article_categories (category_id);

-- Composite index for efficient joins
CREATE INDEX IF NOT EXISTS idx_article_categories_composite 
ON public.article_categories (article_id, category_id);

-- =====================================================
-- 3. MIGRATE EXISTING DATA
-- =====================================================

-- Function to migrate data from existing category_id field to junction table
CREATE OR REPLACE FUNCTION migrate_article_categories_data()
RETURNS void AS $$
DECLARE
    article_record RECORD;
    migrated_count INTEGER := 0;
BEGIN
    -- Loop through all articles that have a category_id
    FOR article_record IN 
        SELECT id, category_id 
        FROM public.articles 
        WHERE category_id IS NOT NULL
    LOOP
        -- Verify category exists and is active before inserting
        IF EXISTS (SELECT 1 FROM public.categories WHERE id = article_record.category_id AND is_active = true) THEN
            INSERT INTO public.article_categories (article_id, category_id, created_at)
            VALUES (article_record.id, article_record.category_id, NOW())
            ON CONFLICT (article_id, category_id) DO NOTHING;
            
            migrated_count := migrated_count + 1;
        ELSE
            RAISE NOTICE 'Skipping article % - category % does not exist or is inactive', 
                article_record.id, article_record.category_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Article categories migration completed successfully';
    RAISE NOTICE 'Migrated % article-category relationships', migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_article_categories_data();

-- Drop the migration function (cleanup)
DROP FUNCTION IF EXISTS migrate_article_categories_data();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on the junction table
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access on article_categories"
ON public.article_categories
FOR SELECT
TO public
USING (true);

-- Policy: Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert on article_categories"
ON public.article_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated update on article_categories"
ON public.article_categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete on article_categories"
ON public.article_categories
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- 5. HELPER FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to update categories for an article
CREATE OR REPLACE FUNCTION update_article_categories(
    article_uuid UUID,
    new_category_ids UUID[]
)
RETURNS void AS $$
BEGIN
    -- Delete existing relationships for this article
    DELETE FROM public.article_categories WHERE article_id = article_uuid;
    
    -- Insert new relationships if any categories provided
    IF new_category_ids IS NOT NULL AND array_length(new_category_ids, 1) > 0 THEN
        INSERT INTO public.article_categories (article_id, category_id)
        SELECT article_uuid, unnest(new_category_ids);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get categories for multiple articles (for efficient bulk loading)
CREATE OR REPLACE FUNCTION get_article_categories(article_ids UUID[])
RETURNS TABLE (
    article_id UUID,
    category_id UUID,
    category_name TEXT,
    category_slug TEXT,
    category_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.article_id,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug,
        c.description as category_description
    FROM public.article_categories ac
    INNER JOIN public.categories c ON c.id = ac.category_id
    WHERE ac.article_id = ANY(article_ids)
    AND c.is_active = true
    ORDER BY ac.article_id, c.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS FOR MAINTAINING CATEGORY COUNTS
-- =====================================================

-- Function to update category article counts
CREATE OR REPLACE FUNCTION update_category_article_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update count for affected categories
    IF TG_OP = 'INSERT' THEN
        UPDATE public.categories 
        SET article_count = (
            SELECT COUNT(DISTINCT ac.article_id)
            FROM public.article_categories ac
            INNER JOIN public.articles a ON a.id = ac.article_id
            WHERE ac.category_id = NEW.category_id
            AND a.status = 'published'
        )
        WHERE id = NEW.category_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.categories 
        SET article_count = (
            SELECT COUNT(DISTINCT ac.article_id)
            FROM public.article_categories ac
            INNER JOIN public.articles a ON a.id = ac.article_id
            WHERE ac.category_id = OLD.category_id
            AND a.status = 'published'
        )
        WHERE id = OLD.category_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for maintaining category counts
DROP TRIGGER IF EXISTS trigger_update_category_count_on_article_categories ON public.article_categories;
CREATE TRIGGER trigger_update_category_count_on_article_categories
    AFTER INSERT OR DELETE ON public.article_categories
    FOR EACH ROW EXECUTE FUNCTION update_category_article_count();

-- =====================================================
-- 7. VALIDATION AND VERIFICATION
-- =====================================================

-- Verify migration results
DO $$
DECLARE
    original_single_categories INTEGER;
    junction_relationships INTEGER;
    articles_with_categories INTEGER;
    categories_referenced INTEGER;
BEGIN
    -- Count original single category relationships
    SELECT COUNT(*) INTO original_single_categories 
    FROM public.articles 
    WHERE category_id IS NOT NULL;
    
    -- Count junction table relationships
    SELECT COUNT(*) INTO junction_relationships 
    FROM public.article_categories;
    
    -- Count articles that now have categories in junction table
    SELECT COUNT(DISTINCT article_id) INTO articles_with_categories
    FROM public.article_categories;
    
    -- Count unique categories referenced in junction table
    SELECT COUNT(DISTINCT category_id) INTO categories_referenced
    FROM public.article_categories;
    
    RAISE NOTICE 'Migration verification:';
    RAISE NOTICE '- Original articles with category_id: %', original_single_categories;
    RAISE NOTICE '- Junction table relationships created: %', junction_relationships;
    RAISE NOTICE '- Articles with categories in junction table: %', articles_with_categories;
    RAISE NOTICE '- Unique categories referenced: %', categories_referenced;
    
    IF junction_relationships >= original_single_categories THEN
        RAISE NOTICE '✅ Migration completed successfully!';
        RAISE NOTICE '✅ All articles with category_id have been migrated to junction table';
    ELSE
        RAISE WARNING '⚠️ Migration may be incomplete. Expected at least % relationships, got %', 
            original_single_categories, junction_relationships;
    END IF;
END;
$$;

-- Commit transaction
COMMIT;

-- =====================================================
-- MIGRATION COMPLETED SUCCESSFULLY
-- =====================================================

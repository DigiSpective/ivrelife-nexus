-- =====================================================
-- MAKE CLAIMS COLUMNS NULLABLE
-- =====================================================
-- This script makes retailer_id and location_id nullable
-- since not all users have these values
-- =====================================================

-- Make retailer_id nullable
ALTER TABLE public.claims ALTER COLUMN retailer_id DROP NOT NULL;

-- Make location_id nullable (if it has NOT NULL constraint)
ALTER TABLE public.claims ALTER COLUMN location_id DROP NOT NULL;

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'claims'
AND column_name IN ('retailer_id', 'location_id', 'product_id')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '✅ Claims columns updated!';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✓ retailer_id is now nullable';
    RAISE NOTICE '✓ location_id is now nullable';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now create claims without';
    RAISE NOTICE 'providing retailer_id or location_id';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- CHECK USER_STORAGE TABLE STRUCTURE
-- ============================================================================
-- This will show us the actual structure of the user_storage table
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Check if user_storage table exists
SELECT 'CHECKING IF USER_STORAGE EXISTS...' as step;

SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_storage' AND table_schema = 'public'
    ) THEN 'YES - user_storage table exists' 
    ELSE 'NO - user_storage table does not exist' 
    END as table_exists;

-- Show actual table structure
SELECT 'ACTUAL USER_STORAGE TABLE STRUCTURE...' as step;

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_storage' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show any data that exists
SELECT 'EXISTING DATA IN USER_STORAGE...' as step;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_storage' AND table_schema = 'public') THEN
        -- Check if table has any data
        DECLARE
            row_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO row_count FROM user_storage;
            RAISE NOTICE 'user_storage has % rows', row_count;
            
            -- Show sample data if any exists
            IF row_count > 0 THEN
                RAISE NOTICE 'Sample data:';
                PERFORM * FROM user_storage LIMIT 5;
            END IF;
        END;
    ELSE
        RAISE NOTICE 'user_storage table does not exist';
    END IF;
END $$;

-- Show all tables that contain 'storage' in the name
SELECT 'TABLES CONTAINING "STORAGE"...' as step;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (table_name ILIKE '%storage%' OR table_name ILIKE '%user%')
ORDER BY table_name;

SELECT 'INVESTIGATION COMPLETE!' as status;
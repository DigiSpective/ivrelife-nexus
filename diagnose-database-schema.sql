-- ============================================================================
-- DIAGNOSE DATABASE SCHEMA
-- ============================================================================
-- Run this first to see what tables and columns exist in your database
-- This will help us understand the current schema before making changes
-- ============================================================================

-- Show all tables in the public schema
SELECT 
    'EXISTING TABLES:' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Show columns for customers table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='customers') THEN
        RAISE NOTICE '================================================================';
        RAISE NOTICE 'CUSTOMERS TABLE COLUMNS:';
        RAISE NOTICE '================================================================';
    END IF;
END $$;

SELECT 
    'CUSTOMERS COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- Show columns for retailers table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='retailers') THEN
        RAISE NOTICE '================================================================';
        RAISE NOTICE 'RETAILERS TABLE COLUMNS:';
        RAISE NOTICE '================================================================';
    END IF;
END $$;

SELECT 
    'RETAILERS COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'retailers' 
ORDER BY ordinal_position;

-- Show columns for products table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='products') THEN
        RAISE NOTICE '================================================================';
        RAISE NOTICE 'PRODUCTS TABLE COLUMNS:';
        RAISE NOTICE '================================================================';
    END IF;
END $$;

SELECT 
    'PRODUCTS COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Show columns for orders table if it exists
SELECT 
    'ORDERS COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Show columns for user_storage table if it exists
SELECT 
    'USER_STORAGE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_storage' 
ORDER BY ordinal_position;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'DIAGNOSIS COMPLETE';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Check the query results above to see:';
    RAISE NOTICE '1. What tables currently exist';
    RAISE NOTICE '2. What columns each table has';
    RAISE NOTICE '3. Any schema mismatches';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Next: Run the schema-aware script based on these results';
    RAISE NOTICE '================================================================';
END $$;
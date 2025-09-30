-- ============================================================================
-- COMPREHENSIVE DATABASE SCHEMA DIAGNOSIS
-- ============================================================================
-- This will show us all existing tables and their schemas
-- Focus on: customers, orders, claims, shipments, products
-- ============================================================================

-- Show all tables in the public schema
SELECT 
    'ALL EXISTING TABLES:' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- CUSTOMERS TABLE (should be working now)
-- ============================================================================
SELECT 
    'CUSTOMERS TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
SELECT 
    'ORDERS TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- ============================================================================
-- CLAIMS TABLE
-- ============================================================================
SELECT 
    'CLAIMS TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'claims' 
ORDER BY ordinal_position;

-- ============================================================================
-- SHIPMENTS TABLE
-- ============================================================================
SELECT 
    'SHIPMENTS TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shipments' 
ORDER BY ordinal_position;

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
SELECT 
    'PRODUCTS TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- ============================================================================
-- USER_STORAGE TABLE (should be working)
-- ============================================================================
SELECT 
    'USER_STORAGE TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_storage' 
ORDER BY ordinal_position;

-- ============================================================================
-- RETAILERS TABLE
-- ============================================================================
SELECT 
    'RETAILERS TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'retailers' 
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK FOR MISSING TABLES
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'TABLE EXISTENCE CHECK:';
    RAISE NOTICE '================================================================';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='customers') THEN
        RAISE NOTICE '✅ customers table EXISTS';
    ELSE
        RAISE NOTICE '❌ customers table MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='orders') THEN
        RAISE NOTICE '✅ orders table EXISTS';
    ELSE
        RAISE NOTICE '❌ orders table MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='claims') THEN
        RAISE NOTICE '✅ claims table EXISTS';
    ELSE
        RAISE NOTICE '❌ claims table MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='shipments') THEN
        RAISE NOTICE '✅ shipments table EXISTS';
    ELSE
        RAISE NOTICE '❌ shipments table MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='products') THEN
        RAISE NOTICE '✅ products table EXISTS';
    ELSE
        RAISE NOTICE '❌ products table MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_storage') THEN
        RAISE NOTICE '✅ user_storage table EXISTS';
    ELSE
        RAISE NOTICE '❌ user_storage table MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='retailers') THEN
        RAISE NOTICE '✅ retailers table EXISTS';
    ELSE
        RAISE NOTICE '❌ retailers table MISSING';
    END IF;
    
    RAISE NOTICE '================================================================';
END $$;
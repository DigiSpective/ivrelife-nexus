-- ============================================================================
-- INVESTIGATE ACTUAL DATABASE STRUCTURE
-- ============================================================================
-- This will show us exactly what exists in the database
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Check if orders table exists and its structure
SELECT 'CHECKING ORDERS TABLE...' as step;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what enum types exist in the database
SELECT 'CHECKING ENUM TYPES...' as step;

SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typtype = 'e'
ORDER BY t.typname, e.enumsortorder;

-- Check what tables exist
SELECT 'CHECKING ALL TABLES...' as step;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check for any triggers on orders table
SELECT 'CHECKING TRIGGERS...' as step;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'orders'
AND trigger_schema = 'public';

-- Check for any functions that might be setting status
SELECT 'CHECKING FUNCTIONS...' as step;

SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition ILIKE '%status%'
AND routine_definition ILIKE '%completed%';

-- Try to see what happens when we describe the orders table
SELECT 'ORDERS TABLE CONSTRAINTS...' as step;

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass;

-- Check if we can insert into orders with minimal data
SELECT 'TESTING MINIMAL INSERT...' as step;

-- First check what exactly is in orders table
DO $$
DECLARE
    rec record;
BEGIN
    -- Check if orders table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        RAISE NOTICE 'Orders table EXISTS';
        
        -- Try to insert with minimal data
        BEGIN
            INSERT INTO orders DEFAULT VALUES;
            RAISE NOTICE 'SUCCESS: Can insert with DEFAULT VALUES';
            -- Clean up
            DELETE FROM orders WHERE created_at > NOW() - INTERVAL '1 minute';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'FAILED: Cannot insert with DEFAULT VALUES - %', SQLERRM;
        END;
        
        -- Try to insert with just total_amount
        BEGIN
            INSERT INTO orders (total_amount) VALUES (1.00);
            RAISE NOTICE 'SUCCESS: Can insert with total_amount only';
            -- Clean up
            DELETE FROM orders WHERE total_amount = 1.00 AND created_at > NOW() - INTERVAL '1 minute';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'FAILED: Cannot insert with total_amount - %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE 'Orders table does NOT exist';
    END IF;
END $$;

-- Show current state summary
SELECT 'DATABASE STATE SUMMARY:' as final_step;
SELECT 
    'Orders table exists: ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN 'YES' ELSE 'NO' END as orders_table,
    'Enum types count: ' || COUNT(*) as enum_count
FROM pg_type 
WHERE typtype = 'e';

SELECT 'INVESTIGATION COMPLETE!' as status;
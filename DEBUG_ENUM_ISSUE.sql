-- ============================================================================
-- DEBUG ENUM ISSUE - FIND THE SOURCE OF THE PROBLEM
-- ============================================================================
-- This will help us understand why the enum error persists
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Check if ANY enum types exist
SELECT 'CHECKING FOR ENUM TYPES...' as step;
SELECT 
    typname as enum_name,
    'Found enum type' as status
FROM pg_type 
WHERE typtype = 'e'
ORDER BY typname;

-- Step 2: Check the orders table structure specifically
SELECT 'CHECKING ORDERS TABLE STRUCTURE...' as step;
SELECT 
    column_name,
    data_type,
    udt_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
AND column_name = 'status'
ORDER BY ordinal_position;

-- Step 3: Check for any CHECK constraints on orders table
SELECT 'CHECKING CONSTRAINTS ON ORDERS TABLE...' as step;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass;

-- Step 4: Check for triggers on orders table that might set status
SELECT 'CHECKING TRIGGERS ON ORDERS TABLE...' as step;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'orders'
AND trigger_schema = 'public';

-- Step 5: Check for functions that reference order_status or set status to completed
SELECT 'CHECKING FUNCTIONS THAT REFERENCE ORDER STATUS...' as step;
SELECT 
    routine_name,
    routine_type,
    SUBSTRING(routine_definition, 1, 200) as definition_preview
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (
    routine_definition ILIKE '%order_status%' 
    OR routine_definition ILIKE '%completed%'
    OR routine_definition ILIKE '%status%'
)
ORDER BY routine_name;

-- Step 6: Try to manually insert an order with default status
SELECT 'TESTING MANUAL INSERT WITH DEFAULT STATUS...' as step;
DO $$
DECLARE
    test_order_id UUID;
BEGIN
    -- Test 1: Insert with no status field (should use default)
    BEGIN
        INSERT INTO orders (
            retailer_id, 
            customer_id, 
            created_by, 
            total_amount, 
            notes
        ) VALUES (
            '550e8400-e29b-41d4-a716-446655440000',
            'dc0abfde-8588-4107-ab9b-1d5f2a91bce2',
            '5c325c42-7489-41a4-a75a-c2a52b6603a5',
            299.99,
            'Debug test - no status field'
        ) RETURNING id INTO test_order_id;
        
        RAISE NOTICE 'SUCCESS: Default status insert worked - Order ID: %', test_order_id;
        
        -- Check what status was actually set
        DECLARE
            actual_status TEXT;
        BEGIN
            SELECT status INTO actual_status FROM orders WHERE id = test_order_id;
            RAISE NOTICE 'Actual status set: "%"', actual_status;
        END;
        
        -- Clean up
        DELETE FROM orders WHERE id = test_order_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: Default status insert failed - %', SQLERRM;
    END;
    
    -- Test 2: Insert with explicit pending status
    BEGIN
        INSERT INTO orders (
            retailer_id, 
            customer_id, 
            created_by, 
            status,
            total_amount, 
            notes
        ) VALUES (
            '550e8400-e29b-41d4-a716-446655440000',
            'dc0abfde-8588-4107-ab9b-1d5f2a91bce2',
            '5c325c42-7489-41a4-a75a-c2a52b6603a5',
            'pending',
            299.99,
            'Debug test - explicit pending status'
        ) RETURNING id INTO test_order_id;
        
        RAISE NOTICE 'SUCCESS: Explicit pending status insert worked - Order ID: %', test_order_id;
        
        -- Clean up
        DELETE FROM orders WHERE id = test_order_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: Explicit pending status insert failed - %', SQLERRM;
    END;
    
    -- Test 3: Try to insert with completed status to trigger the error
    BEGIN
        INSERT INTO orders (
            retailer_id, 
            customer_id, 
            created_by, 
            status,
            total_amount, 
            notes
        ) VALUES (
            '550e8400-e29b-41d4-a716-446655440000',
            'dc0abfde-8588-4107-ab9b-1d5f2a91bce2',
            '5c325c42-7489-41a4-a75a-c2a52b6603a5',
            'completed',
            299.99,
            'Debug test - explicit completed status'
        ) RETURNING id INTO test_order_id;
        
        RAISE NOTICE 'SUCCESS: Explicit completed status insert worked - Order ID: %', test_order_id;
        
        -- Clean up
        DELETE FROM orders WHERE id = test_order_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: Explicit completed status insert failed - %', SQLERRM;
        RAISE NOTICE 'This is likely the source of our problem!';
    END;
    
END $$;

-- Step 7: Show current schema information
SELECT 'CURRENT DATABASE STATE...' as step;

-- Show if orders table exists and basic info
SELECT 
    'Orders table exists: ' || 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'orders' AND table_schema = 'public'
    ) THEN 'YES' ELSE 'NO' END as orders_table_status;

-- Count enum types
SELECT 
    'Total enum types in database: ' || COUNT(*) as enum_count
FROM pg_type 
WHERE typtype = 'e';

-- Show orders table column info
SELECT 
    'Orders table status column info:' as column_info;
SELECT 
    column_name,
    data_type,
    udt_name,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
AND column_name = 'status';

SELECT 'DEBUG COMPLETE!' as final_status;
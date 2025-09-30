-- =====================================================
-- RELOAD SUPABASE SCHEMA CACHE
-- This forces PostgREST to reload the schema definition
-- =====================================================

-- Step 1: Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Step 2: Check if we're looking at the right orders table
SELECT
    'Current orders table schema' as info,
    table_schema,
    table_name,
    column_name,
    data_type,
    udt_name,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Step 3: Check ALL schemas for orders tables (in case there are multiple)
SELECT
    'All orders tables in database' as info,
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'orders';

-- Step 4: Verify NO enum types exist anywhere
SELECT
    'All enum types in database (should be empty)' as info,
    n.nspname as schema,
    t.typname as enum_name
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE t.typtype = 'e'
ORDER BY n.nspname, t.typname;

-- Step 5: Check the exact column type for status
SELECT
    'Status column exact type' as info,
    pg_typeof(status) as postgres_type,
    data_type as info_schema_type
FROM orders
LIMIT 0;

-- If the above fails, the table doesn't exist or has no status column

-- Step 6: Try a direct insert to bypass Supabase REST API
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO orders (
        retailer_id,
        customer_id,
        created_by,
        total_amount,
        notes
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440000'::uuid,
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        '550e8400-e29b-41d4-a716-446655440002'::uuid,
        100.00,
        'Direct SQL test'
    )
    RETURNING id INTO test_id;

    RAISE NOTICE '✅ DIRECT INSERT SUCCESSFUL - ID: %', test_id;
    RAISE NOTICE 'Status value: %', (SELECT status FROM orders WHERE id = test_id);

    DELETE FROM orders WHERE id = test_id;
    RAISE NOTICE 'Test order cleaned up';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ DIRECT INSERT FAILED: % (Code: %)', SQLERRM, SQLSTATE;
END $$;

SELECT '✅ Schema cache reload requested' as status;
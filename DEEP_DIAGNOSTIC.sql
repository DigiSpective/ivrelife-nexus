-- =====================================================
-- DEEP DIAGNOSTIC - Find Hidden Enum References
-- =====================================================

-- 1. Check for triggers on orders table
SELECT
    'TRIGGERS ON ORDERS TABLE' as check_type,
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'orders';

-- 2. Check for functions that might reference order_status enum
SELECT
    'FUNCTIONS REFERENCING STATUS' as check_type,
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname LIKE '%order%' OR proname LIKE '%status%';

-- 3. Check ALL enum types (not just status)
SELECT
    'ALL ENUM TYPES' as check_type,
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
GROUP BY t.typname
ORDER BY t.typname;

-- 4. Check orders table constraints (all types)
SELECT
    'ALL CONSTRAINTS ON ORDERS' as check_type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass;

-- 5. Check for views that might have enum casts
SELECT
    'VIEWS INVOLVING ORDERS' as check_type,
    table_name as view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND (view_definition LIKE '%order%' OR view_definition LIKE '%status%');

-- 6. Check the actual orders table definition
SELECT
    'ORDERS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    udt_name,
    column_default,
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 7. Check for domain types that might enforce enums
SELECT
    'DOMAIN TYPES' as check_type,
    domain_name,
    data_type,
    domain_default
FROM information_schema.domains
WHERE domain_schema = 'public';

-- 8. Try to find where 'completed' is being set
SELECT
    'SEARCHING FOR COMPLETED VALUE' as check_type,
    'Check triggers, functions, and defaults for "completed" value' as hint;
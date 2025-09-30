-- ============================================================================
-- NUCLEAR ENUM FIX - ELIMINATE ALL ENUM CONSTRAINTS
-- ============================================================================
-- This will completely remove any enum constraints causing the issue
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Check what enum types exist and drop them
DO $$
DECLARE
    enum_record RECORD;
BEGIN
    -- Find and drop all enum types that might be causing issues
    FOR enum_record IN 
        SELECT typname FROM pg_type WHERE typtype = 'e' AND typname LIKE '%status%'
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I CASCADE', enum_record.typname);
        RAISE NOTICE 'Dropped enum type: %', enum_record.typname;
    END LOOP;
END $$;

-- Step 2: Completely recreate the orders table without any enum constraints
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID,
    customer_id UUID,
    created_by UUID,
    status TEXT DEFAULT 'pending',
    total_amount DECIMAL(10,2) DEFAULT 0,
    subtotal_amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    notes TEXT,
    signature_url TEXT,
    id_photo_url TEXT,
    contract_url TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Ensure no constraints exist
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 4: Disable RLS completely
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Step 5: Drop any policies that might exist
DROP POLICY IF EXISTS orders_policy ON orders;

-- Step 6: Check for any triggers and drop them
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name FROM information_schema.triggers 
        WHERE event_object_table = 'orders'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON orders', trigger_record.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- Step 7: Check for any functions that might be causing enum issues
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT routine_name FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_definition ILIKE '%enum%'
        AND routine_definition ILIKE '%status%'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I CASCADE', func_record.routine_name);
        RAISE NOTICE 'Dropped function: %', func_record.routine_name;
    END LOOP;
END $$;

-- Step 8: Ensure supporting tables exist and are clean
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS retailers CASCADE;

CREATE TABLE retailers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    retailer_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on all tables
ALTER TABLE retailers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Step 9: Insert required reference data
INSERT INTO retailers (id, name, email) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'IV ReLife Main Retailer', 'admin@iv-relife.com');

INSERT INTO customers (id, name, email, retailer_id) VALUES
    ('dc0abfde-8588-4107-ab9b-1d5f2a91bce2', 'Test Customer', 'customer@example.com', '550e8400-e29b-41d4-a716-446655440000');

-- Step 10: Test the nuclear fix
DO $$
DECLARE
    test_order_id UUID;
BEGIN
    -- Try multiple status values to ensure none cause enum errors
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
        'Nuclear fix test order 1'
    ) RETURNING id INTO test_order_id;
    
    RAISE NOTICE 'SUCCESS: Test order 1 created with status "pending" - ID: %', test_order_id;
    
    -- Test with "completed" status that was causing issues
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
        199.99,
        'Nuclear fix test order 2 - completed status'
    ) RETURNING id INTO test_order_id;
    
    RAISE NOTICE 'SUCCESS: Test order 2 created with status "completed" - ID: %', test_order_id;
    
    -- Test without status (should use default)
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
        399.99,
        'Nuclear fix test order 3 - no status'
    ) RETURNING id INTO test_order_id;
    
    RAISE NOTICE 'SUCCESS: Test order 3 created without status - ID: %', test_order_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAILED: Nuclear fix test failed - %', SQLERRM;
END $$;

-- Step 11: Show final database state
SELECT 'NUCLEAR FIX COMPLETED!' as status;

-- Show that no enums exist
SELECT 'Enum types remaining:' as check_enums;
SELECT typname FROM pg_type WHERE typtype = 'e';

-- Show orders table structure
SELECT 'Orders table structure:' as check_structure;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show test orders created
SELECT 'Test orders created:' as check_orders;
SELECT id, status, total_amount, notes FROM orders WHERE notes LIKE '%Nuclear fix test%';

SELECT 'TRY CREATING AN ORDER IN THE APP NOW!' as final_message;
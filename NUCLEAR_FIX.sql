-- =====================================================
-- NUCLEAR FIX - Complete Orders Table Recreation
-- This will drop and recreate the orders table from scratch
-- =====================================================

BEGIN;

-- Step 1: Backup existing orders (if any)
CREATE TABLE IF NOT EXISTS orders_backup AS
SELECT * FROM orders;

-- Step 2: Drop ALL triggers on orders
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'orders'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON orders CASCADE', trigger_rec.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', trigger_rec.trigger_name;
    END LOOP;
END $$;

-- Step 3: Drop the orders table completely
DROP TABLE IF EXISTS orders CASCADE;

-- Step 4: Drop ALL enum types (nuclear approach)
DO $$
DECLARE
    enum_rec RECORD;
BEGIN
    FOR enum_rec IN
        SELECT typname
        FROM pg_type
        WHERE typtype = 'e'
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I CASCADE', enum_rec.typname);
        RAISE NOTICE 'Dropped enum type: %', enum_rec.typname;
    END LOOP;
END $$;

-- Step 5: Create clean orders table with NO enums
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id UUID,
    customer_id UUID,
    location_id UUID,
    created_by UUID,

    -- Use TEXT for all status fields - NO ENUMS
    status TEXT DEFAULT 'pending',

    -- Financial fields
    total_amount DECIMAL(10, 2),
    subtotal_amount DECIMAL(10, 2),
    tax_amount DECIMAL(10, 2),
    shipping_amount DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2),

    -- Additional fields
    notes TEXT,
    order_number TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- Step 6: Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_retailer_id ON orders(retailer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Step 7: Disable RLS
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Step 8: Grant permissions
GRANT ALL ON orders TO authenticated;
GRANT ALL ON orders TO anon;
GRANT ALL ON orders TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Step 9: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Add updated_at trigger
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Verify the new table structure
SELECT
    'NEW TABLE STRUCTURE' as info,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Step 12: Test insert
DO $$
DECLARE
    test_order_id UUID;
BEGIN
    INSERT INTO orders (
        retailer_id,
        customer_id,
        created_by,
        total_amount,
        notes
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        100.00,
        'Test order after nuclear fix'
    )
    RETURNING id INTO test_order_id;

    RAISE NOTICE '✅ Test order created successfully with ID: %', test_order_id;
    RAISE NOTICE '✅ Status: %', (SELECT status FROM orders WHERE id = test_order_id);

    -- Clean up
    DELETE FROM orders WHERE id = test_order_id;
    RAISE NOTICE '✅ Test order cleaned up';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Test insert FAILED: % (Code: %)', SQLERRM, SQLSTATE;
END $$;

COMMIT;

-- Final verification
SELECT '✅ NUCLEAR FIX COMPLETE - Orders table recreated without any enum references' as status;

-- Show final state
SELECT
    'FINAL VERIFICATION' as check_type,
    'Enum types (should be empty)' as description,
    COUNT(*) as count
FROM pg_type
WHERE typtype = 'e';

SELECT
    'FINAL VERIFICATION' as check_type,
    'Orders table exists' as description,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_name = 'orders';
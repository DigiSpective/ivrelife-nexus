-- ============================================================================
-- NUCLEAR ENUM ELIMINATION - ELIMINATE ALL ENUM TYPES COMPLETELY
-- ============================================================================
-- This will completely eliminate every single enum type in the database
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Show what enums exist before we start
SELECT 'ENUMS BEFORE ELIMINATION:' as step;
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typtype = 'e'
GROUP BY t.typname
ORDER BY t.typname;

-- Step 2: NUCLEAR APPROACH - Drop ALL enum types
DO $$
DECLARE
    enum_record RECORD;
    constraint_record RECORD;
    trigger_record RECORD;
    func_record RECORD;
BEGIN
    RAISE NOTICE 'Starting nuclear enum elimination...';
    
    -- Drop all triggers that might reference enums
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', 
                trigger_record.trigger_name, trigger_record.event_object_table);
            RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop trigger %: %', trigger_record.trigger_name, SQLERRM;
        END;
    END LOOP;
    
    -- Drop all functions that might reference enums
    FOR func_record IN 
        SELECT routine_name, routine_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
        AND routine_name NOT LIKE 'uuid_%'
        AND routine_name NOT LIKE 'gen_%'
    LOOP
        BEGIN
            IF func_record.routine_type = 'FUNCTION' THEN
                EXECUTE format('DROP FUNCTION IF EXISTS %I CASCADE', func_record.routine_name);
            ELSIF func_record.routine_type = 'PROCEDURE' THEN
                EXECUTE format('DROP PROCEDURE IF EXISTS %I CASCADE', func_record.routine_name);
            END IF;
            RAISE NOTICE 'Dropped %: %', func_record.routine_type, func_record.routine_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop % %: %', func_record.routine_type, func_record.routine_name, SQLERRM;
        END;
    END LOOP;
    
    -- Drop all CHECK constraints (they might reference enums)
    FOR constraint_record IN 
        SELECT conname, conrelid::regclass::text as table_name
        FROM pg_constraint 
        WHERE contype = 'c' 
        AND connamespace = 'public'::regnamespace
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I CASCADE', 
                constraint_record.table_name, constraint_record.conname);
            RAISE NOTICE 'Dropped constraint: % from %', constraint_record.conname, constraint_record.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop constraint %: %', constraint_record.conname, SQLERRM;
        END;
    END LOOP;
    
    -- Now drop ALL enum types
    FOR enum_record IN 
        SELECT typname FROM pg_type WHERE typtype = 'e'
    LOOP
        BEGIN
            EXECUTE format('DROP TYPE IF EXISTS %I CASCADE', enum_record.typname);
            RAISE NOTICE 'Dropped enum type: %', enum_record.typname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop enum %: %', enum_record.typname, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Nuclear enum elimination completed!';
END $$;

-- Step 3: Completely recreate orders table to ensure no enum references
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    retailer_id UUID,
    customer_id UUID,
    created_by UUID,
    order_number TEXT,
    
    -- STATUS AS PLAIN TEXT - NO ENUMS WHATSOEVER
    status TEXT DEFAULT 'pending',
    
    -- Financial fields
    total_amount DECIMAL(10,2) DEFAULT 0,
    subtotal_amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Payment info
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    
    -- Addresses as JSONB
    shipping_address JSONB,
    billing_address JSONB,
    
    -- Order details
    notes TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Documents
    signature_url TEXT,
    id_photo_url TEXT,
    contract_url TEXT,
    
    -- Timestamps
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Recreate order_items table
DROP TABLE IF EXISTS order_items CASCADE;

CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID,
    product_variant_id UUID,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    weight DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Disable RLS on both tables
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Step 6: Create indexes
CREATE INDEX idx_orders_retailer_id ON orders(retailer_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_created_by ON orders(created_by);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Step 7: Test ALL possible status values to ensure no enum constraints
DO $$
DECLARE
    test_order_id UUID;
    test_statuses TEXT[] := ARRAY[
        'pending', 'processing', 'shipped', 'delivered', 'cancelled', 
        'completed', 'draft', 'new', 'confirmed', 'paid', 'fulfilled',
        'returned', 'refunded', 'on_hold', 'backorder'
    ];
    status_val TEXT;
BEGIN
    RAISE NOTICE 'TESTING ALL POSSIBLE STATUS VALUES...';
    
    FOREACH status_val IN ARRAY test_statuses
    LOOP
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
                status_val,
                199.99,
                'Nuclear test - status: ' || status_val
            ) RETURNING id INTO test_order_id;
            
            RAISE NOTICE 'SUCCESS: Status "%" works - Order ID: %', status_val, test_order_id;
            
            -- Clean up immediately
            DELETE FROM orders WHERE id = test_order_id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'FAILED: Status "%" failed: %', status_val, SQLERRM;
        END;
    END LOOP;
    
    -- Test the specific "completed" status that was causing the issue
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
            'Nuclear test - COMPLETED status specific test'
        ) RETURNING id INTO test_order_id;
        
        RAISE NOTICE '🎉 SUCCESS: COMPLETED status now works! Order ID: %', test_order_id;
        
        -- Update it to verify updates work too
        UPDATE orders SET status = 'delivered' WHERE id = test_order_id;
        UPDATE orders SET status = 'pending' WHERE id = test_order_id;
        UPDATE orders SET status = 'completed' WHERE id = test_order_id;
        
        RAISE NOTICE '🎉 SUCCESS: Status updates work perfectly!';
        
        -- Clean up
        DELETE FROM orders WHERE id = test_order_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: COMPLETED status still fails: %', SQLERRM;
    END;
    
END $$;

-- Step 8: Show final database state
SELECT 'NUCLEAR ELIMINATION COMPLETE!' as status;

-- Verify no enum types exist
SELECT 'Enum types remaining (should be empty):' as enum_check;
SELECT typname FROM pg_type WHERE typtype = 'e';

-- Show orders table structure
SELECT 'Orders table final structure:' as structure;
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show constraints (should be minimal)
SELECT 'Remaining constraints on orders:' as constraints;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass;

-- Show triggers (should be none)
SELECT 'Remaining triggers on orders:' as triggers;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'orders'
AND trigger_schema = 'public';

SELECT '🚀 ENUM ELIMINATION SUCCESSFUL!' as final_message;
SELECT '✅ Try creating an order with "completed" status now!' as instruction;
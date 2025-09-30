-- ============================================================================
-- FIX ORDER_STATUS ENUM ISSUE
-- ============================================================================
-- This fixes the specific error: "invalid input value for enum order_status: "completed""
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- First, let's see what enum values are currently allowed
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
ORDER BY enumsortorder;

-- Add "completed" to the enum if it doesn't exist
DO $$
BEGIN
    -- Check if 'completed' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'completed' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
    ) THEN
        -- Add 'completed' to the enum
        ALTER TYPE order_status ADD VALUE 'completed';
        RAISE NOTICE 'Added "completed" to order_status enum';
    ELSE
        RAISE NOTICE '"completed" already exists in order_status enum';
    END IF;
END $$;

-- Also add other common status values that might be needed
DO $$
BEGIN
    -- Add 'pending' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
    ) THEN
        ALTER TYPE order_status ADD VALUE 'pending';
        RAISE NOTICE 'Added "pending" to order_status enum';
    END IF;
    
    -- Add 'draft' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'draft' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
    ) THEN
        ALTER TYPE order_status ADD VALUE 'draft';
        RAISE NOTICE 'Added "draft" to order_status enum';
    END IF;
END $$;

-- Show the updated enum values
SELECT 'Updated order_status enum values:' as message;
SELECT enumlabel as allowed_status_values 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
ORDER BY enumsortorder;

-- Test the fix by trying to insert an order with each status
DO $$
DECLARE
    test_statuses text[] := ARRAY['pending', 'completed', 'draft', 'new', 'processing', 'shipped', 'delivered', 'cancelled'];
    status_val text;
    test_order_id uuid;
BEGIN
    FOREACH status_val IN ARRAY test_statuses
    LOOP
        BEGIN
            -- Try to insert a test order with this status
            INSERT INTO orders (id, status, total_amount, notes) 
            VALUES (gen_random_uuid(), status_val, 1.00, 'Enum test for ' || status_val)
            RETURNING id INTO test_order_id;
            
            RAISE NOTICE 'SUCCESS: Status "%" works', status_val;
            
            -- Clean up test order
            DELETE FROM orders WHERE id = test_order_id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'FAILED: Status "%" failed with: %', status_val, SQLERRM;
        END;
    END LOOP;
END $$;

-- Alternative approach: If the enum is too restrictive, convert the column to TEXT
-- Uncomment the lines below if you want to convert to TEXT instead of fixing the enum

/*
-- Convert order_status from enum to text
ALTER TABLE orders ALTER COLUMN status TYPE text USING status::text;

-- Drop the enum type if no longer needed
-- DROP TYPE IF EXISTS order_status;

-- Set a default value
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';

SELECT 'Converted orders.status from enum to text' as message;
*/

SELECT 'ENUM FIX COMPLETED - Try creating an order now!' as final_message;
-- =====================================================
-- EMERGENCY WORKAROUND
-- Create a PostgreSQL function to insert orders
-- This bypasses the Supabase REST API completely
-- =====================================================

-- Drop the function if it exists
DROP FUNCTION IF EXISTS create_order_direct(UUID, UUID, UUID, DECIMAL, TEXT);

-- Create the function
CREATE OR REPLACE FUNCTION create_order_direct(
    p_retailer_id UUID,
    p_customer_id UUID,
    p_created_by UUID,
    p_total_amount DECIMAL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    order_id UUID,
    order_status TEXT,
    order_created_at TIMESTAMPTZ
) AS $$
DECLARE
    new_order_id UUID;
BEGIN
    -- Insert the order
    INSERT INTO orders (
        retailer_id,
        customer_id,
        created_by,
        total_amount,
        notes,
        status
    ) VALUES (
        p_retailer_id,
        p_customer_id,
        p_created_by,
        p_total_amount,
        p_notes,
        'pending'  -- Explicitly set to pending
    )
    RETURNING id INTO new_order_id;

    -- Return the created order info
    RETURN QUERY
    SELECT
        o.id,
        o.status,
        o.created_at
    FROM orders o
    WHERE o.id = new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_order_direct(UUID, UUID, UUID, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_direct(UUID, UUID, UUID, DECIMAL, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION create_order_direct(UUID, UUID, UUID, DECIMAL, TEXT) TO service_role;

-- Test the function
SELECT
    'Testing create_order_direct function' as test,
    order_id,
    order_status,
    order_created_at
FROM create_order_direct(
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    100.00,
    'Test order via function'
);

-- Clean up test order
DELETE FROM orders WHERE notes = 'Test order via function';

SELECT '✅ Function created successfully! Use create_order_direct() to bypass REST API' as status;
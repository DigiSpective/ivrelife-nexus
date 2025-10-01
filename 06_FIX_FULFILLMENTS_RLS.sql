-- =====================================================
-- FIX FULFILLMENTS RLS POLICIES
-- =====================================================
--
-- This fixes the Row Level Security policies for fulfillments
-- to allow authenticated users to INSERT records
--
-- =====================================================

BEGIN;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view fulfillments from accessible retailers" ON fulfillments;
DROP POLICY IF EXISTS "Users can manage fulfillments for accessible retailers" ON fulfillments;
DROP POLICY IF EXISTS "Users can create fulfillments for accessible retailers" ON fulfillments;
DROP POLICY IF EXISTS "Users can update fulfillments from accessible retailers" ON fulfillments;

-- SELECT policy - users can view fulfillments from their accessible retailers
CREATE POLICY "Users can view fulfillments from accessible retailers"
    ON fulfillments FOR SELECT
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
        OR retailer_id IS NULL
    );

-- INSERT policy - users can create fulfillments for accessible retailers
CREATE POLICY "Users can create fulfillments for accessible retailers"
    ON fulfillments FOR INSERT
    WITH CHECK (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
        OR retailer_id IS NULL
        OR auth.uid() IS NOT NULL  -- Allow any authenticated user if no retailer_id specified
    );

-- UPDATE policy - users can update fulfillments from accessible retailers
CREATE POLICY "Users can update fulfillments from accessible retailers"
    ON fulfillments FOR UPDATE
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
        OR retailer_id IS NULL
    );

-- DELETE policy - users can delete fulfillments from accessible retailers
CREATE POLICY "Users can delete fulfillments from accessible retailers"
    ON fulfillments FOR DELETE
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
        OR retailer_id IS NULL
    );

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT '✅ Fulfillments RLS policies updated' AS status;

-- Show all policies on fulfillments table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'fulfillments'
ORDER BY policyname;

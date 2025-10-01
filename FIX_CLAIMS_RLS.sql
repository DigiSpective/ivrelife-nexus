-- =====================================================
-- FIX CLAIMS RLS POLICY
-- =====================================================
-- This script allows authenticated users to create claims
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "allow_authenticated_insert_claims" ON public.claims;
DROP POLICY IF EXISTS "allow_authenticated_select_claims" ON public.claims;
DROP POLICY IF EXISTS "allow_authenticated_update_claims" ON public.claims;
DROP POLICY IF EXISTS "allow_authenticated_delete_claims" ON public.claims;

-- Enable RLS
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- SELECT: Allow authenticated users to view all claims
CREATE POLICY "allow_authenticated_select_claims"
    ON public.claims
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- INSERT: Allow authenticated users to create claims
CREATE POLICY "allow_authenticated_insert_claims"
    ON public.claims
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Allow authenticated users to update claims
CREATE POLICY "allow_authenticated_update_claims"
    ON public.claims
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: Allow authenticated users to delete claims
CREATE POLICY "allow_authenticated_delete_claims"
    ON public.claims
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Verify policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'claims'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '✅ Claims RLS policies created!';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✓ Authenticated users can now:';
    RAISE NOTICE '  - View claims';
    RAISE NOTICE '  - Create claims';
    RAISE NOTICE '  - Update claims';
    RAISE NOTICE '  - Delete claims';
    RAISE NOTICE '';
END $$;

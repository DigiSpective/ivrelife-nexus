-- =====================================================
-- RESTRICT USER MANAGEMENT TO OWNERS ONLY
-- =====================================================
-- Run this AFTER confirming users are visible
-- This tightens security so only owners can manage users
-- =====================================================

-- Step 1: Drop the temporary permissive policies
DROP POLICY IF EXISTS "temp_allow_select" ON public.users;
DROP POLICY IF EXISTS "temp_allow_insert" ON public.users;
DROP POLICY IF EXISTS "temp_allow_update" ON public.users;
DROP POLICY IF EXISTS "temp_allow_delete" ON public.users;

-- Step 2: Create owner-only policies using JWT metadata
-- These check the role from the JWT token, not from the database
-- This avoids infinite recursion

-- SELECT: Only owners can view all users
CREATE POLICY "owners_can_view_all_users"
    ON public.users
    FOR SELECT
    USING (
        -- Check if role in JWT is 'owner'
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
    );

-- SELECT: Users can view their own data
CREATE POLICY "users_can_view_self"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- INSERT: Only owners can create users
CREATE POLICY "owners_can_insert_users"
    ON public.users
    FOR INSERT
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
    );

-- UPDATE: Only owners can update any user
CREATE POLICY "owners_can_update_all_users"
    ON public.users
    FOR UPDATE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
    );

-- UPDATE: Users can update their own data (except role)
CREATE POLICY "users_can_update_self"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Note: We can't check role = OLD.role without causing recursion
        -- The application should enforce this
    );

-- DELETE: Only owners can delete users
CREATE POLICY "owners_can_delete_users"
    ON public.users
    FOR DELETE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
    );

-- Step 3: Verify new policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- =====================================================
-- DONE! User Management is now OWNER-ONLY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '✅ Access restricted to owners only!';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Only users with role = owner can now:';
    RAISE NOTICE '   - View all users';
    RAISE NOTICE '   - Create users';
    RAISE NOTICE '   - Edit users';
    RAISE NOTICE '   - Delete users';
    RAISE NOTICE '';
    RAISE NOTICE '✓ Other users can only view/edit themselves';
    RAISE NOTICE '';
END $$;

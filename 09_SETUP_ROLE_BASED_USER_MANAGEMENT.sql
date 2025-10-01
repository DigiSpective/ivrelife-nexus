-- =====================================================
-- ROLE-BASED ACCESS CONTROL FOR USERS TABLE
-- =====================================================
-- Only owners can manage users
-- No infinite recursion by using JWT claims instead of table queries
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Owners can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can update users" ON public.users;
DROP POLICY IF EXISTS "Users can delete users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can update users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can delete users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "allow_authenticated_select" ON public.users;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON public.users;
DROP POLICY IF EXISTS "allow_authenticated_update" ON public.users;
DROP POLICY IF EXISTS "allow_authenticated_delete" ON public.users;

-- Step 2: Create helper function to get user role from JWT
-- This function reads from auth.users metadata, NOT from public.users
-- This avoids infinite recursion
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    'location_user'
  );
$$;

-- Step 3: Create helper function to check if user is owner
CREATE OR REPLACE FUNCTION auth.is_owner()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT auth.user_role() = 'owner';
$$;

-- Step 4: Create helper function to check if user is admin or owner
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT auth.user_role() IN ('owner', 'backoffice');
$$;

-- Step 5: Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 6: Create role-based policies

-- POLICY 1: Owners can SELECT (view) all users
CREATE POLICY "owners_can_view_all_users"
    ON public.users
    FOR SELECT
    USING (
        auth.is_owner() = true
    );

-- POLICY 2: Users can view their own data
CREATE POLICY "users_can_view_self"
    ON public.users
    FOR SELECT
    USING (
        auth.uid() = id
    );

-- POLICY 3: Only owners can INSERT (create) users
CREATE POLICY "owners_can_insert_users"
    ON public.users
    FOR INSERT
    WITH CHECK (
        auth.is_owner() = true
    );

-- POLICY 4: Only owners can UPDATE any user
CREATE POLICY "owners_can_update_all_users"
    ON public.users
    FOR UPDATE
    USING (
        auth.is_owner() = true
    )
    WITH CHECK (
        auth.is_owner() = true
    );

-- POLICY 5: Users can update their own data (except role)
CREATE POLICY "users_can_update_self"
    ON public.users
    FOR UPDATE
    USING (
        auth.uid() = id
    )
    WITH CHECK (
        auth.uid() = id
        AND role = OLD.role  -- Cannot change their own role
    );

-- POLICY 6: Only owners can DELETE users
CREATE POLICY "owners_can_delete_users"
    ON public.users
    FOR DELETE
    USING (
        auth.is_owner() = true
    );

-- Step 7: Create function to sync user role to JWT metadata
-- This function updates auth.users metadata when role changes in public.users
CREATE OR REPLACE FUNCTION public.sync_user_role_to_jwt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the auth.users metadata with the new role
    UPDATE auth.users
    SET raw_user_meta_data =
        COALESCE(raw_user_meta_data, '{}'::jsonb) ||
        jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$;

-- Step 8: Create trigger to automatically sync role changes
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.users;
CREATE TRIGGER sync_user_role_trigger
    AFTER INSERT OR UPDATE OF role ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_role_to_jwt();

-- Step 9: Sync existing users' roles to auth.users metadata
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, role FROM public.users LOOP
        UPDATE auth.users
        SET raw_user_meta_data =
            COALESCE(raw_user_meta_data, '{}'::jsonb) ||
            jsonb_build_object('role', user_record.role)
        WHERE id = user_record.id;
    END LOOP;

    RAISE NOTICE '✅ Synced roles to JWT metadata for all users';
END $$;

-- Step 10: Set the current admin user as owner
UPDATE public.users
SET role = 'owner'
WHERE email = 'admin@iv-relife.com';

-- Also update their JWT metadata
UPDATE auth.users
SET raw_user_meta_data =
    COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', 'owner')
WHERE email = 'admin@iv-relife.com';

-- Step 11: Verify policies are created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 12: Test SELECT query (should work for owners)
SELECT
    id,
    email,
    name,
    role,
    status,
    is_active,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- Step 13: Show current user's metadata
SELECT
    id,
    email,
    raw_user_meta_data ->> 'role' as role_in_jwt,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- =====================================================
-- IMPORTANT: You must LOG OUT and LOG BACK IN
-- for the JWT token to be refreshed with the new role!
-- =====================================================
-- After logging back in, your JWT will contain:
-- user_metadata: { role: 'owner' }
--
-- This allows the RLS policies to check your role without
-- querying the users table (avoiding infinite recursion)
-- =====================================================

RAISE NOTICE '✅ Role-based access control configured successfully!';
RAISE NOTICE '⚠️ IMPORTANT: Log out and log back in to refresh your JWT token!';

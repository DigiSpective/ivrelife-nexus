-- =====================================================
-- COMPLETE USERS TABLE SETUP
-- =====================================================
-- This script:
-- 1. Creates users table if it doesn't exist
-- 2. Adds all missing columns
-- 3. Sets up role-based access control without recursion
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'location_user' CHECK (role IN ('owner', 'backoffice', 'retailer', 'location_user')),
    retailer_id UUID,
    location_id UUID,
    name TEXT NOT NULL,
    avatar TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add missing columns if they don't exist
DO $$
BEGIN
    -- Add is_active
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE '✅ Added is_active column';
    ELSE
        RAISE NOTICE '✓ is_active column already exists';
    END IF;

    -- Add account_locked
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'account_locked'
    ) THEN
        ALTER TABLE public.users ADD COLUMN account_locked BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added account_locked column';
    ELSE
        RAISE NOTICE '✓ account_locked column already exists';
    END IF;

    -- Add login_attempts
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'login_attempts'
    ) THEN
        ALTER TABLE public.users ADD COLUMN login_attempts INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added login_attempts column';
    ELSE
        RAISE NOTICE '✓ login_attempts column already exists';
    END IF;

    -- Add two_factor_enabled
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'two_factor_enabled'
    ) THEN
        ALTER TABLE public.users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added two_factor_enabled column';
    ELSE
        RAISE NOTICE '✓ two_factor_enabled column already exists';
    END IF;

    -- Add phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.users ADD COLUMN phone TEXT;
        RAISE NOTICE '✅ Added phone column';
    ELSE
        RAISE NOTICE '✓ phone column already exists';
    END IF;

    -- Add department
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'department'
    ) THEN
        ALTER TABLE public.users ADD COLUMN department TEXT;
        RAISE NOTICE '✅ Added department column';
    ELSE
        RAISE NOTICE '✓ department column already exists';
    END IF;
END $$;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_retailer_id ON public.users(retailer_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Step 4: Drop ALL existing policies on users table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 5: Create helper functions for JWT-based role checking
-- These functions read from JWT metadata, NOT from the users table
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

CREATE OR REPLACE FUNCTION auth.is_owner()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT auth.user_role() = 'owner';
$$;

CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT auth.user_role() IN ('owner', 'backoffice');
$$;

-- Step 6: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 7: Create role-based policies without recursion

-- SELECT: Owners can view all users
CREATE POLICY "owners_can_view_all_users"
    ON public.users
    FOR SELECT
    USING (auth.is_owner() = true);

-- SELECT: Users can view their own data
CREATE POLICY "users_can_view_self"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- INSERT: Only owners can create users
CREATE POLICY "owners_can_insert_users"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.is_owner() = true);

-- UPDATE: Owners can update any user
CREATE POLICY "owners_can_update_all_users"
    ON public.users
    FOR UPDATE
    USING (auth.is_owner() = true)
    WITH CHECK (auth.is_owner() = true);

-- UPDATE: Users can update their own data (except role)
CREATE POLICY "users_can_update_self"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    );

-- DELETE: Only owners can delete users
CREATE POLICY "owners_can_delete_users"
    ON public.users
    FOR DELETE
    USING (auth.is_owner() = true);

-- Step 8: Create function to sync user role to JWT metadata
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

-- Step 9: Create trigger to automatically sync role changes
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.users;
CREATE TRIGGER sync_user_role_trigger
    AFTER INSERT OR UPDATE OF role ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_role_to_jwt();

-- Step 10: Sync existing users' roles to auth.users metadata
DO $$
DECLARE
    user_record RECORD;
    synced_count INTEGER := 0;
BEGIN
    FOR user_record IN SELECT id, role FROM public.users LOOP
        UPDATE auth.users
        SET raw_user_meta_data =
            COALESCE(raw_user_meta_data, '{}'::jsonb) ||
            jsonb_build_object('role', user_record.role)
        WHERE id = user_record.id;
        synced_count := synced_count + 1;
    END LOOP;

    RAISE NOTICE '✅ Synced % user roles to JWT metadata', synced_count;
END $$;

-- Step 11: Set the current admin user as owner (if exists)
DO $$
BEGIN
    -- Update public.users
    UPDATE public.users
    SET role = 'owner', is_active = true
    WHERE email = 'admin@iv-relife.com';

    -- Update auth.users metadata
    UPDATE auth.users
    SET raw_user_meta_data =
        COALESCE(raw_user_meta_data, '{}'::jsonb) ||
        jsonb_build_object('role', 'owner')
    WHERE email = 'admin@iv-relife.com';

    IF FOUND THEN
        RAISE NOTICE '✅ Set admin@iv-relife.com as owner';
    ELSE
        RAISE NOTICE '⚠️ User admin@iv-relife.com not found';
    END IF;
END $$;

-- Step 12: If users table is empty, sync from auth.users
DO $$
DECLARE
    user_count INTEGER;
    auth_user RECORD;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.users;

    IF user_count = 0 THEN
        RAISE NOTICE '📊 Users table is empty, syncing from auth.users...';

        FOR auth_user IN SELECT id, email, created_at FROM auth.users LOOP
            INSERT INTO public.users (id, email, name, role, status, is_active, created_at)
            VALUES (
                auth_user.id,
                auth_user.email,
                COALESCE((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth_user.id), 'User'),
                'location_user',
                'active',
                true,
                auth_user.created_at
            )
            ON CONFLICT (id) DO NOTHING;
        END LOOP;

        -- Make the first user an owner
        UPDATE public.users
        SET role = 'owner'
        WHERE id = (SELECT id FROM public.users ORDER BY created_at LIMIT 1);

        SELECT COUNT(*) INTO user_count FROM public.users;
        RAISE NOTICE '✅ Synced % users from auth.users', user_count;
    ELSE
        RAISE NOTICE '✓ Users table already has % records', user_count;
    END IF;
END $$;

-- Step 13: Verify policies are created
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 14: Show current users
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

-- Step 15: Show JWT metadata
SELECT
    email,
    raw_user_meta_data ->> 'role' as role_in_jwt,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- Now you must:
-- 1. LOG OUT of the application
-- 2. LOG BACK IN to refresh your JWT token
-- 3. Go to User Management page - you should see users!
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '✅ Users table setup complete!';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: You must LOG OUT and LOG BACK IN';
    RAISE NOTICE '   to refresh your JWT token with the new role!';
    RAISE NOTICE '';
END $$;

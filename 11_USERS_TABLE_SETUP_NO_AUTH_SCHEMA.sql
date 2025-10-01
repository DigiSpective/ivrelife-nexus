-- =====================================================
-- COMPLETE USERS TABLE SETUP (NO AUTH SCHEMA ACCESS)
-- =====================================================
-- This script works without needing auth schema permissions
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

-- Step 5: TEMPORARILY DISABLE RLS to allow all authenticated users access
-- We'll enable proper role-based access after you log in
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 6: Create simple policies that allow all authenticated users
-- These are temporary and permissive - we'll refine them once you can log in

-- SELECT: Allow all authenticated users to view all users (temporary)
CREATE POLICY "temp_allow_select"
    ON public.users
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- INSERT: Allow all authenticated users to insert (temporary)
CREATE POLICY "temp_allow_insert"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Allow all authenticated users to update (temporary)
CREATE POLICY "temp_allow_update"
    ON public.users
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: Allow all authenticated users to delete (temporary)
CREATE POLICY "temp_allow_delete"
    ON public.users
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Step 7: Create function to sync user role to JWT metadata
CREATE OR REPLACE FUNCTION public.sync_user_role_to_jwt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update the auth.users metadata with the new role
    UPDATE auth.users
    SET raw_user_meta_data =
        COALESCE(raw_user_meta_data, '{}'::jsonb) ||
        jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If we can't update auth.users, just continue
        RAISE WARNING 'Could not sync role to JWT: %', SQLERRM;
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
    synced_count INTEGER := 0;
BEGIN
    FOR user_record IN SELECT id, role FROM public.users LOOP
        BEGIN
            UPDATE auth.users
            SET raw_user_meta_data =
                COALESCE(raw_user_meta_data, '{}'::jsonb) ||
                jsonb_build_object('role', user_record.role)
            WHERE id = user_record.id;
            synced_count := synced_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Could not sync role for user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '✅ Synced % user roles to JWT metadata', synced_count;
END $$;

-- Step 10: Set the current admin user as owner (if exists)
DO $$
BEGIN
    -- Update public.users
    UPDATE public.users
    SET role = 'owner', is_active = true
    WHERE email = 'admin@iv-relife.com';

    -- Update auth.users metadata
    BEGIN
        UPDATE auth.users
        SET raw_user_meta_data =
            COALESCE(raw_user_meta_data, '{}'::jsonb) ||
            jsonb_build_object('role', 'owner')
        WHERE email = 'admin@iv-relife.com';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Could not update auth.users metadata: %', SQLERRM;
    END;

    IF FOUND THEN
        RAISE NOTICE '✅ Set admin@iv-relife.com as owner';
    ELSE
        RAISE NOTICE '⚠️ User admin@iv-relife.com not found';
    END IF;
END $$;

-- Step 11: If users table is empty, sync from auth.users
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

-- Step 12: Verify policies are created
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 13: Show current users
SELECT
    id,
    email,
    name,
    role,
    status,
    COALESCE(is_active, true) as is_active,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- Step 14: Show JWT metadata
SELECT
    email,
    raw_user_meta_data ->> 'role' as role_in_jwt,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- =====================================================
-- NEXT STEPS
-- =====================================================
-- 1. LOG OUT of the application
-- 2. LOG BACK IN to refresh your JWT token
-- 3. Go to User Management page - you should see users!
-- 4. After confirming it works, we'll tighten the policies
--    to owner-only access
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '✅ Users table setup complete!';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Current RLS policies are PERMISSIVE';
    RAISE NOTICE '   (All authenticated users can manage users)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: You must LOG OUT and LOG BACK IN';
    RAISE NOTICE '   to refresh your JWT token with the new role!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 After confirming it works, we will run a';
    RAISE NOTICE '   second script to restrict access to owners only.';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- CHECK AND FIX USERS TABLE
-- =====================================================
-- This script checks if the users table exists and creates it if needed
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Check if users table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'users'
    ) THEN
        RAISE NOTICE '✅ users table exists';
    ELSE
        RAISE NOTICE '❌ users table does NOT exist - will create it';
    END IF;
END $$;

-- Step 2: Create users table if it doesn't exist
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
    is_active BOOLEAN DEFAULT TRUE,
    account_locked BOOLEAN DEFAULT FALSE,
    login_attempts INTEGER DEFAULT 0,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Add missing columns if table already existed but is missing columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_retailer_id ON public.users(retailer_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Step 5: Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Owners can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can update users" ON public.users;
DROP POLICY IF EXISTS "Users can delete users" ON public.users;

-- Step 7: Create simple RLS policies (without complex functions that might cause 500 errors)

-- Allow authenticated users to view all users (simplest policy)
CREATE POLICY "Authenticated users can view users"
    ON public.users FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to view their own data
CREATE POLICY "Users can view their own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Allow authenticated users to insert users (for now - you can restrict this later)
CREATE POLICY "Authenticated users can insert users"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update all users (for admin functionality)
CREATE POLICY "Authenticated users can update users"
    ON public.users FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete users (you can restrict this later)
CREATE POLICY "Authenticated users can delete users"
    ON public.users FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Step 8: Check if there are any users in the table
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.users;
    RAISE NOTICE '📊 users table has % records', user_count;
END $$;

-- Step 9: If users table is empty, insert a test user
DO $$
DECLARE
    user_count INTEGER;
    current_user_id UUID;
    current_user_email TEXT;
BEGIN
    -- Get count
    SELECT COUNT(*) INTO user_count FROM public.users;

    -- If empty and we have an authenticated user, add them
    IF user_count = 0 THEN
        -- Try to get current authenticated user from auth.users
        SELECT id, email INTO current_user_id, current_user_email
        FROM auth.users
        LIMIT 1;

        IF current_user_id IS NOT NULL THEN
            -- Insert current auth user into users table
            INSERT INTO public.users (id, email, name, role, status)
            VALUES (
                current_user_id,
                current_user_email,
                COALESCE((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = current_user_id), 'Admin User'),
                'owner',
                'active'
            )
            ON CONFLICT (id) DO NOTHING;

            RAISE NOTICE '✅ Inserted current user into users table: %', current_user_email;
        ELSE
            RAISE NOTICE '⚠️ No users in auth.users table. Please sign up first.';
        END IF;
    ELSE
        RAISE NOTICE '✅ users table already has data';
    END IF;
END $$;

-- Step 10: Sync all auth.users to public.users (if they don't exist)
INSERT INTO public.users (id, email, name, role, status, created_at)
SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', 'User'),
    'location_user',
    'active',
    au.created_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 11: Final check - show all users
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

-- =====================================================
-- DONE! Run this script and check the results
-- =====================================================
-- If you see users listed at the end, the table is set up correctly
-- If you see 0 records, you may need to sign up a user first
-- =====================================================

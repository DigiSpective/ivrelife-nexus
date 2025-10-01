-- =====================================================
-- FIX USERS TABLE - INFINITE RECURSION IN RLS POLICIES
-- =====================================================
-- Error: "infinite recursion detected in policy for relation users"
-- Code: 42P17
--
-- This happens when RLS policies reference the same table they're protecting
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop ALL existing policies on users table
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
DROP POLICY IF EXISTS "Users can delete users" ON public.users;

-- Step 2: Temporarily disable RLS to verify the table works
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Test query to verify table structure
SELECT COUNT(*) as user_count FROM public.users;

-- Step 4: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create SIMPLE policies without recursion
-- These policies do NOT query the users table, avoiding infinite recursion

-- Policy 1: Allow all authenticated users to SELECT (read) all users
CREATE POLICY "allow_authenticated_select"
    ON public.users
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL  -- Simple check: if user is logged in, allow read
    );

-- Policy 2: Allow all authenticated users to INSERT
CREATE POLICY "allow_authenticated_insert"
    ON public.users
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL  -- Simple check: if user is logged in, allow insert
    );

-- Policy 3: Allow all authenticated users to UPDATE
CREATE POLICY "allow_authenticated_update"
    ON public.users
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL  -- Simple check: if user is logged in, allow update
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Policy 4: Allow all authenticated users to DELETE
CREATE POLICY "allow_authenticated_delete"
    ON public.users
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL  -- Simple check: if user is logged in, allow delete
    );

-- Step 6: Verify policies are created
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
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 7: Test that SELECT query works now
SELECT
    id,
    email,
    name,
    role,
    status,
    is_active,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- DONE! The users table should now work without recursion errors
-- =====================================================
-- Note: These policies allow ALL authenticated users to manage users.
-- If you need role-based access control (only admins can manage users),
-- we'll need to implement that differently to avoid recursion.
-- =====================================================

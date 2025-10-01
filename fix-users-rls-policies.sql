-- Check current RLS policies on users table
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
WHERE tablename = 'users';

-- Check if RLS is enabled on users table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';

-- If RLS is blocking inserts, we need to add a policy that allows authenticated users to insert
-- This assumes you want authenticated admin/owner users to be able to create other users

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can select all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Create policy to allow authenticated users with owner/backoffice role to insert users
CREATE POLICY "Admins can insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if the current user is an owner or backoffice user
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('owner', 'backoffice')
  )
);

-- Create policy to allow authenticated users with owner/backoffice role to select all users
CREATE POLICY "Admins can select all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  -- Allow if the current user is an owner or backoffice user
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('owner', 'backoffice')
  )
  OR
  -- Or if viewing their own record
  id = auth.uid()
);

-- Create policy to allow authenticated users with owner/backoffice role to update users
CREATE POLICY "Admins can update users"
ON public.users
FOR UPDATE
TO authenticated
USING (
  -- Allow if the current user is an owner or backoffice user
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('owner', 'backoffice')
  )
  OR
  -- Or if updating their own record
  id = auth.uid()
);

-- Create policy to allow authenticated users with owner/backoffice role to delete users
CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (
  -- Allow if the current user is an owner or backoffice user
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('owner', 'backoffice')
  )
);

-- Verify the policies were created
SELECT
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

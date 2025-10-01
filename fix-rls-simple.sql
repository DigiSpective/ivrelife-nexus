-- First, let's see what's happening
SELECT 'Current authenticated user:' as info, auth.uid() as user_id;

-- Check if there are any users in the users table
SELECT 'Users in table:' as info, COUNT(*) as count FROM public.users;

-- Try to see users (this might fail due to RLS)
SELECT id, email, role FROM public.users LIMIT 5;

-- Let's drop the restrictive policies and create simpler ones
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can select all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Create a simple policy that allows all authenticated users to SELECT
-- (We can make this more restrictive later once we verify it works)
CREATE POLICY "Allow authenticated users to select users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to INSERT users
CREATE POLICY "Allow authenticated users to insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to UPDATE users
CREATE POLICY "Allow authenticated users to update users"
ON public.users
FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to DELETE users
CREATE POLICY "Allow authenticated users to delete users"
ON public.users
FOR DELETE
TO authenticated
USING (true);

-- Verify policies are active
SELECT
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';

-- Now try to select users again
SELECT id, email, name, role, status FROM public.users;

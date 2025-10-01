-- Check current RLS policies on retailers table
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
WHERE tablename = 'retailers';

-- Enable RLS if not already enabled
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON retailers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON retailers;
DROP POLICY IF EXISTS "Enable update for users based on email" ON retailers;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON retailers;

-- Create permissive policies for authenticated users
CREATE POLICY "Allow authenticated users to select retailers"
ON retailers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert retailers"
ON retailers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update retailers"
ON retailers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete retailers"
ON retailers FOR DELETE
TO authenticated
USING (true);

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'retailers';

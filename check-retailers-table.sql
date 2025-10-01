-- Check the retailers table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'retailers'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check constraints on retailers table
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'retailers'
AND n.nspname = 'public';

-- Try a simple insert to see if it works
-- (This will fail if there are issues, showing us the exact error)
INSERT INTO retailers (user_id, name, email, status)
VALUES (
    '00000000-0000-0000-0000-000000000000',  -- Dummy UUID
    'Test Retailer',
    'test@example.com',
    'active'
)
RETURNING *;

-- Delete the test record
DELETE FROM retailers WHERE email = 'test@example.com';

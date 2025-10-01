-- First, let's see what the current role constraint allows
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'users'
AND n.nspname = 'public'
AND conname LIKE '%role%';

-- Drop the existing role check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Create a new constraint that allows all the roles used in the app
ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('owner', 'backoffice', 'retailer', 'location', 'admin', 'user'));

-- Verify the new constraint
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'users'
AND n.nspname = 'public'
AND conname LIKE '%role%';

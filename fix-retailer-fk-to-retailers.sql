-- Fix the foreign key constraint to point users.retailer_id -> retailers.id
-- This is needed because location users need to reference actual retailer entities

-- Step 1: Drop the existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_retailer_user;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_retailer;

-- Step 2: Add the correct foreign key pointing to retailers table
ALTER TABLE public.users
ADD CONSTRAINT fk_users_retailer
FOREIGN KEY (retailer_id)
REFERENCES public.retailers(id)
ON DELETE SET NULL;

-- Step 3: Verify the constraint
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'users'
AND n.nspname = 'public'
AND conname LIKE '%retailer%';

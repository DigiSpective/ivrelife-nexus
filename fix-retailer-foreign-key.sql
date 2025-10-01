-- Check current foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'users'
    AND kcu.column_name = 'retailer_id';

-- Drop the foreign key constraint that points to retailers table
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_retailer;

-- Add a new foreign key constraint that points to users table instead
-- This allows retailer_id to reference another user (with role='retailer')
ALTER TABLE public.users
ADD CONSTRAINT fk_users_retailer_user
FOREIGN KEY (retailer_id)
REFERENCES public.users(id)
ON DELETE SET NULL;

-- Verify the new constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'users'
    AND kcu.column_name = 'retailer_id';

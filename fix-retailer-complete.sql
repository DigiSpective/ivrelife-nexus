-- Complete fix: Drop constraints first, clean data, then add correct constraint

-- Step 1: Drop ALL existing foreign key constraints on retailer_id
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_retailer_user;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_retailer;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_retailer_id_fkey;

-- Step 2: Show current state of users with retailer_id
SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.retailer_id,
    CASE
        WHEN u.retailer_id IS NULL THEN 'NULL'
        WHEN EXISTS (SELECT 1 FROM retailers r WHERE r.id = u.retailer_id) THEN 'Valid (in retailers)'
        WHEN EXISTS (SELECT 1 FROM users u2 WHERE u2.id = u.retailer_id) THEN 'Points to user ID (old architecture)'
        ELSE 'Invalid/Unknown'
    END as retailer_status
FROM users u
WHERE u.retailer_id IS NOT NULL OR u.role IN ('retailer', 'location')
ORDER BY u.role, u.created_at DESC;

-- Step 3: Create retailer profiles for all users with role='retailer' if they don't exist
INSERT INTO retailers (name, email, phone, status, settings)
SELECT DISTINCT
    u.name,
    u.email,
    u.phone,
    'active',
    '{}'::jsonb
FROM users u
WHERE u.role = 'retailer'
AND NOT EXISTS (
    SELECT 1 FROM retailers r WHERE r.email = u.email
)
RETURNING *;

-- Step 4: Update users with old architecture (retailer_id pointing to user)
-- Link them to actual retailer profile by matching emails
UPDATE users u1
SET retailer_id = r.id
FROM users u2
JOIN retailers r ON u2.email = r.email
WHERE u1.retailer_id = u2.id
AND u2.role = 'retailer'
AND EXISTS (SELECT 1 FROM users WHERE id = u1.retailer_id);

-- Step 5: Update retailer users to point to their own retailer profile
UPDATE users u
SET retailer_id = r.id
FROM retailers r
WHERE u.role = 'retailer'
AND u.email = r.email;

-- Step 6: Clear any remaining invalid retailer_id values
UPDATE users
SET retailer_id = NULL
WHERE retailer_id IS NOT NULL
AND retailer_id NOT IN (SELECT id FROM retailers);

-- Step 7: Add the correct foreign key constraint
ALTER TABLE public.users
ADD CONSTRAINT fk_users_retailer
FOREIGN KEY (retailer_id)
REFERENCES public.retailers(id)
ON DELETE SET NULL;

-- Step 8: Verify the constraint was added
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'users'
AND n.nspname = 'public'
AND conname LIKE '%retailer%';

-- Step 9: Final verification - show all users and their retailer relationships
SELECT
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.role,
    u.retailer_id,
    r.id as retailer_profile_id,
    r.name as retailer_name,
    r.email as retailer_email,
    r.status as retailer_status
FROM users u
LEFT JOIN retailers r ON u.retailer_id = r.id
WHERE u.role IN ('retailer', 'location', 'owner', 'backoffice')
ORDER BY u.role, u.created_at DESC;

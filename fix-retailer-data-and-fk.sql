-- Comprehensive fix: Clean data then add foreign key constraint

-- Step 1: Show users with invalid retailer_id (retailer_id not in retailers table)
SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.retailer_id,
    CASE
        WHEN EXISTS (SELECT 1 FROM retailers r WHERE r.id = u.retailer_id) THEN 'Valid'
        ELSE 'Invalid - Not in retailers table'
    END as retailer_status
FROM users u
WHERE u.retailer_id IS NOT NULL;

-- Step 2: Check if these retailer_ids are actually user IDs (from old architecture)
SELECT
    u1.id as user_id,
    u1.name as user_name,
    u1.email as user_email,
    u1.role as user_role,
    u1.retailer_id,
    u2.id as retailer_user_id,
    u2.name as retailer_user_name,
    u2.email as retailer_user_email,
    u2.role as retailer_user_role
FROM users u1
LEFT JOIN users u2 ON u1.retailer_id = u2.id
WHERE u1.retailer_id IS NOT NULL
AND u2.role = 'retailer';

-- Step 3: For each retailer user, create retailer profile if it doesn't exist
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
ON CONFLICT DO NOTHING
RETURNING *;

-- Step 4: Update users who have retailer_id pointing to a user (old architecture)
-- Link them to the actual retailer profile by matching email
UPDATE users u1
SET retailer_id = r.id
FROM users u2
JOIN retailers r ON u2.email = r.email
WHERE u1.retailer_id = u2.id
AND u2.role = 'retailer'
AND u1.retailer_id NOT IN (SELECT id FROM retailers);

-- Step 5: Update retailer users to link to their own retailer profile
UPDATE users u
SET retailer_id = r.id
FROM retailers r
WHERE u.role = 'retailer'
AND u.email = r.email
AND (u.retailer_id IS NULL OR u.retailer_id != r.id);

-- Step 6: Clear invalid retailer_id values that can't be fixed
UPDATE users
SET retailer_id = NULL
WHERE retailer_id IS NOT NULL
AND retailer_id NOT IN (SELECT id FROM retailers);

-- Step 7: Now drop the old constraint and add the correct one
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_retailer_user;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_retailer;

ALTER TABLE public.users
ADD CONSTRAINT fk_users_retailer
FOREIGN KEY (retailer_id)
REFERENCES public.retailers(id)
ON DELETE SET NULL;

-- Step 8: Verify the fix
SELECT
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.role,
    u.retailer_id,
    r.id as retailer_profile_id,
    r.name as retailer_name,
    r.email as retailer_email
FROM users u
LEFT JOIN retailers r ON u.retailer_id = r.id
WHERE u.role IN ('retailer', 'location')
ORDER BY u.role, u.created_at DESC;

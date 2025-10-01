-- Step 1: Show all current retailer users
SELECT id, name, email, role, retailer_id, created_at
FROM users
WHERE role = 'retailer'
ORDER BY created_at DESC;

-- Step 2: Show all current retailers in retailers table
SELECT id, name, email, status, created_at
FROM retailers
ORDER BY created_at DESC;

-- Step 3: Show the relationship - which retailer users have retailer profiles
SELECT
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.retailer_id as user_retailer_id,
    r.id as retailer_id,
    r.name as retailer_name,
    r.email as retailer_email,
    CASE
        WHEN r.id IS NULL THEN 'MISSING - No retailer profile'
        WHEN u.retailer_id = r.id THEN 'LINKED - Correct'
        ELSE 'UNLINKED - retailer_id mismatch'
    END as status
FROM users u
LEFT JOIN retailers r ON u.email = r.email
WHERE u.role = 'retailer'
ORDER BY u.created_at DESC;

-- Step 4: Find orphaned retailers (no corresponding user)
SELECT
    r.id,
    r.name,
    r.email,
    r.created_at,
    'ORPHAN - No retailer user' as status
FROM retailers r
WHERE NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.role = 'retailer'
    AND u.email = r.email
)
ORDER BY r.created_at DESC;

-- Step 5: DELETE orphaned retailers (retailers without a retailer user)
DELETE FROM retailers
WHERE NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.role = 'retailer'
    AND u.email = r.email
)
RETURNING id, name, email;

-- Step 6: CREATE missing retailer profiles for retailer users
INSERT INTO retailers (name, email, phone, status, settings)
SELECT
    u.name,
    u.email,
    u.phone,
    'active',
    '{}'::jsonb
FROM users u
WHERE u.role = 'retailer'
AND NOT EXISTS (
    SELECT 1 FROM retailers r
    WHERE r.email = u.email
)
RETURNING id, name, email;

-- Step 7: UPDATE retailer users to link to their retailer profile
UPDATE users u
SET retailer_id = r.id
FROM retailers r
WHERE u.role = 'retailer'
AND u.email = r.email
AND (u.retailer_id IS NULL OR u.retailer_id != r.id)
RETURNING u.id, u.name, u.email, u.retailer_id;

-- Step 8: Final verification
SELECT
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.retailer_id,
    r.id as retailer_profile_id,
    r.name as retailer_profile_name,
    CASE
        WHEN r.id IS NULL THEN '❌ MISSING PROFILE'
        WHEN u.retailer_id = r.id THEN '✅ CORRECTLY LINKED'
        ELSE '⚠️ MISMATCH'
    END as link_status
FROM users u
LEFT JOIN retailers r ON u.email = r.email
WHERE u.role = 'retailer'
ORDER BY u.created_at DESC;

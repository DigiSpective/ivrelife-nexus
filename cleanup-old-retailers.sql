-- Clean up old retailers and ensure proper data integrity

-- Step 1: Check current state of retailers
SELECT
    r.id,
    r.name,
    r.email,
    r.created_at,
    COUNT(u.id) as linked_users
FROM retailers r
LEFT JOIN users u ON u.retailer_id = r.id
GROUP BY r.id, r.name, r.email, r.created_at
ORDER BY r.created_at DESC;

-- Step 2: Find orphaned retailers (retailers with no corresponding retailer user)
SELECT r.*
FROM retailers r
WHERE NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.role = 'retailer'
    AND u.email = r.email
);

-- Step 3: Find retailer users without retailer profiles
SELECT u.id, u.name, u.email, u.created_at
FROM users u
WHERE u.role = 'retailer'
AND NOT EXISTS (
    SELECT 1 FROM retailers r
    WHERE r.email = u.email
);

-- Step 4: Delete orphaned retailers (retailers with no retailer user)
-- Uncomment to execute:
-- DELETE FROM retailers
-- WHERE NOT EXISTS (
--     SELECT 1 FROM users u
--     WHERE u.role = 'retailer'
--     AND u.email = retailers.email
-- );

-- Step 5: Create retailer profiles for retailer users that don't have one
-- Uncomment to execute:
-- INSERT INTO retailers (name, email, phone, status, settings)
-- SELECT
--     u.name,
--     u.email,
--     u.phone,
--     'active',
--     '{}'::jsonb
-- FROM users u
-- WHERE u.role = 'retailer'
-- AND NOT EXISTS (
--     SELECT 1 FROM retailers r
--     WHERE r.email = u.email
-- )
-- RETURNING *;

-- Step 6: Link retailer users to their retailer profiles
-- Uncomment to execute:
-- UPDATE users u
-- SET retailer_id = r.id
-- FROM retailers r
-- WHERE u.role = 'retailer'
-- AND u.email = r.email
-- AND u.retailer_id IS NULL;

-- Step 7: Verify final state
SELECT
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.role,
    u.retailer_id,
    r.id as retailer_id,
    r.name as retailer_name
FROM users u
LEFT JOIN retailers r ON u.retailer_id = r.id
WHERE u.role IN ('retailer', 'location')
ORDER BY u.role, u.created_at DESC;

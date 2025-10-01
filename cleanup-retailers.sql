-- Step 1: Check current retailers
SELECT
    r.id as retailer_id,
    r.name,
    r.user_id,
    u.email as user_email,
    u.role as user_role
FROM retailers r
LEFT JOIN users u ON r.user_id = u.id;

-- Step 2: Check users with retailer role
SELECT id, email, name, role, created_at
FROM users
WHERE role = 'retailer'
ORDER BY created_at DESC;

-- Step 3: Delete retailers that don't have a corresponding user
DELETE FROM retailers
WHERE user_id IS NULL
   OR user_id NOT IN (SELECT id FROM users WHERE role = 'retailer');

-- Step 4: For existing retailer users that don't have a retailer profile, create one
INSERT INTO retailers (user_id, name, email, phone, status)
SELECT
    u.id,
    u.name,
    u.email,
    u.phone,
    'active'
FROM users u
WHERE u.role = 'retailer'
  AND NOT EXISTS (SELECT 1 FROM retailers r WHERE r.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Verify the results
SELECT
    r.id as retailer_id,
    r.name as retailer_name,
    r.email as retailer_email,
    r.user_id,
    u.email as user_email,
    u.role as user_role,
    u.created_at
FROM retailers r
INNER JOIN users u ON r.user_id = u.id
ORDER BY u.created_at DESC;

-- First, let's check what users exist in the users table
SELECT id, email, name, role, status FROM public.users;

-- Check the current authenticated user ID
SELECT auth.uid() as current_user_id;

-- Find the admin@iv-relife user in auth.users
SELECT id, email FROM auth.users WHERE email = 'admin@iv-relife';

-- If the admin user doesn't exist in public.users table, let's create them
-- Replace 'YOUR_AUTH_USER_ID' with the actual ID from auth.users above
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  status,
  is_active,
  account_locked,
  login_attempts,
  two_factor_enabled
)
SELECT
  id,
  email,
  'Admin User',
  'owner',
  'active',
  true,
  false,
  0,
  false
FROM auth.users
WHERE email = 'admin@iv-relife'
ON CONFLICT (id) DO UPDATE
SET
  role = 'owner',
  status = 'active',
  is_active = true;

-- Verify the admin user now has owner role
SELECT id, email, name, role, status FROM public.users WHERE email = 'admin@iv-relife';

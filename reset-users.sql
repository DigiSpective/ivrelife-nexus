-- Reset users and create new admin user
-- Run this in your Supabase SQL Editor after running the complete database setup

-- First, check if the users table exists
-- If it does, delete all users from the public.users table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    DELETE FROM public.users;
    RAISE NOTICE 'All users deleted from public.users table';
  ELSE
    RAISE NOTICE 'public.users table does not exist yet';
  END IF;
END $$;

-- After running the complete database setup, register a new user through your application and make them an admin
-- Run this query to make the user an owner (admin):
-- UPDATE public.users 
-- SET role = 'owner' 
-- WHERE email = 'your-new-admin-email@example.com';
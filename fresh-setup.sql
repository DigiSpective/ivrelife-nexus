-- Fresh Setup Script for IV RELIFE Database
-- This script will reset your database and set up everything from scratch

-- First, reset any existing policies
-- Run the reset-database-policies.sql script
\ir reset-database-policies.sql

-- Then run the complete database setup
-- Run the complete-database-setup.sql script
\ir complete-database-setup.sql

-- Finally, provide instructions for setting up the admin user
/*
After running this script:

1. Register a new user through your application
2. Run this query to make the user an owner (admin):
   UPDATE public.users 
   SET role = 'owner' 
   WHERE email = 'your-admin-email@example.com';
*/
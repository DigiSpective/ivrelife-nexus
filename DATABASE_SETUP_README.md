# Database Setup for IV RELIFE Project

This directory contains all the necessary files to set up the database for the IV RELIFE project.

## Files Included

1. `complete-database-setup.sql` - Complete SQL script to set up all tables, indexes, RLS policies, and initial data
2. `SUPABASE_SETUP_GUIDE.md` - Detailed guide for setting up Supabase and configuring credentials
3. `scripts/verify-supabase-setup.ts` - Script to verify Supabase credentials and connection
4. `reset-database-policies.sql` - Script to reset all RLS policies in the database
5. `reset-users.sql` - Script to reset users in the database
6. `fresh-setup.sql` - Complete script to reset and set up the database from scratch
7. Updated `package.json` with a new script to run the verification

## Setup Process

### 1. Set Up Supabase

Follow the instructions in `SUPABASE_SETUP_GUIDE.md` to:
- Create a Supabase project
- Get your credentials
- Configure environment variables

### 2. Initialize the Database

1. Copy the contents of `complete-database-setup.sql`
2. In your Supabase dashboard, go to SQL Editor
3. Paste the SQL script and run it

> **Note**: If you encounter a syntax error related to the "primary" column, this has been fixed in the latest version of the script. The issue was that "primary" is a reserved keyword in PostgreSQL and needed to be quoted.
>
> **Note**: If you encounter an error that a policy already exists, this has also been fixed in the latest version of the script. All policies now use `DROP POLICY IF EXISTS` before creating them to prevent conflicts when running the script multiple times.
>
> **Note**: If you encounter a syntax error related to `IF NOT EXISTS` with `CREATE OR REPLACE FUNCTION`, this has also been fixed. The `IF NOT EXISTS` clause has been removed as it's not supported for function definitions in PostgreSQL.
>
> **Note**: If you encounter a syntax error related to `IF NOT EXISTS` with `CREATE TRIGGER`, this has also been fixed. The `IF NOT EXISTS` clause has been removed as it's not supported for trigger definitions in PostgreSQL.
>
> **Note**: If you encounter an error "only WITH CHECK expression allowed for INSERT", this has been fixed. The issue was with incorrect policy syntax where `USING` was used instead of `WITH CHECK` for INSERT policies, and SELECT policies had incorrect `WITH CHECK` clauses.

This will create:
- All required tables with proper relationships
- Indexes for performance
- Row Level Security (RLS) policies
- Initial data (including admin user)

### 3. Verify Your Setup

Run the verification script to ensure everything is configured correctly:

```bash
npm run verify-supabase
```

This script will check:
- Environment variables are properly set
- Database connection is working
- Authentication is configured

### 4. Create Your Admin User

1. Register a new user through the application
2. In Supabase SQL Editor, run:
   ```sql
   UPDATE public.users 
   SET role = 'owner' 
   WHERE email = 'your-admin-email@example.com';
   ```

## Resetting the Database

If you encounter persistent issues or want to start with a clean slate:

1. Run `reset-database-policies.sql` to clear all existing policies
2. Run `reset-users.sql` to clear all users (if the users table exists)
3. Run `complete-database-setup.sql` again to set up the database from scratch

Alternatively, you can run `fresh-setup.sql` which will run all the necessary scripts in the correct order.

## Environment Variables

Make sure your `.env.local` file includes:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

If you encounter issues:

1. Check that environment variables are correctly set
2. Verify your Supabase project is not paused
3. Ensure you're using the correct anon key (not the service key)
4. Check that the SQL script ran successfully
5. Review RLS policies if you get permission errors

## Security Notes

- Never commit your `.env.local` file to version control
- Protect your Supabase service role key
- Review and customize RLS policies based on your business requirements
- Use strong passwords for your Supabase project

## Next Steps

1. Start the development server: `npm run dev`
2. Access the application at `http://localhost:5173`
3. Log in with your admin user
4. Begin using the application
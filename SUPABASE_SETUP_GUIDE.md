# Supabase Setup Guide for IV RELIFE Project

This guide will help you set up Supabase for the IV RELIFE project, including configuring credentials and initializing the database.

## Prerequisites

1. A Supabase account (free tier available at [supabase.com](https://supabase.com))
2. Node.js installed on your development machine
3. The IV RELIFE project codebase

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in or create an account
2. Click "New Project"
3. Enter a name for your project (e.g., "ivrelife-nexus")
4. Select a region closest to you
5. Set a secure database password (save this for later)
6. Click "Create Project" and wait for provisioning to complete (may take a few minutes)

## Step 2: Get Your Supabase Credentials

Once your project is created:

1. Click on your project to access the dashboard
2. In the left sidebar, click on "Project Settings" (gear icon)
3. Click on "API" in the settings menu
4. Copy the following values:
   - Project URL (labeled "URL")
   - anon key (public key)
   - service_role key (keep this secret!)

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root of your project with the following content:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the values you copied from the Supabase dashboard.

Example:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE4MzE4MjMwMjJ9.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Step 4: Set Up the Database Schema

1. In the Supabase dashboard, click on "SQL Editor" in the left sidebar
2. Copy the contents of `complete-database-setup.sql` from this project
3. Paste it into the SQL Editor
4. Click "Run" to execute the script

> **Note**: If you encounter a syntax error related to the "primary" column, this has been fixed in the latest version of the script. The issue was that "primary" is a reserved keyword in PostgreSQL and needed to be quoted.
>
> **Note**: If you encounter an error that a policy already exists, this has also been fixed in the latest version of the script. All policies now use `DROP POLICY IF EXISTS` before creating them to prevent conflicts when running the script multiple times.
>
> **Note**: If you encounter a syntax error related to `IF NOT EXISTS` with `CREATE OR REPLACE FUNCTION`, this has also been fixed. The `IF NOT EXISTS` clause has been removed as it's not supported for function definitions in PostgreSQL.
>
> **Note**: If you encounter a syntax error related to `IF NOT EXISTS` with `CREATE TRIGGER`, this has also been fixed. The `IF NOT EXISTS` clause has been removed as it's not supported for trigger definitions in PostgreSQL.
>
> **Note**: If you encounter an error "only WITH CHECK expression allowed for INSERT", this has been fixed. The issue was with incorrect policy syntax where `USING` was used instead of `WITH CHECK` for INSERT policies, and SELECT policies had incorrect `WITH CHECK` clauses.

This will create all necessary tables, indexes, RLS policies, and initial data.

## Step 5: Configure Authentication

The project uses email/password authentication. By default, Supabase allows email signups. To configure:

1. In the Supabase dashboard, go to "Authentication" → "Providers"
2. Ensure "Email" provider is enabled
3. You can configure additional settings like:
   - Confirm email addresses (recommended)
   - Minimum password length
   - Password requirements

## Step 6: Test the Setup

1. Install dependencies if you haven't already:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:5173` in your browser
4. Try navigating to the login page and creating an account

## Step 7: Create Your First Admin User

To create an admin user:

1. Register a new user through the app login page
2. In the Supabase SQL Editor, run this query to make the user an owner:
   ```sql
   UPDATE public.users 
   SET role = 'owner' 
   WHERE email = 'your-admin-email@example.com';
   ```

## Troubleshooting

### Environment Variables Not Loading
- Ensure your `.env.local` file is in the project root (same directory as `package.json`)
- Restart the development server after changing environment variables
- Check that variable names match exactly (including the `VITE_` prefix)

### Database Connection Issues
- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is not paused
- Ensure you're using the "anon" key for client-side operations, not the service key

### RLS (Row Level Security) Issues
- Check that your JWT tokens include the required claims
- Verify RLS policies match your user roles
- Test queries in the Supabase SQL Editor with different user roles

### Authentication Problems
- Ensure email confirmation is working if enabled
- Check Supabase auth settings for password requirements
- Verify the users table structure matches the expected schema

## Next Steps

1. Explore the application functionality
2. Review the RLS policies to ensure they meet your business requirements
3. Add sample data for testing
4. Configure additional Supabase features as needed (storage, functions, etc.)

## Security Notes

- Never commit your `.env.local` file to version control
- Don't expose your service role key in client-side code
- Regularly review and update RLS policies
- Use strong passwords for your Supabase project
- Consider enabling additional security features in Supabase dashboard
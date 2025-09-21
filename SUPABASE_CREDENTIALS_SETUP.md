# Supabase Credentials Setup for IV RELIFE Project

This document outlines the steps to ensure the proper Supabase credentials are implemented, wired, and working correctly.

## Current Configuration

The following Supabase credentials have been configured in the [.env.local](file:///Users/admin/Downloads/ivrelife-nexus-main/.env.local) file:

```env
# Supabase Credentials
SUPABASE_URL=https://nzbexzrveeyxuonooyeh.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://nzbexzrveeyxuonooyeh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YmV4enJ2ZWV5eHVvbm9veWVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM4Nzc0NSwiZXhwIjoyMDcwOTYzNzQ1fQ.sezV17K_vGjmarDOF0dLDtrh9PJHwkZtN-S368dgAno
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YmV4enJ2ZWV5eHVvbm9veWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODc3NDUsImV4cCI6MjA3MDk2Mzc0NX0.rzI2aEWJfMZoF3Qzq8PU5D7SocHz85ps5l3ubskHIs4
SUPABASE_JWT_SECRET=G3VYnjsxc69NZD5iUaFBLcnU4uuW6eyq+oDP3BgS/sXLichESpFIBwB6LBLIruKbE9+ZJ+COg3DaEVBEiAGk2A==
POSTGRES_URL=postgres://postgres.nzbexzrveeyxuonooyeh:WTbFNmN8wx1BH87W@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_PRISMA_URL=postgres://postgres.nzbexzrveeyxuonooyeh:WTbFNmN8wx1BH87W@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://postgres.nzbexzrveeyxuonooyeh:WTbFNmN8wx1BH87W@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
POSTGRES_USER=postgres
POSTGRES_HOST=db.nzbexzrveeyxuonooyeh.supabase.co
POSTGRES_PASSWORD=WTbFNmN8wx1BH87W
POSTGRES_DATABASE=postgres

# Vite environment variables (for client-side)
VITE_SUPABASE_URL=https://nzbexzrveeyxuonooyeh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YmV4enJ2ZWV5eHVvbm9veWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODc3NDUsImV4cCI6MjA3MDk2Mzc0NX0.rzI2aEWJfMZoF3Qzq8PU5D7SocHz85ps5l3ubskHIs4
```

## Required User Accounts

The following user accounts have been created:

1. **Owner/Admin User Account**: admin@iv-relife.com
2. **Retailer User Account**: retailer@iv-relife.com

Both users have been created with the appropriate roles in the system.

## Database Setup Instructions

To complete the setup, you need to run the database schema script in your Supabase project:

1. Log in to your Supabase dashboard at [supabase.com](https://supabase.com)
2. Select your project
3. Navigate to the SQL Editor in the left sidebar
4. Copy the contents of the [complete-database-setup.sql](file:///Users/admin/Downloads/ivrelife-nexus-main/complete-database-setup.sql) file from this project
5. Paste it into the SQL Editor
6. Click "Run" to execute the script

This will create all necessary tables, indexes, RLS policies, and initial data.

## Verification

You can verify that the setup is working correctly by running:

```bash
npm run verify-supabase
```

This script will check:
- That the environment variables are properly configured
- That the database connection is working
- That authentication is functioning correctly

## Troubleshooting

### Environment Variables Not Loading
- Ensure your [.env.local](file:///Users/admin/Downloads/ivrelife-nexus-main/.env.local) file is in the project root (same directory as [package.json](file:///Users/admin/Downloads/ivrelife-nexus-main/package.json))
- Restart the development server after changing environment variables
- Check that variable names match exactly (including the `VITE_` prefix for client-side variables)

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

## Security Notes

- Never commit your [.env.local](file:///Users/admin/Downloads/ivrelife-nexus-main/.env.local) file to version control
- Don't expose your service role key in client-side code
- Regularly review and update RLS policies
- Use strong passwords for your Supabase project
- Consider enabling additional security features in Supabase dashboard
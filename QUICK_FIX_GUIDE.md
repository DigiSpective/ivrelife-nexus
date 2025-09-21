# Quick Fix for Existing User Login Issue

## Problem
You have an existing user `admin@iv-relife.com` in Supabase Auth, but the app can't find the corresponding user record in the `users` table, causing the "failed to fetch user data" error.

## Solution
The authentication system now includes automatic migration that will create the missing user record when you log in. However, you need to set up the database tables first.

## Step-by-Step Fix

### 1. Set Up Database Tables

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of `database-setup.sql` 
4. **Important**: Update the email in the INSERT statement at the bottom:
   ```sql
   -- Change this line to match your actual email
   INSERT INTO users (id, email, name, role, created_at) 
   SELECT 
       auth.users.id,
       'admin@iv-relife.com', -- <-- Update this to your actual email
       'System Administrator',
       'owner',
       now()
   FROM auth.users 
   WHERE auth.users.email = 'admin@iv-relife.com' -- <-- And this one too
   ON CONFLICT (id) DO NOTHING;
   ```
5. Run the SQL script

### 2. Update User Configuration (If Needed)

If your email is different from the predefined ones, update `src/lib/user-migration.ts`:

```typescript
export const EXISTING_USERS: Record<string, { role: User['role']; name: string }> = {
  'admin@iv-relife.com': {
    role: 'owner',
    name: 'System Administrator'
  },
  'your-actual-email@domain.com': { // Add your email here
    role: 'owner',
    name: 'Your Name'
  },
  // Add more existing users here as needed
};
```

### 3. Test the Login

1. Start your dev server: `npm run dev`
2. Go to `/auth/login`
3. Enter your credentials:
   - Email: `admin@iv-relife.com` (or your actual email)
   - Password: Your actual Supabase Auth password
4. The system should now:
   - Authenticate with Supabase
   - Automatically create the missing user record
   - Log you in successfully
   - Redirect you to the owner dashboard

### 4. Verify Success

After logging in, check the browser console. You should see:
```
User not found in users table, creating record for: admin@iv-relife.com
Successfully created user record for: admin@iv-relife.com
```

## Alternative: Manual Migration Tool

If the automatic migration doesn't work, you can use the manual migration tool:

1. Add this route to your `App.tsx` (temporarily for setup):
   ```tsx
   import { UserMigrationTool } from './components/admin/UserMigrationTool';
   
   // Add this route
   <Route path="/admin/migrate" element={<UserMigrationTool />} />
   ```

2. Navigate to `/admin/migrate`
3. Use the "Migrate All Known Users" button or manually enter your user details

## What This Fix Does

1. **Creates the necessary database tables** with proper structure and security
2. **Enables automatic user migration** during login for existing Supabase Auth users
3. **Sets up proper role-based access control** with Row Level Security
4. **Creates audit logging** for all authentication events
5. **Establishes the outbox pattern** for email notifications

## Expected Behavior After Fix

- ✅ Existing Supabase Auth users can log in without errors
- ✅ Missing user records are created automatically during login
- ✅ Role-based redirects work properly (owner → dashboard)
- ✅ Session management and expiry warnings work
- ✅ Audit logging tracks all auth events
- ✅ New user registration with invites works

## Troubleshooting

### If you still get "failed to fetch user data":

1. **Check Supabase connection**:
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env.local`
   - Ensure the values are correct and not the placeholder values

2. **Check database tables**:
   - Go to Supabase Dashboard → Table Editor
   - Verify the `users` table exists with the correct columns

3. **Check Row Level Security**:
   - The automatic migration might fail if RLS policies are too restrictive
   - Temporarily disable RLS on the `users` table for testing:
     ```sql
     ALTER TABLE users DISABLE ROW LEVEL SECURITY;
     ```
   - Re-enable after confirming the migration works

4. **Check browser console**:
   - Look for detailed error messages
   - Check Network tab for failed API calls

### If the automatic migration fails:

1. Use the manual migration tool at `/admin/migrate`
2. Or manually insert the user record in SQL:
   ```sql
   INSERT INTO users (id, email, name, role) 
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'your-email@domain.com'),
     'your-email@domain.com',
     'Your Name',
     'owner'
   );
   ```

## Security Note

The migration system is designed to be secure and only creates user records for emails that already exist in Supabase Auth. It doesn't create new authentication accounts, only the corresponding application user records.

---

Once this is working, you can remove the migration tool route from your main application and enjoy the full authentication system!
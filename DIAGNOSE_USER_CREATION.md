# Diagnosing User Creation Issue

## Steps to Diagnose:

### 1. Check Browser Console Logs

Open the browser console (F12 or Cmd+Option+I) and look for:
- `🔍 createUser() called with:`
- `📝 Creating user record and sending invite...`
- `✅ Inserting user into database:`
- Any error messages with `❌`

### 2. Run Test File

Open the test file that was created: `test-user-creation.html`

This will test:
- If you can SELECT from users table
- If you can INSERT into users table
- Current authenticated user

### 3. Check RLS Policies in Supabase

Go to Supabase Dashboard → SQL Editor and run the SQL in `fix-users-rls-policies.sql`

This will:
- Show current RLS policies
- Create policies that allow admin users to create other users

### 4. Most Likely Issues:

#### Issue A: Row Level Security (RLS) Blocking Inserts
**Symptom**: INSERT operation returns error code 42501 or mentions "policy"

**Solution**: Run the SQL in `fix-users-rls-policies.sql` in Supabase SQL Editor

**Explanation**: The users table has RLS enabled, but there's no policy allowing authenticated users to insert new users.

#### Issue B: No Authenticated User
**Symptom**: Current user is null in test results

**Solution**: Log in to the application first, then try creating a user

#### Issue C: Missing Permissions
**Symptom**: Error mentions "permission denied"

**Solution**: The logged-in user needs to have 'owner' or 'backoffice' role

### 5. Quick Fix (Temporary - for testing only)

If you need to test immediately, you can temporarily disable RLS:

```sql
-- TEMPORARY - DO NOT USE IN PRODUCTION
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

After testing, re-enable it:

```sql
-- Re-enable RLS and add proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Then run the policies from fix-users-rls-policies.sql
```

### 6. Proper Solution

The proper solution is to:

1. Keep RLS enabled
2. Add policies that allow admin users (owner/backoffice) to manage other users
3. Use the SQL provided in `fix-users-rls-policies.sql`

This ensures security while allowing authorized users to create/manage other users.

## Expected Behavior After Fix:

1. Admin user clicks "Create New User" in User Management
2. Fills out the form and submits
3. User record is created in `users` table immediately
4. User appears in the user management list
5. Invitation email is sent (optional)
6. Success toast appears: "User created successfully and an invitation email has been sent..."

## Testing the Fix:

1. Run the SQL in `fix-users-rls-policies.sql`
2. Refresh the application
3. Make sure you're logged in as an owner or backoffice user
4. Try creating a new user
5. Check if the user appears in the list
6. Check Supabase Dashboard → Authentication → Users to see if they were created

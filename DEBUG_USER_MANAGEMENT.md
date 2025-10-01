# Debug User Management Issue

## 🔍 Current Status

The User Management page has been updated to fetch real users from the database instead of using mock data, but users are still not appearing.

## 🛠️ Debugging Steps Added

I've added comprehensive console logging to help diagnose the issue:

### 1. Frontend Logging (UsersAdmin.tsx)

The component now logs:
- Raw data received from the API
- Loading state
- Any errors
- User count

**Location**: `src/pages/admin/UsersAdmin.tsx:170-175`

### 2. Backend Logging (supabase.ts)

The `getUsers()` function now logs:
- When the function is called
- Whether Supabase credentials are configured
- The full result from Supabase
- Data count
- Any errors

**Location**: `src/lib/supabase.ts:1203-1220`

## 📋 Next Steps for User

### Step 1: Open Browser Console

1. Open the application in your browser
2. Navigate to `/admin/users` (User Management page)
3. Open Browser Developer Tools (F12 or Cmd+Option+I on Mac)
4. Go to the **Console** tab

### Step 2: Check Console Logs

Look for these log messages:

#### ✅ **Success Scenario**:
```
🔍 getUsers() called
✅ Fetching users from Supabase...
🔍 getUsers() result: {data: Array(X), error: null}
🔍 getUsers() data count: X
🔍 UsersAdmin - Raw usersData: {data: Array(X)}
🔍 UsersAdmin - isLoading: false
🔍 UsersAdmin - error: null
🔍 UsersAdmin - users count: X
```

#### ❌ **No Credentials Scenario**:
```
🔍 getUsers() called
❌ Supabase credentials not configured. Returning mock data.
```

**Solution**: Check your `.env` file for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

#### ❌ **Database Error Scenario**:
```
🔍 getUsers() called
✅ Fetching users from Supabase...
❌ getUsers() error: {message: "...", code: "..."}
```

**Common errors**:
- `42P01` - Table doesn't exist
- `42501` - Permission denied (RLS policy issue)

#### ❌ **Empty Database Scenario**:
```
🔍 getUsers() called
✅ Fetching users from Supabase...
🔍 getUsers() result: {data: [], error: null}
🔍 getUsers() data count: 0
```

**Solution**: The `users` table exists but is empty. You need to create users.

### Step 3: Debug Tool

I've created a standalone debugging tool to help diagnose database issues:

**File**: `debug-users.html`

**How to use**:
1. Open `debug-users.html` in your browser
2. Enter your Supabase URL and Anon Key when prompted
3. Click the buttons to:
   - Check Supabase connection
   - Check auth.users table
   - Check users table
   - Check app_users table
   - List all accessible tables

This will help you understand:
- Which user table exists in your database
- Whether it contains data
- What the data structure looks like

## 🔧 Possible Issues and Solutions

### Issue 1: Users Table Doesn't Exist

**Symptoms**:
- Error code: `42P01`
- Message: "relation \"users\" does not exist"

**Solution**:
Run the database schema migration:
```sql
-- Run this in Supabase SQL Editor
-- File: 01_COMPLETE_DATABASE_SCHEMA.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'location_user' CHECK (role IN ('owner', 'backoffice', 'retailer', 'location_user')),
    retailer_id UUID,
    location_id UUID,
    name TEXT NOT NULL,
    avatar TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Issue 2: Users Table is Empty

**Symptoms**:
- No error
- `data count: 0`
- Table exists but contains no records

**Solution**:
You need to insert users into the database. Supabase authentication users (auth.users) are separate from your application users table.

**Option A**: Create a trigger to automatically add users to the `users` table when they sign up:

```sql
-- Create function to sync auth.users to users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Option B**: Manually insert existing auth users into users table:

```sql
INSERT INTO public.users (id, email, name, role, status)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', 'User'),
  'location_user',
  'active'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
```

### Issue 3: RLS Policy Blocking Access

**Symptoms**:
- Error code: `42501`
- Message: "new row violates row-level security policy"
- Or returns empty array even though data exists

**Solution**:
Check and update RLS policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read users
CREATE POLICY "Users can view users"
    ON users FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Allow users to read their own data
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Allow admins/owners to see all users
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('owner', 'backoffice')
        )
    );
```

### Issue 4: Wrong Table Name

**Symptoms**:
- Table doesn't exist error
- But you know users exist in Supabase Auth

**Solution**:
Your database might use `app_users` instead of `users`. Update the code:

```typescript
// In src/lib/supabase.ts
export const getUsers = async () => {
  // Change 'users' to 'app_users'
  const result = await supabase.from('app_users').select('*');
  return result;
};
```

## 📊 What to Report Back

After running the debugging steps, please provide:

1. **Console logs** from the browser (copy/paste the logs that start with 🔍, ✅, or ❌)
2. **Error messages** if any
3. **Results from debug-users.html** - which tables exist and their record counts
4. **Your database setup** - which SQL migration files you've run

This information will help identify the exact issue and provide the correct solution.

## 🎯 Expected Outcome

After fixing the issue, you should see:
- ✅ Users displayed in the table
- ✅ User count showing correct number
- ✅ Ability to create, edit, and delete users
- ✅ All user information populated (name, email, role, status, etc.)

---

**Created**: 2025-09-30
**Status**: 🔍 Debugging

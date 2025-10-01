# User Management - Role-Based Access Control

## 🎯 Solution: JWT-Based Role Checking

This implements **owner-only** user management without infinite recursion errors.

## 🔑 How It Works

### The Problem
❌ Querying the `users` table inside RLS policies causes infinite recursion:
```sql
-- This breaks!
CREATE POLICY ON users USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner')
    -- ↑ queries users table while checking access to users table!
);
```

### The Solution
✅ Store role in JWT metadata, check JWT instead of database:
```sql
-- This works!
CREATE POLICY ON users USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
    -- ↑ reads from JWT token, no database query!
);
```

## 📋 Access Rules

| Action | Owner | Backoffice | Retailer | Location User |
|--------|-------|------------|----------|---------------|
| View all users | ✅ | ❌ | ❌ | ❌ |
| View self | ✅ | ✅ | ✅ | ✅ |
| Create users | ✅ | ❌ | ❌ | ❌ |
| Edit any user | ✅ | ❌ | ❌ | ❌ |
| Edit self (no role change) | ✅ | ✅ | ✅ | ✅ |
| Delete users | ✅ | ❌ | ❌ | ❌ |

## 🚀 Setup Steps

### Step 1: Run SQL Script

1. Open Supabase Dashboard → SQL Editor
2. Run **`09_SETUP_ROLE_BASED_USER_MANAGEMENT.sql`**

This will:
- ✅ Drop all broken policies
- ✅ Create `auth.user_role()` helper function
- ✅ Create `auth.is_owner()` helper function
- ✅ Create `auth.is_admin()` helper function
- ✅ Create new policies without recursion
- ✅ Set up automatic role syncing
- ✅ Sync existing users' roles to JWT
- ✅ Make admin@iv-relife.com an owner

### Step 2: Log Out and Back In

**CRITICAL**: You must log out and back in!

Your JWT token is only generated at login. After running the script, your role is now in the database metadata, but your current JWT doesn't have it yet.

1. Click profile → Sign Out
2. Sign in again as `admin@iv-relife.com`
3. Your new JWT will now contain:
   ```json
   {
     "user_metadata": {
       "role": "owner"
     }
   }
   ```

### Step 3: Verify

1. Go to User Management page (`/admin/users`)
2. You should now see all users!
3. Try creating, editing, and deleting users

## 🏗️ Technical Details

### Role Storage

Roles are stored in **two places**:

1. **`public.users.role`** - Source of truth
2. **`auth.users.raw_user_meta_data.role`** - Cached in JWT

### Automatic Sync

A database trigger keeps them in sync:

```sql
CREATE TRIGGER sync_user_role_trigger
    AFTER INSERT OR UPDATE OF role ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_role_to_jwt();
```

When you change a user's role in `public.users`, it automatically updates their `auth.users` metadata. However, **they must log out and back in** for their JWT to refresh.

### Helper Functions

```sql
-- Get current user's role from JWT (no table query!)
auth.user_role() → 'owner' | 'backoffice' | 'retailer' | 'location_user'

-- Check if current user is owner
auth.is_owner() → true | false

-- Check if current user is admin (owner or backoffice)
auth.is_admin() → true | false
```

### RLS Policies

#### SELECT (View Users)
```sql
-- Owners can view all
CREATE POLICY "owners_can_view_all_users"
    ON public.users FOR SELECT
    USING (auth.is_owner() = true);

-- Everyone can view self
CREATE POLICY "users_can_view_self"
    ON public.users FOR SELECT
    USING (auth.uid() = id);
```

#### INSERT (Create Users)
```sql
-- Only owners
CREATE POLICY "owners_can_insert_users"
    ON public.users FOR INSERT
    WITH CHECK (auth.is_owner() = true);
```

#### UPDATE (Edit Users)
```sql
-- Owners can update anyone
CREATE POLICY "owners_can_update_all_users"
    ON public.users FOR UPDATE
    USING (auth.is_owner() = true);

-- Users can update self (except role)
CREATE POLICY "users_can_update_self"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = OLD.role);
```

#### DELETE (Remove Users)
```sql
-- Only owners
CREATE POLICY "owners_can_delete_users"
    ON public.users FOR DELETE
    USING (auth.is_owner() = true);
```

## 🔒 Security Features

### Preventing Privilege Escalation

Users **cannot promote themselves**:
```sql
WITH CHECK (
    auth.uid() = id
    AND role = OLD.role  -- Role must stay the same!
)
```

Only owners can change roles.

### Role Changes Require Re-login

When an owner changes someone's role:
1. ✅ Database is updated immediately
2. ✅ JWT metadata is synced automatically
3. ❌ User's active session still has old JWT
4. ✅ User must log out and back in for new role to take effect

## 🔍 Troubleshooting

### Issue: Still Get Recursion Error

**Cause**: Didn't run the script or old policies still exist

**Fix**:
```sql
-- Check for old policies
SELECT policyname FROM pg_policies WHERE tablename = 'users';

-- Run the script again to drop them all
```

### Issue: "No Users Found" After Script

**Cause**: Haven't logged out/in yet, JWT doesn't have role

**Fix**: Log out and back in!

**Verify JWT has role**:
```sql
SELECT
    email,
    raw_user_meta_data ->> 'role' as jwt_role
FROM auth.users
WHERE email = 'admin@iv-relife.com';
```

Should show `jwt_role: 'owner'`

### Issue: Non-Owners See Nothing

**Expected**: Only owners can view User Management!

Other users can only see their own record if they navigate to `/admin/users`.

To make User Management owner-only in the UI too, add to AuthGuard:
```tsx
<Route path="/admin/users" element={
  <AuthGuard allowedRoles={['owner']}>
    <UsersAdmin />
  </AuthGuard>
} />
```

### Issue: Can't Update My Profile

**Cause**: Frontend might be sending `role` field

**Fix**: When users update their profile, don't send the `role` field, or send the existing role unchanged.

## ✅ Checklist

After running the script:

- [ ] Script ran without errors
- [ ] Logged out completely
- [ ] Logged back in as admin@iv-relife.com
- [ ] User Management page shows users
- [ ] Can create new user
- [ ] Can edit existing user
- [ ] Can delete user
- [ ] Console shows no errors

---

**File**: `09_SETUP_ROLE_BASED_USER_MANAGEMENT.sql`
**Date**: 2025-09-30
**Status**: ✅ Ready to Deploy

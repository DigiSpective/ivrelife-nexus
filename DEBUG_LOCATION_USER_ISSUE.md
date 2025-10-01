# Debug Location User Creation Issue

## The Problem
Location users are not being created, but retailer users work fine.

## What to Check

### 1. Get the Full Error Message
In the browser console, expand this error object:
```
[Error] ❌ createUser() error: – Object
```

Click the arrow to see:
- `error.message` - The error description
- `error.code` - The error code
- `error.details` - Additional details
- `error.hint` - Postgres hint

### 2. Most Likely Issues

#### Issue A: retailer_id Validation
**Symptom**: Error about `retailer_id` being invalid or null

**Cause**: The form is passing an empty string `""` instead of a valid retailer ID

**Fix**: Check that you're selecting a valid retailer from the dropdown

#### Issue B: Missing Retailer Data
**Symptom**: Dropdown shows retailers that don't exist

**Cause**: The retailers dropdown is querying the `retailers` table, but there are no retailers with role='retailer' in the users table

**Fix**: The dropdown should query users with role='retailer', not the retailers table

#### Issue C: Foreign Key Constraint
**Symptom**: Error code 23503 about foreign key violation

**Cause**: The `retailer_id` being passed doesn't exist in the retailers table

**Fix**: Need to get the retailer's ID from the users table where role='retailer'

## Quick Test

Run this in Supabase SQL Editor to see available retailers:

```sql
-- Check users with retailer role
SELECT id, email, name, role FROM public.users WHERE role = 'retailer';

-- Check retailers table
SELECT * FROM public.retailers;

-- Check if there's a foreign key from users.retailer_id to retailers.id
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'users'
    AND kcu.column_name = 'retailer_id';
```

## Expected Flow for Location User

1. Admin creates a retailer user → Gets user ID (e.g., `abc-123`)
2. Admin creates a location user → Selects retailer from dropdown
3. The retailer_id field should be set to the retailer user's ID (`abc-123`)
4. Location user is created with that retailer_id

## The Fix

The issue is likely that:
1. The dropdown is showing the wrong data source
2. OR the retailer_id needs to point to the users table, not retailers table
3. OR there's a mismatch between what the dropdown returns and what the database expects

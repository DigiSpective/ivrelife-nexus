# Database Setup Fixes Summary

This document summarizes all the fixes made to resolve issues encountered when running the database setup scripts.

## Issues Fixed

### 1. Reserved Keyword Issue
**Error**: `ERROR: 42601: syntax error at or near "boolean" LINE 94: primary boolean DEFAULT false,`

**Cause**: The column name "primary" is a reserved keyword in PostgreSQL.

**Fix**: Quoted the column name as `"primary"` in both CREATE TABLE and CREATE INDEX statements.
- File: `complete-database-setup.sql`
- File: `sql/customers-schema-and-rls.sql`

### 2. Policy Already Exists Issue
**Error**: `ERROR: 42601: policy "Users can view own data" for table "users" already exists`

**Cause**: Running the script multiple times would fail because policies already existed.

**Fix**: Added `DROP POLICY IF EXISTS` statements before each `CREATE POLICY` statement.
- File: `complete-database-setup.sql`

### 3. IF NOT EXISTS with CREATE OR REPLACE FUNCTION
**Error**: `ERROR: 42601: syntax error at or near "NOT" LINE 894: CREATE OR REPLACE FUNCTION IF NOT EXISTS update_updated_at_column()`

**Cause**: PostgreSQL does not support `IF NOT EXISTS` with `CREATE OR REPLACE FUNCTION`.

**Fix**: Removed `IF NOT EXISTS` clause from function definitions.
- File: `complete-database-setup.sql`

### 4. IF NOT EXISTS with CREATE TRIGGER
**Error**: `ERROR: 42601: syntax error at or near "NOT" LINE 904: CREATE TRIGGER IF NOT EXISTS update_users_updated_at`

**Cause**: PostgreSQL does not support `IF NOT EXISTS` with `CREATE TRIGGER`.

**Fix**: Removed `IF NOT EXISTS` clause from trigger definitions.
- File: `complete-database-setup.sql`

### 5. Incorrect Policy Syntax for INSERT
**Error**: `ERROR: 42601: only WITH CHECK expression allowed for INSERT`

**Cause**: Used `USING` clause instead of `WITH CHECK` for INSERT policies, and had incorrect `WITH CHECK` clauses on SELECT policies.

**Fixes**:
1. Changed `FOR INSERT USING ( true )` to `FOR INSERT WITH CHECK (true)` for the customer_activity policy in complete-database-setup.sql
2. Fixed the same issue in sql/customers-schema-and-rls.sql
3. Removed incorrect `WITH CHECK (true)` clause from SELECT policy in claims-schema-and-rls.sql
4. Changed `FOR INSERT USING` to `FOR INSERT WITH CHECK` for conditional INSERT policies in customer_merge_requests

**Files Modified**:
- `complete-database-setup.sql` (line 628)
- `sql/customers-schema-and-rls.sql` (line 162)
- `sql/claims-schema-and-rls.sql` (lines 118-120)

## Files Updated

1. `complete-database-setup.sql` - Main database setup script with all fixes
2. `sql/customers-schema-and-rls.sql` - Customer schema with reserved keyword fix
3. `sql/claims-schema-and-rls.sql` - Claims schema with policy syntax fix
4. `DATABASE_SETUP_README.md` - Updated documentation with all fixes
5. `SUPABASE_SETUP_GUIDE.md` - Updated documentation with all fixes

## Verification

After applying all fixes, the database setup script should run successfully without syntax errors. The script is now idempotent and can be run multiple times without causing conflicts.
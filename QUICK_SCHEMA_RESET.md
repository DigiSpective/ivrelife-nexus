# Quick Schema Reset Guide

## TL;DR - Just Run These

### Step 1: Run in Supabase SQL Editor
Copy and run `COMPLETE_DATABASE_SCHEMA.sql`

### Step 2: Run in Supabase SQL Editor
Copy and run `COMPLETE_DATABASE_SCHEMA_PART2.sql`

### Step 3: Restart Your App
```bash
npm run dev
```

### Step 4: Test
- Sign in as: `admin@iv-relife.com`
- Create a test order
- ✅ Done!

---

## What This Does

✅ Drops all existing tables
✅ Creates 30 new tables
✅ NO ENUM TYPES (fixes your issue!)
✅ Adds all indexes
✅ Sets up RLS policies
✅ Creates helper functions
✅ Inserts seed data

## Key UUIDs to Remember

```
Admin User:    5c325c42-7489-41a4-a75a-c2a52b6603a5
Demo Retailer: 550e8400-e29b-41d4-a716-446655440000
Demo Location: 660e8400-e29b-41d4-a716-446655440000
Demo Customer: dc0abfde-8588-4107-ab9b-1d5f2a91bce2
```

## If Something Goes Wrong

### Can't find function
```sql
NOTIFY pgrst, 'reload schema';
```
Wait 30 seconds, try again.

### RLS blocking requests
```sql
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

### Need to start over
Just run both scripts again - they drop everything first.

---

**Estimated Time:** 5 minutes
**Risk:** Will delete all data (that's the point!)
**Result:** Fresh, working database with no enum issues
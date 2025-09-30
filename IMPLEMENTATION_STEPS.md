# Complete Schema Implementation - Step by Step

## 🚀 Quick Start (5 Minutes)

### Step 1: Run Schema Part 1
1. Open Supabase Dashboard: https://app.supabase.com
2. Go to SQL Editor
3. Click "New Query"
4. Copy entire contents of `01_COMPLETE_DATABASE_SCHEMA.sql`
5. Paste and click **RUN**

**Expected Output:**
```
✅ Database reset complete
✅ PART 1 COMPLETE - Core tables created
✅ PART 2 COMPLETE - Customer management tables created
✅ PART 3 COMPLETE - Product catalog tables created
✅ PART 4 COMPLETE - Orders and order items tables created
✅ PART 5 COMPLETE - Shipping tables created
✅ PART 6 COMPLETE - Claims and system tables created
✅ PART 7 COMPLETE - All indexes created
✅✅✅ SCHEMA PART 1 COMPLETE ✅✅✅
Now run 02_COMPLETE_DATABASE_SCHEMA_PART2.sql
```

### Step 2: Run Schema Part 2
1. In SQL Editor, click "New Query"
2. Copy entire contents of `02_COMPLETE_DATABASE_SCHEMA_PART2.sql`
3. Paste and click **RUN**

**Expected Output:**
```
✅ PART 1 COMPLETE - Helper functions created
✅ PART 2 COMPLETE - Triggers created
✅ PART 3 COMPLETE - RLS policies created
✅ PART 4 COMPLETE - Permissions granted
✅ PART 5 COMPLETE - Seed data inserted
Schema cache reload requested
✅✅✅ COMPLETE DATABASE SCHEMA INSTALLED ✅✅✅
Tables created: 30
Functions created: 6
Users seeded: 1
Retailers seeded: 1
Locations seeded: 1
Customers seeded: 1
🎉 Schema installation complete! Application ready to use.
Restart your dev server and test order creation
```

### Step 3: Wait for Schema Cache Reload
**Wait 30 seconds** for PostgREST to reload the schema cache.

### Step 4: Restart Your Application
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 5: Test Order Creation
1. Open application: http://localhost:8084 (or your port)
2. Sign in as `admin@iv-relife.com`
3. Go to "New Order"
4. Select customer: "Demo Customer"
5. Add a product
6. Complete the order form
7. Submit

**Expected:** ✅ Order created successfully!

---

## 📋 What Gets Created

### 30 Database Tables

**Core (5 tables):**
- `users` - User accounts
- `invite_tokens` - Invitations
- `retailers` - Business entities
- `locations` - Store locations
- `user_roles` - Multi-role support

**Customers (6 tables):**
- `customers`
- `customer_contacts`
- `customer_addresses`
- `customer_documents`
- `customer_activity`
- `customer_merge_requests`

**Products (3 tables):**
- `product_categories`
- `products`
- `product_variants`

**Orders (2 tables):**
- `orders` ⭐ **NO ENUM TYPES!**
- `order_items`

**Shipping (4 tables):**
- `shipping_providers`
- `shipping_methods`
- `shipping_quotes`
- `fulfillments`

**System (10 tables):**
- `claims`
- `audit_logs`
- `outbox`
- `files_metadata`
- `user_features`
- `user_notifications`
- `system_settings`

### 6 Helper Functions

1. `create_order_direct()` - Bypass REST API, create orders directly
2. `generate_order_number()` - Auto-generate order numbers
3. `get_user_retailer_ids()` - Get accessible retailers for user
4. `can_access_retailer()` - Check retailer access permission
5. `log_audit_event()` - Log audit events
6. `update_updated_at_column()` - Automatic timestamp updates

### Seed Data

**Admin User:**
- Email: `admin@iv-relife.com`
- Password: (needs to be set)
- ID: `5c325c42-7489-41a4-a75a-c2a52b6603a5`

**Demo Retailer:**
- Name: "IV ReLife Demo Retailer"
- ID: `550e8400-e29b-41d4-a716-446655440000`

**Demo Location:**
- Name: "Main Location"
- ID: `660e8400-e29b-41d4-a716-446655440000`

**Demo Customer:**
- Name: "Demo Customer"
- ID: `dc0abfde-8588-4107-ab9b-1d5f2a91bce2`

---

## ⚠️ Important Notes

### NO ENUM TYPES
All status fields use **TEXT with CHECK constraints**. This eliminates the persistent enum caching issues you've been experiencing.

**Status Fields:**
- `orders.status`: TEXT (pending, processing, shipped, etc.)
- `fulfillments.status`: TEXT (label_created, in_transit, etc.)
- `claims.status`: TEXT (submitted, in_review, etc.)

### Reset Included
The schema includes a complete reset at the beginning. It will:
- ✅ Drop all views
- ✅ Drop all materialized views
- ✅ Drop all tables
- ✅ Drop all types (including enums)
- ✅ Drop all functions

**This means ALL DATA will be deleted.** Only run this if you're ready for a fresh start.

### RLS Policies
Row Level Security is enabled on key tables with policies for:
- Owner role: Full access
- Backoffice role: Read all, write to operations
- Retailer role: Access to own retailer only
- Location user role: Access to own retailer

---

## 🔧 Troubleshooting

### Issue: "users" is not a table
**Solution:** The reset script now drops views first. Should not occur.

### Issue: Function not found (PGRST202)
**Solution:** Wait 30 seconds after Part 2 for cache reload. Or run:
```sql
NOTIFY pgrst, 'reload schema';
```

### Issue: RLS blocking requests
**Solution:** Temporarily disable for testing:
```sql
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

### Issue: Can't sign in
**Solution:** Password hash is placeholder. Set real password:
```sql
-- First, enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Then set password
UPDATE users
SET password_hash = crypt('your-password-here', gen_salt('bf'))
WHERE email = 'admin@iv-relife.com';
```

---

## ✅ Verification

### Check Tables
```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```
**Expected:** 30

### Check Functions
```sql
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prokind = 'f'
AND proname IN ('create_order_direct', 'generate_order_number');
```
**Expected:** Both functions listed

### Check Enum Types
```sql
SELECT COUNT(*) FROM pg_type
WHERE typtype = 'e';
```
**Expected:** 0 (no enum types!)

### Test Order Function
```sql
SELECT * FROM create_order_direct(
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'dc0abfde-8588-4107-ab9b-1d5f2a91bce2'::UUID,
    '5c325c42-7489-41a4-a75a-c2a52b6603a5'::UUID,
    100.00,
    'Test order',
    '660e8400-e29b-41d4-a716-446655440000'::UUID
);
```
**Expected:** Returns order_id, order_status, order_number, order_created_at

---

## 📚 Files Reference

1. **00_COMPLETE_RESET.sql** - Optional standalone reset (not needed if using 01)
2. **01_COMPLETE_DATABASE_SCHEMA.sql** - Core schema with reset ⭐ **RUN FIRST**
3. **02_COMPLETE_DATABASE_SCHEMA_PART2.sql** - Functions, policies, seed data ⭐ **RUN SECOND**
4. **IMPLEMENTATION_STEPS.md** - This file
5. **SCHEMA_IMPLEMENTATION_GUIDE.md** - Detailed documentation

---

## 🎯 Success Criteria

After implementation, you should be able to:

- ✅ Sign in to the application
- ✅ View the demo customer
- ✅ Create a new order
- ✅ Order appears in orders list
- ✅ Order persists after page refresh
- ✅ **NO enum constraint errors!**

---

## 📞 Next Steps After Success

1. **Set Admin Password** (see troubleshooting above)
2. **Add Your Products** to the product catalog
3. **Create Real Customers**
4. **Test Full Order Flow**
5. **Configure Shipping Providers**
6. **Customize System Settings**

---

**Total Time:** 5-10 minutes
**Complexity:** Low (copy/paste/run)
**Result:** Fresh, working database with no enum issues! 🎉
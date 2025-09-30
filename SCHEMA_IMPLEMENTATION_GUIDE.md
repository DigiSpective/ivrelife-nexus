# Complete Database Schema Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the comprehensive IV ReLife Nexus database schema. The schema includes all tables, relationships, indexes, RLS policies, helper functions, and seed data.

## ⚠️ WARNING

**This will DELETE ALL existing data in your database!**

Make sure to:
1. ✅ Backup any important data
2. ✅ Confirm this is what you want to do
3. ✅ Test in a development environment first

## Files Included

1. **COMPLETE_DATABASE_SCHEMA.sql** - Core tables, indexes, and constraints
2. **COMPLETE_DATABASE_SCHEMA_PART2.sql** - RLS policies, functions, triggers, and seed data
3. **SCHEMA_IMPLEMENTATION_GUIDE.md** - This file

## Schema Features

### Tables Created (30 total)

**Core Tables:**
- `users` - User accounts and authentication
- `invite_tokens` - User invitation system
- `retailers` - Business entities
- `locations` - Physical store locations
- `user_roles` - Multi-role support

**Customer Management:**
- `customers` - Customer profiles
- `customer_contacts` - Multiple contact methods
- `customer_addresses` - Multiple addresses
- `customer_documents` - ID photos, signatures, contracts
- `customer_activity` - Activity logging
- `customer_merge_requests` - Deduplication system

**Product Catalog:**
- `product_categories` - Product categorization
- `products` - Product master data
- `product_variants` - SKUs, pricing, inventory

**Orders & Fulfillment:**
- `orders` - Order management (NO ENUMS!)
- `order_items` - Order line items
- `shipping_providers` - Carrier integrations
- `shipping_methods` - Shipping options
- `shipping_quotes` - Rate quotes
- `fulfillments` - Shipment tracking

**Claims & Returns:**
- `claims` - Damage/defect claims

**System Tables:**
- `audit_logs` - Audit trail
- `outbox` - Async event processing
- `files_metadata` - File tracking
- `user_features` - Feature flags
- `user_notifications` - Notification preferences
- `system_settings` - System configuration

### Key Features

✅ **NO ENUM TYPES** - All status fields use TEXT with CHECK constraints
✅ **Comprehensive indexes** - Optimized for performance
✅ **Row Level Security** - Fine-grained access control
✅ **Audit logging** - Full activity tracking
✅ **Multi-tenancy** - Retailer/location isolation
✅ **Helper functions** - Bypass REST API issues
✅ **Automatic timestamps** - Created/updated tracking
✅ **Seed data** - Ready to use immediately

## Implementation Steps

### Step 1: Run Core Schema

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create new query
4. Copy entire contents of **COMPLETE_DATABASE_SCHEMA.sql**
5. Paste and click **RUN**
6. Wait for completion (~30 seconds)

**Expected output:**
```
✅ PART 9 COMPLETE - All indexes created
```

### Step 2: Run Part 2 (Functions & Policies)

1. In SQL Editor, create new query
2. Copy entire contents of **COMPLETE_DATABASE_SCHEMA_PART2.sql**
3. Paste and click **RUN**
4. Wait for completion (~30 seconds)

**Expected output:**
```
✅ COMPLETE DATABASE SCHEMA INSTALLED
Tables created: 30
Functions created: 6
Users seeded: 1
Retailers seeded: 1
✅ Schema installation complete! Application ready to use.
```

### Step 3: Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Test the Application

1. Open application in browser
2. Sign in as `admin@iv-relife.com`
3. Navigate to New Order
4. Create a test order
5. Verify success!

## Database Schema Details

### Core Relationships

```
users
  ├─ belongs to → retailers (optional)
  ├─ belongs to → locations (optional)
  └─ has many → orders (created_by)

retailers
  ├─ has many → locations
  ├─ has many → customers
  ├─ has many → products
  └─ has many → orders

orders
  ├─ belongs to → retailers
  ├─ belongs to → customers
  ├─ has many → order_items
  └─ has many → fulfillments

products
  └─ has many → product_variants

customers
  ├─ has many → customer_contacts
  ├─ has many → customer_addresses
  ├─ has many → customer_documents
  └─ has many → orders
```

### Status Fields (TEXT with CHECK Constraints)

**Users:**
- `status`: active, inactive, suspended

**Retailers:**
- `status`: active, inactive, suspended

**Orders:**
- `status`: draft, pending, processing, shipped, delivered, cancelled, returned, completed

**Fulfillments:**
- `status`: label_created, in_transit, out_for_delivery, delivered, exception, returned, cancelled

**Claims:**
- `status`: submitted, in_review, approved, rejected, resolved

### Helper Functions

1. **`create_order_direct()`** - Creates orders bypassing REST API enum cache
2. **`get_user_retailer_ids()`** - Returns retailer IDs accessible by user
3. **`can_access_retailer()`** - Checks if user can access retailer
4. **`log_audit_event()`** - Logs audit events
5. **`generate_order_number()`** - Generates sequential order numbers
6. **`update_updated_at_column()`** - Trigger function for timestamps

### RLS Policies

**Owner Role:**
- Full access to all tables
- Can manage users, retailers, locations

**Backoffice Role:**
- Read access to all retailers
- Can manage orders, customers, claims

**Retailer Role:**
- Access limited to own retailer
- Can manage locations, products, orders

**Location User Role:**
- Access limited to own retailer
- Cannot manage retailer settings
- Can create orders, manage customers

### Seed Data

**Default Admin:**
- Email: `admin@iv-relife.com`
- Role: `owner`
- ID: `5c325c42-7489-41a4-a75a-c2a52b6603a5`

**Default Retailer:**
- Name: "IV ReLife Demo Retailer"
- ID: `550e8400-e29b-41d4-a716-446655440000`

**Default Location:**
- Name: "Main Location"
- ID: `660e8400-e29b-41d4-a716-446655440000`

**Default Customer:**
- Name: "Demo Customer"
- Email: demo@customer.com
- ID: `dc0abfde-8588-4107-ab9b-1d5f2a91bce2`

**Shipping Providers:**
- FedEx
- UPS
- USPS

## Verification Queries

### Check Tables Created

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected: 30 tables

### Check Functions Created

```sql
SELECT proname
FROM pg_proc
WHERE proname IN (
    'create_order_direct',
    'get_user_retailer_ids',
    'can_access_retailer',
    'log_audit_event',
    'generate_order_number',
    'update_updated_at_column'
);
```

Expected: 6 functions

### Check RLS Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

Expected: 10 tables with RLS enabled

### Test Order Creation Function

```sql
SELECT * FROM create_order_direct(
    '550e8400-e29b-41d4-a716-446655440000'::UUID,  -- retailer_id
    'dc0abfde-8588-4107-ab9b-1d5f2a91bce2'::UUID,  -- customer_id
    '5c325c42-7489-41a4-a75a-c2a52b6603a5'::UUID,  -- created_by
    100.00,                                          -- total_amount
    'Test order from SQL',                          -- notes
    '660e8400-e29b-41d4-a716-446655440000'::UUID   -- location_id
);
```

Expected: Returns order ID, status, order number, created timestamp

## Troubleshooting

### Issue: Tables already exist

**Solution:** Run Part 1 which includes DROP TABLE IF EXISTS statements

### Issue: Functions not found by REST API

**Solution:**
```sql
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
```
Wait 30 seconds, then try again.

### Issue: RLS blocking access

**Solution:** Temporarily disable RLS for testing:
```sql
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

### Issue: Seed data conflicts

**Solution:** Seed data uses ON CONFLICT DO NOTHING, safe to run multiple times

### Issue: Can't authenticate

**Solution:** Password hash is placeholder. Set proper password:
```sql
UPDATE users
SET password_hash = crypt('your-password', gen_salt('bf'))
WHERE email = 'admin@iv-relife.com';
```

(Requires pgcrypto extension)

## Application Code Updates

The application code has already been updated to use `create_order_direct()` function. No changes needed if using the existing code.

If you need to revert to REST API:
1. Wait for Supabase to clear cache (several hours)
2. Change `supabase.rpc('create_order_direct')` back to `supabase.from('orders').insert()`

## Performance Optimizations

### Indexes Created

- All foreign keys indexed
- Status fields indexed
- Date fields indexed (DESC for recent-first)
- Email/phone fields indexed
- SKU fields indexed

### Query Optimization Tips

1. Use indexes in WHERE clauses
2. Limit results with LIMIT
3. Use covering indexes when possible
4. Monitor slow query log

## Security Considerations

### RLS Policies

- All sensitive tables have RLS enabled
- Policies enforce multi-tenancy
- Owner role bypasses restrictions
- Service role has full access

### Audit Logging

- All important actions logged
- IP address captured
- User agent captured
- JSONB details for flexibility

### Data Isolation

- Retailers can't see other retailers' data
- Location users restricted to their location
- Customer data isolated by retailer

## Maintenance

### Regular Tasks

1. **Backup database** - Daily recommended
2. **Monitor audit logs** - Weekly review
3. **Process outbox** - Continuous (background job needed)
4. **Clean old sessions** - Monthly
5. **Optimize indexes** - Quarterly

### Schema Updates

When adding new tables:
1. Add to schema script
2. Add indexes
3. Add RLS policies
4. Add to backup script
5. Test thoroughly

## Support

### Documentation

- Full schema in COMPLETE_DATABASE_SCHEMA.sql
- RLS policies in COMPLETE_DATABASE_SCHEMA_PART2.sql
- Type definitions in src/types/index.ts

### Common Queries

See `VERIFICATION QUERIES` section above

---

## Summary

✅ 30 tables created
✅ Comprehensive indexes
✅ Row Level Security enabled
✅ Helper functions for common operations
✅ Seed data for immediate use
✅ NO ENUM TYPES (all TEXT with CHECK constraints)
✅ Ready for production use

**Total Implementation Time:** 5-10 minutes
**Lines of SQL:** ~2000+
**Ready to use:** Immediately after running both scripts

Your database is now fully configured and ready for the IV ReLife Nexus application!
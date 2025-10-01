-- =====================================================
-- IV RELIFE NEXUS - COMPLETE DATABASE SCHEMA
-- Step 1: Tables, Indexes, and Constraints
-- =====================================================
--
-- This script will:
-- 1. Drop ALL existing database objects (reset)
-- 2. Create comprehensive schema with 30 tables
-- 3. Add all indexes and constraints
-- 4. NO ENUM TYPES - uses TEXT with CHECK constraints
--
-- Run this FIRST, then run 02_COMPLETE_DATABASE_SCHEMA_PART2.sql
--
-- =====================================================

BEGIN;

-- =====================================================
-- RESET: DROP EVERYTHING
-- =====================================================

-- Drop all views (except PostGIS system views)
DO $$
DECLARE
    view_rec RECORD;
BEGIN
    FOR view_rec IN
        SELECT schemaname, viewname
        FROM pg_views
        WHERE schemaname = 'public'
        AND viewname NOT IN ('geography_columns', 'geometry_columns', 'spatial_ref_sys')  -- Skip PostGIS system views
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_rec.schemaname, view_rec.viewname);
    END LOOP;
END $$;

-- Drop all materialized views
DO $$
DECLARE
    mview_rec RECORD;
BEGIN
    FOR mview_rec IN
        SELECT schemaname, matviewname
        FROM pg_matviews
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I.%I CASCADE', mview_rec.schemaname, mview_rec.matviewname);
    END LOOP;
END $$;

-- Drop all tables (except spatial_ref_sys which belongs to PostGIS)
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
        AND tablename NOT IN ('spatial_ref_sys')  -- Skip PostGIS system table
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', table_rec.schemaname, table_rec.tablename);
    END LOOP;
END $$;

-- Drop all types (including enums, except extension types)
DO $$
DECLARE
    type_rec RECORD;
BEGIN
    FOR type_rec IN
        SELECT n.nspname as schema_name, t.typname as type_name
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        LEFT JOIN pg_depend d ON d.objid = t.oid AND d.deptype = 'e'
        WHERE n.nspname = 'public'
        AND t.typtype IN ('e', 'c')
        AND t.typname NOT LIKE 'pg_%'
        AND d.objid IS NULL  -- Skip types that belong to extensions
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I.%I CASCADE', type_rec.schema_name, type_rec.type_name);
    END LOOP;
END $$;

-- Drop all functions (except extension functions)
DO $$
DECLARE
    func_rec RECORD;
BEGIN
    FOR func_rec IN
        SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        AND d.objid IS NULL  -- Skip functions that belong to extensions
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', func_rec.schema_name, func_rec.function_name, func_rec.args);
    END LOOP;
END $$;

SELECT '✅ Database reset complete - ready for fresh schema' AS status;

-- =====================================================
-- PART 1: CORE TABLES
-- =====================================================

-- Users table (authentication and profile)
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

-- Invite tokens for user registration
CREATE TABLE invite_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'backoffice', 'retailer', 'location_user')),
    retailer_id UUID,
    location_id UUID,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retailers (business entities)
CREATE TABLE retailers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address JSONB,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    contract_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations (physical store locations)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id UUID NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address JSONB,
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'America/Los_Angeles',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints to users
ALTER TABLE users ADD CONSTRAINT fk_users_retailer FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- User roles (for multi-role support)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'backoffice', 'retailer', 'location_user')),
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role, retailer_id, location_id)
);

SELECT '✅ PART 1 COMPLETE - Core tables created' AS status;

-- =====================================================
-- PART 2: CUSTOMER MANAGEMENT
-- =====================================================

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    primary_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    default_address JSONB,
    notes TEXT,
    external_ids JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer contacts (multiple contact methods)
CREATE TABLE customer_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'other')),
    value TEXT NOT NULL,
    label TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer addresses (multiple addresses per customer)
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    address JSONB NOT NULL,
    label TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer documents (ID photos, signatures, contracts)
CREATE TABLE customer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    retailer_id UUID REFERENCES retailers(id),
    location_id UUID REFERENCES locations(id),
    bucket TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('id_photo', 'signature', 'contract', 'other')),
    content_type TEXT,
    size_bytes BIGINT,
    uploaded_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer activity log
CREATE TABLE customer_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id),
    actor_role TEXT,
    action TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer merge requests (for deduplication)
CREATE TABLE customer_merge_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    duplicate_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    proposed_merge_payload JSONB,
    requested_by UUID REFERENCES users(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    UNIQUE(primary_customer_id, duplicate_customer_id)
);

SELECT '✅ PART 2 COMPLETE - Customer management tables created' AS status;

-- =====================================================
-- PART 3: PRODUCT CATALOG
-- =====================================================

-- Product categories
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    requires_ltl BOOLEAN DEFAULT FALSE,
    parent_category_id UUID REFERENCES product_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    brand TEXT,
    manufacturer TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product variants (specific SKUs, colors, sizes)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2),
    msrp DECIMAL(10, 2),
    height_cm DECIMAL(10, 2),
    width_cm DECIMAL(10, 2),
    depth_cm DECIMAL(10, 2),
    weight_kg DECIMAL(10, 2),
    color TEXT,
    size TEXT,
    ltl_flag BOOLEAN DEFAULT FALSE,
    inventory_qty INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT '✅ PART 3 COMPLETE - Product catalog tables created' AS status;

-- =====================================================
-- PART 4: ORDERS AND FULFILLMENT
-- =====================================================

-- Orders (NO ENUM TYPES!)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id UUID NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES users(id),

    -- Use TEXT for status - NO ENUMS!
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'completed')),

    -- Financial fields
    subtotal_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,

    -- Shipping details
    shipping_address JSONB,
    billing_address JSONB,
    requires_ltl BOOLEAN DEFAULT FALSE,

    -- Documents
    signature_url TEXT,
    id_photo_url TEXT,
    contract_url TEXT,

    -- Order metadata
    order_number TEXT UNIQUE,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    qty INTEGER NOT NULL CHECK (qty > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    line_total DECIMAL(10, 2) GENERATED ALWAYS AS ((qty * unit_price) - COALESCE(discount_amount, 0)) STORED,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT '✅ PART 4 COMPLETE - Orders and order items tables created' AS status;

-- =====================================================
-- PART 5: SHIPPING
-- =====================================================

-- Shipping providers
CREATE TABLE shipping_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    api_identifier TEXT,
    api_key_encrypted TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping methods
CREATE TABLE shipping_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES shipping_providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    speed_estimate TEXT,
    supports_ltl BOOLEAN DEFAULT FALSE,
    base_cost DECIMAL(10, 2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping quotes
CREATE TABLE shipping_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES shipping_providers(id),
    method_id UUID REFERENCES shipping_methods(id),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    retailer_id UUID REFERENCES retailers(id),
    location_id UUID REFERENCES locations(id),
    cost DECIMAL(10, 2),
    estimated_days INTEGER,
    eta TIMESTAMPTZ,
    payload_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Fulfillments (tracking shipments)
CREATE TABLE fulfillments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES shipping_providers(id),
    method_id UUID REFERENCES shipping_methods(id),
    tracking_number TEXT,

    -- Use TEXT for status - NO ENUMS!
    status TEXT DEFAULT 'label_created' CHECK (status IN ('label_created', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'returned', 'cancelled')),

    assigned_to UUID REFERENCES users(id),
    retailer_id UUID REFERENCES retailers(id),
    location_id UUID REFERENCES locations(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    last_status_raw JSONB,
    last_check TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT '✅ PART 5 COMPLETE - Shipping tables created' AS status;

-- =====================================================
-- PART 6: CLAIMS AND SYSTEM TABLES
-- =====================================================

-- Claims
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id UUID NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id),
    customer_id UUID REFERENCES customers(id),

    -- Use TEXT for status - NO ENUMS!
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'approved', 'rejected', 'resolved')),

    claim_type TEXT CHECK (claim_type IN ('damage', 'defect', 'wrong_item', 'missing', 'other')),
    reason TEXT NOT NULL,
    description TEXT,
    resolution_notes TEXT,
    resolution_amount DECIMAL(10, 2),

    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),

    -- Use TEXT for action - NO ENUMS!
    action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'password_reset', 'registration', 'invite_accepted', 'profile_update', 'role_change', 'create', 'update', 'delete')),

    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outbox pattern for async events
CREATE TABLE outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Use TEXT for event_type - NO ENUMS!
    event_type TEXT NOT NULL CHECK (event_type IN ('welcome_email', 'password_reset_email', 'invite_email', 'notification', 'webhook')),

    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File metadata
CREATE TABLE files_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    retailer_id UUID REFERENCES retailers(id),
    location_id UUID REFERENCES locations(id),
    purpose TEXT NOT NULL,
    content_type TEXT,
    size_bytes BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bucket, storage_path)
);

-- User features (feature flags per user)
CREATE TABLE user_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, feature_key)
);

-- User notification preferences
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Use TEXT for type - NO ENUMS!
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push', 'in_app')),

    category TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, type, category)
);

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT '✅ PART 6 COMPLETE - Claims and system tables created' AS status;

-- =====================================================
-- PART 7: INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_retailer ON users(retailer_id);
CREATE INDEX idx_users_location ON users(location_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Retailers indexes
CREATE INDEX idx_retailers_status ON retailers(status);

-- Locations indexes
CREATE INDEX idx_locations_retailer ON locations(retailer_id);

-- Customers indexes
CREATE INDEX idx_customers_retailer ON customers(retailer_id);
CREATE INDEX idx_customers_location ON customers(primary_location_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_created_by ON customers(created_by);

-- Customer contacts indexes
CREATE INDEX idx_customer_contacts_customer ON customer_contacts(customer_id);
CREATE INDEX idx_customer_contacts_type ON customer_contacts(type);

-- Customer addresses indexes
CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_primary ON customer_addresses(is_primary);

-- Customer documents indexes
CREATE INDEX idx_customer_documents_customer ON customer_documents(customer_id);
CREATE INDEX idx_customer_documents_purpose ON customer_documents(purpose);

-- Products indexes
CREATE INDEX idx_products_retailer ON products(retailer_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);

-- Product variants indexes
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_price ON product_variants(price);

-- Orders indexes
CREATE INDEX idx_orders_retailer ON orders(retailer_id);
CREATE INDEX idx_orders_location ON orders(location_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_created_by ON orders(created_by);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_variant ON order_items(product_variant_id);

-- Fulfillments indexes
CREATE INDEX idx_fulfillments_order ON fulfillments(order_id);
CREATE INDEX idx_fulfillments_tracking ON fulfillments(tracking_number);
CREATE INDEX idx_fulfillments_status ON fulfillments(status);

-- Claims indexes
CREATE INDEX idx_claims_retailer ON claims(retailer_id);
CREATE INDEX idx_claims_order ON claims(order_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_created_by ON claims(created_by);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Outbox indexes
CREATE INDEX idx_outbox_processed ON outbox(processed_at) WHERE processed_at IS NULL;
CREATE INDEX idx_outbox_created_at ON outbox(created_at);

SELECT '✅ PART 7 COMPLETE - All indexes created' AS status;

COMMIT;

SELECT '✅✅✅ SCHEMA PART 1 COMPLETE ✅✅✅' AS final_status;
SELECT 'Now run 02_COMPLETE_DATABASE_SCHEMA_PART2.sql' AS next_step;
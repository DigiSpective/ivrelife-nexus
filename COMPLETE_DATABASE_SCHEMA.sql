-- =====================================================
-- IV RELIFE NEXUS - COMPLETE DATABASE SCHEMA
-- Comprehensive reset and rebuild script
-- =====================================================
--
-- This script will:
-- 1. Drop all existing tables, functions, and types
-- 2. Create a clean, comprehensive schema
-- 3. Add all indexes and constraints
-- 4. Set up RLS policies
-- 5. Create helper functions
-- 6. Insert seed data
--
-- WARNING: This will DELETE ALL existing data!
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: COMPLETE RESET
-- =====================================================

-- Drop all existing tables (in reverse dependency order)
DROP TABLE IF EXISTS outbox CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_notifications CASCADE;
DROP TABLE IF EXISTS user_features CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS files_metadata CASCADE;
DROP TABLE IF EXISTS customer_merge_requests CASCADE;
DROP TABLE IF EXISTS customer_activity CASCADE;
DROP TABLE IF EXISTS customer_documents CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS customer_contacts CASCADE;
DROP TABLE IF EXISTS fulfillments CASCADE;
DROP TABLE IF EXISTS shipping_quotes CASCADE;
DROP TABLE IF EXISTS shipping_methods CASCADE;
DROP TABLE IF EXISTS shipping_providers CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS retailers CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS invite_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop all enum types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS retailer_status CASCADE;
DROP TYPE IF EXISTS contact_type CASCADE;
DROP TYPE IF EXISTS document_purpose CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS fulfillment_status CASCADE;
DROP TYPE IF EXISTS claim_status CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;
DROP TYPE IF EXISTS outbox_event_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS create_order_direct CASCADE;
DROP FUNCTION IF EXISTS get_user_role CASCADE;
DROP FUNCTION IF EXISTS check_retailer_access CASCADE;

-- =====================================================
-- PART 2: CORE TABLES
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

-- =====================================================
-- PART 3: CUSTOMER MANAGEMENT
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

-- =====================================================
-- PART 4: PRODUCT CATALOG
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

-- =====================================================
-- PART 5: ORDERS AND FULFILLMENT
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

-- =====================================================
-- PART 6: SHIPPING
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
    last_status_raw JSONB,
    last_check TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 7: CLAIMS AND RETURNS
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

-- =====================================================
-- PART 8: SYSTEM TABLES
-- =====================================================

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

COMMIT;

-- =====================================================
-- PART 9: INDEXES
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

SELECT '✅ PART 9 COMPLETE - All indexes created' AS status;
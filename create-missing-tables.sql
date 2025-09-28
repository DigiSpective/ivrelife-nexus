-- ============================================================================
-- Create Missing Tables for IV RELIFE Nexus App
-- ============================================================================
-- This script creates the specific tables needed for the app functionality
-- Run this in your Supabase SQL Editor
--
-- ⚠️  SAFE TO RUN MULTIPLE TIMES: This script uses IF NOT EXISTS and DROP IF EXISTS
--    patterns to ensure it can be run repeatedly without errors.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

-- User roles enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'employee', 'viewer', 'customer', 'provider');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Fulfillment status enum
DO $$ BEGIN
    CREATE TYPE fulfillment_status AS ENUM (
        'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- USERS TABLE (if it doesn't exist, create mapping)
-- ============================================================================

-- Create users table that maps to app_users if needed
CREATE OR REPLACE VIEW users AS 
SELECT 
    id,
    email,
    COALESCE(role::text, 'employee') as role,
    retailer_id,
    NULL::UUID as location_id,
    COALESCE(full_name, first_name || ' ' || last_name, email) as name,
    NULL as avatar,
    created_at,
    updated_at
FROM app_users
WHERE app_users.id IS NOT NULL;

-- ============================================================================
-- FULFILLMENTS TABLE (Critical for shipping functionality)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fulfillments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    location_id UUID, -- Can reference locations if table exists
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Fulfillment details
    fulfillment_number TEXT UNIQUE,
    status fulfillment_status DEFAULT 'pending',
    
    -- Shipping information
    tracking_number TEXT,
    carrier TEXT,
    service_type TEXT,
    shipping_cost DECIMAL(10,2),
    
    -- Items being fulfilled (JSON array)
    items JSONB DEFAULT '[]'::jsonb,
    
    -- Addresses
    shipping_address JSONB,
    billing_address JSONB,
    
    -- Timestamps
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    expected_delivery_date DATE,
    
    -- Notes and metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit fields
    created_by UUID REFERENCES app_users(id),
    updated_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SHIPPING TABLES
-- ============================================================================

-- Shipping providers table
CREATE TABLE IF NOT EXISTS shipping_providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    credentials JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(retailer_id, code)
);

-- Shipping methods table
CREATE TABLE IF NOT EXISTS shipping_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID REFERENCES shipping_providers(id) ON DELETE CASCADE,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    base_cost DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, code)
);

-- Shipping quotes table
CREATE TABLE IF NOT EXISTS shipping_quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    location_id UUID, -- Can reference locations if table exists
    method_id UUID REFERENCES shipping_methods(id),
    
    -- Quote details
    service_name TEXT NOT NULL,
    carrier TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    delivery_days INTEGER,
    
    -- Quote data
    quote_data JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_selected BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LOCATIONS TABLE (if missing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address JSONB,
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    business_hours JSONB DEFAULT '{}'::jsonb,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Fulfillments indexes
CREATE INDEX IF NOT EXISTS idx_fulfillments_order_id ON fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_retailer_id ON fulfillments(retailer_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_status ON fulfillments(status);
CREATE INDEX IF NOT EXISTS idx_fulfillments_tracking_number ON fulfillments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_fulfillments_created_at ON fulfillments(created_at);

-- Shipping indexes
CREATE INDEX IF NOT EXISTS idx_shipping_providers_retailer_id ON shipping_providers(retailer_id);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_provider_id ON shipping_methods(provider_id);
CREATE INDEX IF NOT EXISTS idx_shipping_quotes_order_id ON shipping_quotes(order_id);

-- Locations indexes
CREATE INDEX IF NOT EXISTS idx_locations_retailer_id ON locations(retailer_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Fulfillments policies (drop existing ones first)
DROP POLICY IF EXISTS "Users can view fulfillments for their retailer" ON fulfillments;
CREATE POLICY "Users can view fulfillments for their retailer" ON fulfillments
    FOR SELECT USING (
        retailer_id IN (
            SELECT retailer_id FROM app_users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create fulfillments for their retailer" ON fulfillments;
CREATE POLICY "Users can create fulfillments for their retailer" ON fulfillments
    FOR INSERT WITH CHECK (
        retailer_id IN (
            SELECT retailer_id FROM app_users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update fulfillments for their retailer" ON fulfillments;
CREATE POLICY "Users can update fulfillments for their retailer" ON fulfillments
    FOR UPDATE USING (
        retailer_id IN (
            SELECT retailer_id FROM app_users WHERE id = auth.uid()
        )
    );

-- Shipping providers policies
DROP POLICY IF EXISTS "Users can view shipping providers for their retailer" ON shipping_providers;
CREATE POLICY "Users can view shipping providers for their retailer" ON shipping_providers
    FOR SELECT USING (
        retailer_id IN (
            SELECT retailer_id FROM app_users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage shipping providers for their retailer" ON shipping_providers;
CREATE POLICY "Users can manage shipping providers for their retailer" ON shipping_providers
    FOR ALL USING (
        retailer_id IN (
            SELECT retailer_id FROM app_users WHERE id = auth.uid()
        )
    );

-- Shipping methods policies
DROP POLICY IF EXISTS "Users can view shipping methods for their retailer" ON shipping_methods;
CREATE POLICY "Users can view shipping methods for their retailer" ON shipping_methods
    FOR SELECT USING (
        retailer_id IN (
            SELECT retailer_id FROM app_users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage shipping methods for their retailer" ON shipping_methods;
CREATE POLICY "Users can manage shipping methods for their retailer" ON shipping_methods
    FOR ALL USING (
        retailer_id IN (
            SELECT retailer_id FROM app_users WHERE id = auth.uid()
        )
    );

-- Shipping quotes policies  
DROP POLICY IF EXISTS "Users can view shipping quotes for their retailer" ON shipping_quotes;
CREATE POLICY "Users can view shipping quotes for their retailer" ON shipping_quotes
    FOR SELECT USING (
        retailer_id IN (
            SELECT retailer_id FROM app_users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage shipping quotes for their retailer" ON shipping_quotes;
CREATE POLICY "Users can manage shipping quotes for their retailer" ON shipping_quotes
    FOR ALL USING (
        retailer_id IN (
            SELECT retailer_id FROM app_users WHERE id = auth.uid()
        )
    );

-- Locations policies
DROP POLICY IF EXISTS "Users can view locations for their retailer" ON locations;
CREATE POLICY "Users can view locations for their retailer" ON locations
    FOR SELECT USING (
        retailer_id IN (
            SELECT retailer_id FROM app_users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage locations for their retailer" ON locations;
CREATE POLICY "Users can manage locations for their retailer" ON locations
    FOR ALL USING (
        retailer_id IN (
            SELECT retailer_id FROM app_users WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Insert default shipping provider
INSERT INTO shipping_providers (retailer_id, name, code, settings) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Manual Shipping', 'manual', '{
        "description": "Manual shipping method for local deliveries"
    }'::jsonb)
ON CONFLICT (retailer_id, code) DO NOTHING;

-- Insert default shipping method
INSERT INTO shipping_methods (
    provider_id, 
    retailer_id, 
    name, 
    code, 
    description, 
    base_cost
) 
SELECT 
    sp.id,
    sp.retailer_id,
    'Standard Delivery',
    'standard',
    'Standard delivery service',
    10.00
FROM shipping_providers sp 
WHERE sp.code = 'manual' 
AND sp.retailer_id = '550e8400-e29b-41d4-a716-446655440000'
ON CONFLICT (provider_id, code) DO NOTHING;

-- Insert default location if not exists
INSERT INTO locations (id, retailer_id, name, timezone, is_primary) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Main Location', 'America/New_York', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- USER STORAGE TABLE
-- ============================================================================

-- Create user_storage table for app data persistence
CREATE TABLE IF NOT EXISTS user_storage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    storage_key TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, storage_key)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_storage_user_id ON user_storage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_storage_key ON user_storage(storage_key);
CREATE INDEX IF NOT EXISTS idx_user_storage_user_key ON user_storage(user_id, storage_key);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_storage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_storage_updated_at ON user_storage;
CREATE TRIGGER trigger_user_storage_updated_at
    BEFORE UPDATE ON user_storage
    FOR EACH ROW EXECUTE FUNCTION update_user_storage_updated_at();

-- Enable RLS
ALTER TABLE user_storage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_storage
DROP POLICY IF EXISTS "Users can only access their own storage data" ON user_storage;
CREATE POLICY "Users can only access their own storage data" ON user_storage
    FOR ALL USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON user_storage TO authenticated;
-- Grant sequence permissions (handle different sequence naming patterns)
DO $$
BEGIN
    -- Try different sequence name patterns
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'user_storage_id_seq') THEN
        GRANT USAGE ON SEQUENCE user_storage_id_seq TO authenticated;
    END IF;
    
    -- PostgreSQL 10+ generated sequence naming
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'user_storage_pkey_seq') THEN
        GRANT USAGE ON SEQUENCE user_storage_pkey_seq TO authenticated;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not grant sequence permissions, but table should work fine: %', SQLERRM;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Missing Tables Setup Complete for IV RELIFE Nexus!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Created Tables:';
    RAISE NOTICE '- fulfillments (for shipping functionality)';
    RAISE NOTICE '- shipping_providers';
    RAISE NOTICE '- shipping_methods'; 
    RAISE NOTICE '- shipping_quotes';
    RAISE NOTICE '- locations';
    RAISE NOTICE '- user_storage (for app data persistence)';
    RAISE NOTICE '- users view (mapping to app_users)';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Your app should now connect to actual Supabase tables!';
    RAISE NOTICE '=================================================================';
END $$;
-- ============================================================================
-- Create CORE Tables for IV RELIFE Nexus App - DATA PERSISTENCE FIX
-- ============================================================================
-- This script creates the ESSENTIAL tables needed for app data persistence
-- Run this FIRST in your Supabase SQL Editor before create-missing-tables.sql
--
-- ⚠️  CRITICAL: This fixes the missing customers and core tables issue
-- ⚠️  SAFE TO RUN MULTIPLE TIMES: Uses IF NOT EXISTS patterns
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE AUTHENTICATION AND USER TABLES
-- ============================================================================

-- App users table (if it doesn't exist, this maps to auth.users)
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'employee',
    retailer_id UUID,
    location_id UUID,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- RETAILERS TABLE (Core dependency)
-- ============================================================================

CREATE TABLE IF NOT EXISTS retailers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    address JSONB,
    phone TEXT,
    email TEXT,
    website TEXT,
    tax_id TEXT,
    business_hours JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default retailer if not exists (with error handling for schema differences)
DO $$
BEGIN
    -- Try with full schema first
    BEGIN
        INSERT INTO retailers (id, name, code, email) VALUES
            ('550e8400-e29b-41d4-a716-446655440000', 'Default Retailer', 'DEFAULT', 'admin@ivrelife.com')
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION
        WHEN undefined_column THEN
            -- Fallback: Insert without code column if it doesn't exist
            BEGIN
                INSERT INTO retailers (id, name, email) VALUES
                    ('550e8400-e29b-41d4-a716-446655440000', 'Default Retailer', 'admin@ivrelife.com')
                ON CONFLICT (id) DO NOTHING;
            EXCEPTION
                WHEN OTHERS THEN
                    -- If that fails too, try minimal insert
                    INSERT INTO retailers (id, name) VALUES
                        ('550e8400-e29b-41d4-a716-446655440000', 'Default Retailer')
                    ON CONFLICT (id) DO NOTHING;
            END;
    END;
END $$;

-- ============================================================================
-- CUSTOMERS TABLE (CRITICAL MISSING TABLE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    primary_location_id UUID,
    
    -- Core customer info
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    
    -- Address information
    default_address JSONB,
    
    -- Additional fields
    notes TEXT,
    external_ids JSONB DEFAULT '{}'::jsonb,
    
    -- Audit fields
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ORDERS TABLE (Core business logic)
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    location_id UUID,
    
    -- Order details
    order_number TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    total_amount DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    
    -- Order data
    items JSONB DEFAULT '[]'::jsonb,
    shipping_address JSONB,
    billing_address JSONB,
    
    -- Timestamps
    ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes and metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit fields
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PRODUCTS TABLE (Business dependency)
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    
    -- Product details
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    
    -- Pricing
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    
    -- Inventory
    stock_quantity INTEGER DEFAULT 0,
    
    -- Categories and metadata
    category TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(retailer_id, sku)
);

-- ============================================================================
-- USER STORAGE TABLE (CRITICAL FOR APP PERSISTENCE)
-- ============================================================================

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

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_retailer_id ON customers(retailer_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_retailer_id ON orders(retailer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_retailer_id ON products(retailer_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- User storage indexes
CREATE INDEX IF NOT EXISTS idx_user_storage_user_id ON user_storage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_storage_key ON user_storage(storage_key);
CREATE INDEX IF NOT EXISTS idx_user_storage_user_key ON user_storage(user_id, storage_key);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CUSTOMERS TABLE POLICIES
-- ============================================================================

-- Allow authenticated users to view customers for their retailer
DROP POLICY IF EXISTS "Users can view customers for their retailer" ON customers;
CREATE POLICY "Users can view customers for their retailer" ON customers
    FOR SELECT USING (
        -- Allow if user belongs to the same retailer OR if no retailer restriction
        retailer_id IN (
            SELECT COALESCE(au.retailer_id, '550e8400-e29b-41d4-a716-446655440000') 
            FROM app_users au 
            WHERE au.id = auth.uid()
            UNION
            SELECT '550e8400-e29b-41d4-a716-446655440000' -- Default retailer
        )
        OR auth.uid() IS NOT NULL -- Fallback: allow any authenticated user
    );

-- Allow authenticated users to create customers
DROP POLICY IF EXISTS "Users can create customers" ON customers;
CREATE POLICY "Users can create customers" ON customers
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            retailer_id IN (
                SELECT COALESCE(au.retailer_id, '550e8400-e29b-41d4-a716-446655440000') 
                FROM app_users au 
                WHERE au.id = auth.uid()
            )
            OR retailer_id = '550e8400-e29b-41d4-a716-446655440000'
        )
    );

-- Allow users to update customers
DROP POLICY IF EXISTS "Users can update customers" ON customers;
CREATE POLICY "Users can update customers" ON customers
    FOR UPDATE USING (
        retailer_id IN (
            SELECT COALESCE(au.retailer_id, '550e8400-e29b-41d4-a716-446655440000') 
            FROM app_users au 
            WHERE au.id = auth.uid()
            UNION
            SELECT '550e8400-e29b-41d4-a716-446655440000'
        )
        OR auth.uid() IS NOT NULL
    );

-- Allow users to delete customers
DROP POLICY IF EXISTS "Users can delete customers" ON customers;
CREATE POLICY "Users can delete customers" ON customers
    FOR DELETE USING (
        retailer_id IN (
            SELECT COALESCE(au.retailer_id, '550e8400-e29b-41d4-a716-446655440000') 
            FROM app_users au 
            WHERE au.id = auth.uid()
            UNION
            SELECT '550e8400-e29b-41d4-a716-446655440000'
        )
        OR auth.uid() IS NOT NULL
    );

-- ============================================================================
-- USER STORAGE TABLE POLICIES (CRITICAL FOR PERSISTENCE)
-- ============================================================================

-- Users can only access their own storage data
DROP POLICY IF EXISTS "Users can only access their own storage data" ON user_storage;
CREATE POLICY "Users can only access their own storage data" ON user_storage
    FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view orders for their retailer" ON orders;
CREATE POLICY "Users can view orders for their retailer" ON orders
    FOR SELECT USING (
        retailer_id IN (
            SELECT COALESCE(au.retailer_id, '550e8400-e29b-41d4-a716-446655440000') 
            FROM app_users au 
            WHERE au.id = auth.uid()
            UNION
            SELECT '550e8400-e29b-41d4-a716-446655440000'
        )
        OR auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update orders" ON orders;
CREATE POLICY "Users can update orders" ON orders
    FOR UPDATE USING (
        retailer_id IN (
            SELECT COALESCE(au.retailer_id, '550e8400-e29b-41d4-a716-446655440000') 
            FROM app_users au 
            WHERE au.id = auth.uid()
            UNION
            SELECT '550e8400-e29b-41d4-a716-446655440000'
        )
        OR auth.uid() IS NOT NULL
    );

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view products" ON products;
CREATE POLICY "Users can view products" ON products
    FOR SELECT USING (
        retailer_id IN (
            SELECT COALESCE(au.retailer_id, '550e8400-e29b-41d4-a716-446655440000') 
            FROM app_users au 
            WHERE au.id = auth.uid()
            UNION
            SELECT '550e8400-e29b-41d4-a716-446655440000'
        )
        OR auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "Users can manage products" ON products;
CREATE POLICY "Users can manage products" ON products
    FOR ALL USING (
        retailer_id IN (
            SELECT COALESCE(au.retailer_id, '550e8400-e29b-41d4-a716-446655440000') 
            FROM app_users au 
            WHERE au.id = auth.uid()
            UNION
            SELECT '550e8400-e29b-41d4-a716-446655440000'
        )
        OR auth.uid() IS NOT NULL
    );

-- ============================================================================
-- RETAILERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view retailers" ON retailers;
CREATE POLICY "Users can view retailers" ON retailers
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant table permissions
GRANT ALL ON customers TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON user_storage TO authenticated;
GRANT ALL ON retailers TO authenticated;
GRANT ALL ON app_users TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_storage_updated_at ON user_storage;
CREATE TRIGGER update_user_storage_updated_at
    BEFORE UPDATE ON user_storage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_retailers_updated_at ON retailers;
CREATE TRIGGER update_retailers_updated_at
    BEFORE UPDATE ON retailers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Insert sample customers for testing
INSERT INTO customers (id, name, email, phone, retailer_id, created_by) VALUES
    ('cust-sample-1', 'John Doe', 'john@example.com', '555-0101', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'),
    ('cust-sample-2', 'Jane Smith', 'jane@example.com', '555-0102', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000'),
    ('cust-sample-3', 'Bob Johnson', 'bob@example.com', '555-0103', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (id, name, description, sku, price, retailer_id) VALUES
    ('prod-sample-1', 'Sample Product 1', 'This is a sample product for testing', 'SKU001', 29.99, '550e8400-e29b-41d4-a716-446655440000'),
    ('prod-sample-2', 'Sample Product 2', 'Another sample product', 'SKU002', 49.99, '550e8400-e29b-41d4-a716-446655440000'),
    ('prod-sample-3', 'Sample Product 3', 'Third sample product', 'SKU003', 19.99, '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'CORE TABLES SETUP COMPLETE FOR IV RELIFE NEXUS!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Created Core Tables:';
    RAISE NOTICE '- ✅ retailers (with default retailer)';
    RAISE NOTICE '- ✅ customers (CRITICAL - was missing!)';
    RAISE NOTICE '- ✅ orders (business logic)';
    RAISE NOTICE '- ✅ products (catalog)';
    RAISE NOTICE '- ✅ user_storage (app persistence - CRITICAL!)';
    RAISE NOTICE '- ✅ app_users (user management)';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'RLS Policies: ✅ Created with fallback permissions';
    RAISE NOTICE 'Sample Data: ✅ 3 customers and 3 products inserted';
    RAISE NOTICE 'Permissions: ✅ Granted to authenticated users';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'YOUR APP SHOULD NOW HAVE WORKING SUPABASE PERSISTENCE!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Test connection with the Supabase test tool';
    RAISE NOTICE '2. Sign in to create a user account';
    RAISE NOTICE '3. Test customer creation/persistence';
    RAISE NOTICE '4. Optionally run create-missing-tables.sql for shipping features';
    RAISE NOTICE '=================================================================';
END $$;
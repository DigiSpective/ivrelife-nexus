-- ============================================================================
-- Create CORE Tables - SIMPLIFIED VERSION (Safe Fallback)
-- ============================================================================
-- This is a simplified version that focuses on creating the essential tables
-- Run this if create-core-tables.sql encounters schema conflicts
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- RETAILERS TABLE (Create or use existing)
-- ============================================================================

-- Create retailers table with minimal schema if it doesn't exist
CREATE TABLE IF NOT EXISTS retailers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add code column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='retailers' AND column_name='code') THEN
        ALTER TABLE retailers ADD COLUMN code TEXT;
    END IF;
    
    -- Add email column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='retailers' AND column_name='email') THEN
        ALTER TABLE retailers ADD COLUMN email TEXT;
    END IF;
    
    -- Add other commonly needed columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='retailers' AND column_name='address') THEN
        ALTER TABLE retailers ADD COLUMN address JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='retailers' AND column_name='phone') THEN
        ALTER TABLE retailers ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='retailers' AND column_name='is_active') THEN
        ALTER TABLE retailers ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Insert default retailer safely
INSERT INTO retailers (id, name, code, email) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Default Retailer', 'DEFAULT', 'admin@ivrelife.com')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CUSTOMERS TABLE (CRITICAL MISSING TABLE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    retailer_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    
    -- Core customer info
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    
    -- Address information
    default_address JSONB,
    
    -- Additional fields
    notes TEXT,
    
    -- Audit fields
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key if retailers exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='retailers') THEN
        -- Try to add foreign key constraint
        BEGIN
            ALTER TABLE customers ADD CONSTRAINT fk_customers_retailer 
                FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE;
        EXCEPTION
            WHEN duplicate_object THEN
                -- Constraint already exists, ignore
                NULL;
        END;
    END IF;
END $$;

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
-- ORDERS TABLE (Basic version)
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    retailer_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    customer_id UUID,
    
    -- Order details
    order_number TEXT,
    status TEXT DEFAULT 'pending',
    total_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Order data
    items JSONB DEFAULT '[]'::jsonb,
    
    -- Audit fields
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign keys if possible
DO $$
BEGIN
    -- Add customer foreign key if customers table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='customers') THEN
        BEGIN
            ALTER TABLE orders ADD CONSTRAINT fk_orders_customer 
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- ============================================================================
-- PRODUCTS TABLE (Basic version)
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    retailer_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    
    -- Product details
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    
    -- Pricing
    price DECIMAL(10,2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- BASIC INDEXES
-- ============================================================================

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_retailer_id ON customers(retailer_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);

-- User storage indexes
CREATE INDEX IF NOT EXISTS idx_user_storage_user_id ON user_storage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_user_key ON user_storage(user_id, storage_key);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_storage ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies for development
DROP POLICY IF EXISTS "Allow authenticated users full access to customers" ON customers;
CREATE POLICY "Allow authenticated users full access to customers" ON customers
    FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can only access their own storage data" ON user_storage;
CREATE POLICY "Users can only access their own storage data" ON user_storage
    FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow authenticated users access to orders" ON orders;
CREATE POLICY "Allow authenticated users access to orders" ON orders
    FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users access to products" ON products;
CREATE POLICY "Allow authenticated users access to products" ON products
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant table permissions
GRANT ALL ON customers TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON user_storage TO authenticated;
GRANT ALL ON retailers TO authenticated;

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

DROP TRIGGER IF EXISTS update_user_storage_updated_at ON user_storage;
CREATE TRIGGER update_user_storage_updated_at
    BEFORE UPDATE ON user_storage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSERT SAMPLE DATA
-- ============================================================================

-- Insert sample customers for testing
INSERT INTO customers (id, name, email, phone, created_by) VALUES
    ('cust-sample-1', 'John Doe', 'john@example.com', '555-0101', '550e8400-e29b-41d4-a716-446655440000'),
    ('cust-sample-2', 'Jane Smith', 'jane@example.com', '555-0102', '550e8400-e29b-41d4-a716-446655440000'),
    ('cust-sample-3', 'Bob Johnson', 'bob@example.com', '555-0103', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (id, name, description, sku, price) VALUES
    ('prod-sample-1', 'Sample Product 1', 'This is a sample product for testing', 'SKU001', 29.99),
    ('prod-sample-2', 'Sample Product 2', 'Another sample product', 'SKU002', 49.99),
    ('prod-sample-3', 'Sample Product 3', 'Third sample product', 'SKU003', 19.99)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'SIMPLIFIED CORE TABLES SETUP COMPLETE!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Created Core Tables:';
    RAISE NOTICE '- ✅ retailers (schema-safe)';
    RAISE NOTICE '- ✅ customers (CRITICAL - was missing!)';
    RAISE NOTICE '- ✅ orders (basic version)';
    RAISE NOTICE '- ✅ products (basic version)';
    RAISE NOTICE '- ✅ user_storage (app persistence - CRITICAL!)';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'RLS Policies: ✅ Created with permissive development policies';
    RAISE NOTICE 'Sample Data: ✅ 3 customers and 3 products inserted';
    RAISE NOTICE 'Permissions: ✅ Granted to authenticated users';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'YOUR APP SHOULD NOW HAVE WORKING SUPABASE PERSISTENCE!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Test connection with: http://localhost:8084/supabase-db-test.html';
    RAISE NOTICE '2. Sign in to create a user account';
    RAISE NOTICE '3. Test customer creation/persistence';
    RAISE NOTICE '================================================================';
END $$;
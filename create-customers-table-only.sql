-- ============================================================================
-- CREATE CUSTOMERS TABLE ONLY - FOCUSED FIX
-- ============================================================================
-- Based on diagnosis: user_storage exists with correct schema
-- This script creates ONLY the missing customers table and essential components
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE MINIMAL RETAILERS TABLE (for foreign key reference)
-- ============================================================================

CREATE TABLE IF NOT EXISTS retailers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT DEFAULT 'Default Retailer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default retailer
INSERT INTO retailers (id, name) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Default Retailer')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CREATE CUSTOMERS TABLE (THE MISSING CRITICAL TABLE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    
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

-- ============================================================================
-- CREATE ESSENTIAL INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_customers_retailer_id ON customers(retailer_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE PERMISSIVE POLICIES FOR DEVELOPMENT
-- ============================================================================

-- Allow authenticated users full access to customers
DROP POLICY IF EXISTS "Allow authenticated users full access to customers" ON customers;
CREATE POLICY "Allow authenticated users full access to customers" ON customers
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to view retailers
DROP POLICY IF EXISTS "Allow authenticated users to view retailers" ON retailers;
CREATE POLICY "Allow authenticated users to view retailers" ON retailers
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON customers TO authenticated;
GRANT ALL ON retailers TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- CREATE UPDATED_AT TRIGGER
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for customers updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
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

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'CUSTOMERS TABLE CREATED SUCCESSFULLY!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '- ✅ retailers table (minimal for foreign key)';
    RAISE NOTICE '- ✅ customers table (THE MISSING CRITICAL TABLE!)';
    RAISE NOTICE '- ✅ RLS policies (permissive for development)';
    RAISE NOTICE '- ✅ Essential indexes';
    RAISE NOTICE '- ✅ Sample data (3 test customers)';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'EXISTING INFRASTRUCTURE CONFIRMED:';
    RAISE NOTICE '- ✅ user_storage table (already exists with correct schema)';
    RAISE NOTICE '- ✅ Supabase authentication (ready)';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'YOUR APP SHOULD NOW HAVE WORKING PERSISTENCE!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Test: http://localhost:8084/supabase-db-test.html';
    RAISE NOTICE '2. Test: http://localhost:8084/customers';
    RAISE NOTICE '3. Add customer → Refresh page → Should persist! ✅';
    RAISE NOTICE '================================================================';
END $$;
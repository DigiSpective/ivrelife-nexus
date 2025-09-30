-- =====================================================
-- IV RELIFE NEXUS - COMPLETE DATABASE SCHEMA (PART 2)
-- Step 2: Functions, Triggers, RLS Policies, Seed Data
-- =====================================================
--
-- Run this AFTER running 01_COMPLETE_DATABASE_SCHEMA.sql
--
-- This script creates:
-- - Helper functions
-- - Automatic triggers
-- - RLS policies
-- - Seed data
--
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get count of orders today
    SELECT COUNT(*) INTO counter
    FROM orders
    WHERE DATE(created_at) = CURRENT_DATE;

    -- Generate order number: ORD-YYYYMMDD-NNNN
    new_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create order (bypasses REST API enum issues)
CREATE OR REPLACE FUNCTION create_order_direct(
    p_retailer_id UUID,
    p_customer_id UUID,
    p_created_by UUID,
    p_total_amount DECIMAL,
    p_notes TEXT DEFAULT NULL,
    p_location_id UUID DEFAULT NULL
)
RETURNS TABLE (
    order_id UUID,
    order_status TEXT,
    order_number TEXT,
    order_created_at TIMESTAMPTZ
) AS $$
DECLARE
    new_order_id UUID;
    new_order_number TEXT;
BEGIN
    -- Generate order number
    new_order_number := generate_order_number();

    -- Insert the order
    INSERT INTO orders (
        retailer_id,
        customer_id,
        location_id,
        created_by,
        total_amount,
        notes,
        status,
        order_number
    ) VALUES (
        p_retailer_id,
        p_customer_id,
        p_location_id,
        p_created_by,
        p_total_amount,
        p_notes,
        'pending',
        new_order_number
    )
    RETURNING id INTO new_order_id;

    -- Return the created order info
    RETURN QUERY
    SELECT
        o.id,
        o.status,
        o.order_number,
        o.created_at
    FROM orders o
    WHERE o.id = new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible retailer IDs
CREATE OR REPLACE FUNCTION get_user_retailer_ids(p_user_id UUID)
RETURNS UUID[] AS $$
DECLARE
    user_role TEXT;
    retailer_ids UUID[];
BEGIN
    -- Get user's primary role
    SELECT role INTO user_role FROM users WHERE id = p_user_id;

    -- Owner and backoffice can access all retailers
    IF user_role IN ('owner', 'backoffice') THEN
        SELECT ARRAY_AGG(id) INTO retailer_ids FROM retailers;
        RETURN retailer_ids;
    END IF;

    -- Retailer users can only access their retailer
    IF user_role = 'retailer' THEN
        SELECT ARRAY[retailer_id] INTO retailer_ids FROM users WHERE id = p_user_id;
        RETURN retailer_ids;
    END IF;

    -- Location users can only access their retailer
    IF user_role = 'location_user' THEN
        SELECT ARRAY[retailer_id] INTO retailer_ids FROM users WHERE id = p_user_id;
        RETURN retailer_ids;
    END IF;

    RETURN ARRAY[]::UUID[];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access retailer
CREATE OR REPLACE FUNCTION can_access_retailer(p_user_id UUID, p_retailer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_retailer_id UUID;
BEGIN
    SELECT role, retailer_id INTO user_role, user_retailer_id
    FROM users WHERE id = p_user_id;

    -- Owner and backoffice can access all
    IF user_role IN ('owner', 'backoffice') THEN
        RETURN TRUE;
    END IF;

    -- Others can only access their own retailer
    RETURN user_retailer_id = p_retailer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details)
    RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ PART 1 COMPLETE - Helper functions created' AS status;

-- =====================================================
-- PART 2: TRIGGERS
-- =====================================================

-- Trigger for users updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for retailers updated_at
CREATE TRIGGER update_retailers_updated_at
    BEFORE UPDATE ON retailers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for locations updated_at
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for customers updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for products updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for product_variants updated_at
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for fulfillments updated_at
CREATE TRIGGER update_fulfillments_updated_at
    BEFORE UPDATE ON fulfillments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for claims updated_at
CREATE TRIGGER update_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ PART 2 COMPLETE - Triggers created' AS status;

-- =====================================================
-- PART 3: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Owners can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Retailers policies
CREATE POLICY "Users can view accessible retailers"
    ON retailers FOR SELECT
    USING (
        id = ANY(get_user_retailer_ids(auth.uid()))
    );

CREATE POLICY "Owners can manage retailers"
    ON retailers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- Locations policies
CREATE POLICY "Users can view accessible locations"
    ON locations FOR SELECT
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
    );

CREATE POLICY "Retailers can manage their locations"
    ON locations FOR ALL
    USING (
        can_access_retailer(auth.uid(), retailer_id)
    );

-- Customers policies
CREATE POLICY "Users can view customers from accessible retailers"
    ON customers FOR SELECT
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
        OR retailer_id IS NULL
    );

CREATE POLICY "Users can create customers"
    ON customers FOR INSERT
    WITH CHECK (
        can_access_retailer(auth.uid(), retailer_id)
        OR retailer_id IS NULL
    );

CREATE POLICY "Users can update customers from accessible retailers"
    ON customers FOR UPDATE
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
        OR retailer_id IS NULL
    );

-- Products policies
CREATE POLICY "Users can view products from accessible retailers"
    ON products FOR SELECT
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
        OR retailer_id IS NULL
    );

CREATE POLICY "Retailers can manage their products"
    ON products FOR ALL
    USING (
        can_access_retailer(auth.uid(), retailer_id)
    );

-- Product variants policies
CREATE POLICY "Users can view accessible product variants"
    ON product_variants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = product_variants.product_id
            AND (p.retailer_id = ANY(get_user_retailer_ids(auth.uid())) OR p.retailer_id IS NULL)
        )
    );

-- Orders policies
CREATE POLICY "Users can view orders from accessible retailers"
    ON orders FOR SELECT
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
    );

CREATE POLICY "Users can create orders for accessible retailers"
    ON orders FOR INSERT
    WITH CHECK (
        can_access_retailer(auth.uid(), retailer_id)
    );

CREATE POLICY "Users can update orders from accessible retailers"
    ON orders FOR UPDATE
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
    );

-- Order items policies
CREATE POLICY "Users can view order items from accessible orders"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
            AND o.retailer_id = ANY(get_user_retailer_ids(auth.uid()))
        )
    );

CREATE POLICY "Users can manage order items for accessible orders"
    ON order_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
            AND o.retailer_id = ANY(get_user_retailer_ids(auth.uid()))
        )
    );

-- Fulfillments policies
CREATE POLICY "Users can view fulfillments from accessible retailers"
    ON fulfillments FOR SELECT
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
    );

CREATE POLICY "Users can manage fulfillments for accessible retailers"
    ON fulfillments FOR ALL
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
    );

-- Claims policies
CREATE POLICY "Users can view claims from accessible retailers"
    ON claims FOR SELECT
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
    );

CREATE POLICY "Users can create claims for accessible retailers"
    ON claims FOR INSERT
    WITH CHECK (
        can_access_retailer(auth.uid(), retailer_id)
    );

CREATE POLICY "Users can update claims from accessible retailers"
    ON claims FOR UPDATE
    USING (
        retailer_id = ANY(get_user_retailer_ids(auth.uid()))
    );

SELECT '✅ PART 3 COMPLETE - RLS policies created' AS status;

-- =====================================================
-- PART 4: GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_order_direct TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_direct TO anon;
GRANT EXECUTE ON FUNCTION get_user_retailer_ids TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_retailer TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION generate_order_number TO authenticated;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

SELECT '✅ PART 4 COMPLETE - Permissions granted' AS status;

COMMIT;

-- =====================================================
-- PART 5: SEED DATA
-- =====================================================

BEGIN;

-- Insert system admin user
INSERT INTO users (id, email, password_hash, role, name, status)
VALUES (
    '5c325c42-7489-41a4-a75a-c2a52b6603a5'::UUID,
    'admin@iv-relife.com',
    '$2a$10$placeholder', -- This should be replaced with actual bcrypt hash
    'owner',
    'System Administrator',
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- Insert default retailer
INSERT INTO retailers (id, name, email, phone, status)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'IV ReLife Demo Retailer',
    'retailer@iv-relife.com',
    '555-0100',
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- Insert default location
INSERT INTO locations (id, retailer_id, name, phone, timezone)
VALUES (
    '660e8400-e29b-41d4-a716-446655440000'::UUID,
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'Main Location',
    '555-0101',
    'America/Los_Angeles'
)
ON CONFLICT (id) DO NOTHING;

-- Insert demo customer
INSERT INTO customers (id, retailer_id, name, email, phone, created_by)
VALUES (
    'dc0abfde-8588-4107-ab9b-1d5f2a91bce2'::UUID,
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'Demo Customer',
    'demo@customer.com',
    '555-0200',
    '5c325c42-7489-41a4-a75a-c2a52b6603a5'::UUID
)
ON CONFLICT (id) DO NOTHING;

-- Insert shipping providers
INSERT INTO shipping_providers (id, name, api_identifier, active)
VALUES
    (gen_random_uuid(), 'FedEx', 'fedex', TRUE),
    (gen_random_uuid(), 'UPS', 'ups', TRUE),
    (gen_random_uuid(), 'USPS', 'usps', TRUE)
ON CONFLICT DO NOTHING;

-- Insert system settings
INSERT INTO system_settings (key, value, description)
VALUES
    ('app_name', '"IV ReLife Nexus"', 'Application name'),
    ('default_tax_rate', '0.08', 'Default tax rate (8%)'),
    ('low_stock_threshold', '10', 'Default low stock threshold'),
    ('order_auto_complete_days', '30', 'Days after which orders are auto-completed')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

SELECT '✅ PART 5 COMPLETE - Seed data inserted' AS status;

COMMIT;

-- =====================================================
-- PART 6: RELOAD SCHEMA CACHE
-- =====================================================

-- Force PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

SELECT 'Schema cache reload requested' AS status;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

SELECT '✅✅✅ COMPLETE DATABASE SCHEMA INSTALLED ✅✅✅' AS final_status;

SELECT
    'Tables created' AS check_type,
    COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';

SELECT
    'Functions created' AS check_type,
    COUNT(*) AS count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
AND p.proname IN ('update_updated_at_column', 'create_order_direct', 'get_user_retailer_ids', 'can_access_retailer', 'log_audit_event', 'generate_order_number');

SELECT
    'Users seeded' AS check_type,
    COUNT(*) AS count
FROM users;

SELECT
    'Retailers seeded' AS check_type,
    COUNT(*) AS count
FROM retailers;

SELECT
    'Locations seeded' AS check_type,
    COUNT(*) AS count
FROM locations;

SELECT
    'Customers seeded' AS check_type,
    COUNT(*) AS count
FROM customers;

SELECT '🎉 Schema installation complete! Application ready to use.' AS next_step;
SELECT 'Restart your dev server and test order creation' AS action_required;
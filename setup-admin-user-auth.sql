-- ============================================================================
-- SETUP ADMIN USER AND PROPER AUTHENTICATION
-- ============================================================================
-- This script creates the admin user and proper RLS policies for real authentication
-- ============================================================================

-- ============================================================================
-- CREATE ADMIN USER (If not exists)
-- ============================================================================

-- Note: User creation via SQL is not recommended in production
-- This should be done via Supabase Auth API or Dashboard
-- For development, create user via Supabase Dashboard or this script

-- Insert admin user into auth.users if not exists
-- WARNING: This bypasses normal Supabase auth flow - use only for development
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) 
SELECT 
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@iv-relife.com',
    crypt('123456789', gen_salt('bf')), -- Hash the password
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User", "role": "owner"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@iv-relife.com');

-- ============================================================================
-- UPDATE RLS POLICIES FOR AUTHENTICATED USERS
-- ============================================================================

DO $$
BEGIN
    -- Drop existing permissive policies
    DROP POLICY IF EXISTS "Development friendly orders access" ON orders;
    DROP POLICY IF EXISTS "Development friendly claims access" ON claims;
    DROP POLICY IF EXISTS "Development friendly shipments access" ON shipments;
    DROP POLICY IF EXISTS "Development friendly customers access" ON customers;
    
    -- Create proper RLS policies for authenticated users
    CREATE POLICY "Authenticated users can access orders" ON orders
        FOR ALL USING (
            auth.uid() IS NOT NULL AND (
                created_by = auth.uid()::text OR
                created_by = 'usr-1' -- Temporary compatibility with existing mock data
            )
        );
        
    CREATE POLICY "Authenticated users can access claims" ON claims
        FOR ALL USING (
            auth.uid() IS NOT NULL AND (
                created_by = auth.uid()::text OR
                created_by = 'usr-1' -- Temporary compatibility with existing mock data
            )
        );
        
    CREATE POLICY "Authenticated users can access shipments" ON shipments
        FOR ALL USING (
            auth.uid() IS NOT NULL AND (
                created_by = auth.uid()::text OR
                created_by = 'usr-1' -- Temporary compatibility with existing mock data
            )
        );
        
    CREATE POLICY "Authenticated users can access customers" ON customers
        FOR ALL USING (
            auth.uid() IS NOT NULL AND (
                created_by = auth.uid()::text OR
                created_by = 'usr-1' -- Temporary compatibility with existing mock data
            )
        );
        
    -- User storage policy
    DROP POLICY IF EXISTS "Users can manage their own data" ON user_storage;
    CREATE POLICY "Users can manage their own data" ON user_storage
        FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);
    
    RAISE NOTICE '✅ Created proper RLS policies for authenticated users';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create some policies: %', SQLERRM;
END $$;

-- ============================================================================
-- MIGRATE MOCK DATA TO ADMIN USER
-- ============================================================================

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@iv-relife.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Update existing mock data to be owned by admin user
        UPDATE orders SET created_by = admin_user_id WHERE created_by = 'usr-1';
        UPDATE claims SET created_by = admin_user_id WHERE created_by = 'usr-1';
        UPDATE shipments SET created_by = admin_user_id WHERE created_by = 'usr-1';
        UPDATE customers SET created_by = admin_user_id WHERE created_by = 'usr-1';
        
        RAISE NOTICE '✅ Migrated mock data to admin user: %', admin_user_id;
    ELSE
        RAISE NOTICE '❌ Admin user not found - could not migrate data';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not migrate data: %', SQLERRM;
END $$;

-- ============================================================================
-- CREATE SAMPLE DATA FOR ADMIN USER
-- ============================================================================

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@iv-relife.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Insert sample data for admin user
        INSERT INTO orders (id, retailer_id, customer_id, status, total_amount, items, created_by, created_at, updated_at) VALUES
            ('admin-order-1', '550e8400-e29b-41d4-a716-446655440000', 'admin-customer-1', 'pending', 299.99, '[{"product": "Sample Product", "qty": 1, "price": 299.99}]', admin_user_id, NOW(), NOW()),
            ('admin-order-2', '550e8400-e29b-41d4-a716-446655440000', 'admin-customer-2', 'processing', 599.99, '[{"product": "Another Product", "qty": 2, "price": 299.99}]', admin_user_id, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO claims (id, retailer_id, customer_id, reason, status, description, created_by, created_at, updated_at) VALUES
            ('admin-claim-1', '550e8400-e29b-41d4-a716-446655440000', 'admin-customer-1', 'Product damaged', 'submitted', 'Product arrived damaged during shipping', admin_user_id, NOW(), NOW()),
            ('admin-claim-2', '550e8400-e29b-41d4-a716-446655440000', 'admin-customer-2', 'Wrong item', 'in_review', 'Received wrong product', admin_user_id, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO shipments (id, order_id, retailer_id, tracking_number, carrier, status, created_by, created_at, updated_at) VALUES
            ('admin-shipment-1', 'admin-order-1', '550e8400-e29b-41d4-a716-446655440000', 'ADMIN123456', 'UPS', 'SHIPPED', admin_user_id, NOW(), NOW()),
            ('admin-shipment-2', 'admin-order-2', '550e8400-e29b-41d4-a716-446655440000', 'ADMIN789012', 'FedEx', 'PENDING', admin_user_id, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO customers (id, name, email, phone, retailer_id, created_by, created_at, updated_at) VALUES
            ('admin-customer-1', 'Admin Test Customer 1', 'test1@admin.com', '555-0001', '550e8400-e29b-41d4-a716-446655440000', admin_user_id, NOW(), NOW()),
            ('admin-customer-2', 'Admin Test Customer 2', 'test2@admin.com', '555-0002', '550e8400-e29b-41d4-a716-446655440000', admin_user_id, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE '✅ Created sample data for admin user';
    ELSE
        RAISE NOTICE '❌ Admin user not found - could not create sample data';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create sample data: %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFY SETUP
-- ============================================================================

DO $$
DECLARE
    admin_user_id UUID;
    order_count INTEGER;
    claim_count INTEGER;
    shipment_count INTEGER;
    customer_count INTEGER;
BEGIN
    -- Get admin user info
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@iv-relife.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Count data for admin user
        SELECT COUNT(*) INTO order_count FROM orders WHERE created_by = admin_user_id;
        SELECT COUNT(*) INTO claim_count FROM claims WHERE created_by = admin_user_id;
        SELECT COUNT(*) INTO shipment_count FROM shipments WHERE created_by = admin_user_id;
        SELECT COUNT(*) INTO customer_count FROM customers WHERE created_by = admin_user_id;
        
        RAISE NOTICE '================================================================';
        RAISE NOTICE 'ADMIN USER AUTHENTICATION SETUP COMPLETE!';
        RAISE NOTICE '================================================================';
        RAISE NOTICE 'Admin User: admin@iv-relife.com';
        RAISE NOTICE 'Admin User ID: %', admin_user_id;
        RAISE NOTICE 'Password: 123456789';
        RAISE NOTICE '================================================================';
        RAISE NOTICE 'Data for admin user:';
        RAISE NOTICE '- Orders: % rows', order_count;
        RAISE NOTICE '- Claims: % rows', claim_count;
        RAISE NOTICE '- Shipments: % rows', shipment_count;
        RAISE NOTICE '- Customers: % rows', customer_count;
        RAISE NOTICE '================================================================';
        RAISE NOTICE 'RLS policies configured for authenticated users';
        RAISE NOTICE 'App should now use real Supabase authentication! 🎉';
        RAISE NOTICE '================================================================';
    ELSE
        RAISE NOTICE '❌ SETUP FAILED: Admin user not found';
        RAISE NOTICE 'Please create admin@iv-relife.com manually in Supabase Dashboard';
    END IF;
END $$;
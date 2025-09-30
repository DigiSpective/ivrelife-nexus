-- Fix Missing Database References for Order Creation
-- This creates the retailer and customer records that the app expects

-- Insert the retailer that the app is trying to reference
INSERT INTO retailers (
    id,
    name,
    email,
    phone,
    address,
    city,
    state,
    zip,
    country,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'IV ReLife Main Retailer',
    'admin@iv-relife.com',
    '555-0123',
    '123 Main Street',
    'Test City',
    'CA',
    '12345',
    'USA',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- Insert the customer that the app is trying to reference
INSERT INTO customers (
    id,
    retailer_id,
    name,
    email,
    phone,
    created_at,
    updated_at
) VALUES (
    'dc0abfde-8588-4107-ab9b-1d5f2a91bce2',
    '550e8400-e29b-41d4-a716-446655440000',
    'Test Customer',
    'customer@example.com',
    '555-0124',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- Verify the references exist
SELECT 'Retailer created:' as status, id, name FROM retailers WHERE id = '550e8400-e29b-41d4-a716-446655440000';
SELECT 'Customer created:' as status, id, name FROM customers WHERE id = 'dc0abfde-8588-4107-ab9b-1d5f2a91bce2';
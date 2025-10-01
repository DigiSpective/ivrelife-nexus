-- =====================================================
-- ADD SHIPPING METHODS SEED DATA
-- =====================================================
--
-- This script adds shipping methods for existing providers
-- Run this AFTER running the complete database schema scripts
--
-- =====================================================

BEGIN;

-- First, let's get the provider IDs (they're UUIDs)
DO $$
DECLARE
    fedex_id UUID;
    ups_id UUID;
    usps_id UUID;
BEGIN
    -- Get provider IDs
    SELECT id INTO fedex_id FROM shipping_providers WHERE api_identifier = 'fedex' LIMIT 1;
    SELECT id INTO ups_id FROM shipping_providers WHERE api_identifier = 'ups' LIMIT 1;
    SELECT id INTO usps_id FROM shipping_providers WHERE api_identifier = 'usps' LIMIT 1;

    -- Insert UPS shipping methods
    IF ups_id IS NOT NULL THEN
        INSERT INTO shipping_methods (provider_id, name, code, speed_estimate, supports_ltl, base_cost, active)
        VALUES
            (ups_id, 'UPS Ground', 'ups_ground', '1-5 business days', FALSE, 15.99, TRUE),
            (ups_id, 'UPS 2nd Day Air', 'ups_2day', '2 business days', FALSE, 24.99, TRUE),
            (ups_id, 'UPS Next Day Air', 'ups_express', '1 business day', FALSE, 45.99, TRUE),
            (ups_id, 'UPS White Glove', 'ups_white_glove', '5-14 business days', TRUE, 700.00, TRUE)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Insert FedEx shipping methods
    IF fedex_id IS NOT NULL THEN
        INSERT INTO shipping_methods (provider_id, name, code, speed_estimate, supports_ltl, base_cost, active)
        VALUES
            (fedex_id, 'FedEx Ground', 'fedex_ground', '1-5 business days', FALSE, 16.49, TRUE),
            (fedex_id, 'FedEx 2Day', 'fedex_2day', '2 business days', FALSE, 24.99, TRUE),
            (fedex_id, 'FedEx Express', 'fedex_express', '1 business day', FALSE, 45.99, TRUE),
            (fedex_id, 'FedEx Freight', 'fedex_freight', '3-7 business days', TRUE, 299.99, TRUE)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Insert USPS shipping methods
    IF usps_id IS NOT NULL THEN
        INSERT INTO shipping_methods (provider_id, name, code, speed_estimate, supports_ltl, base_cost, active)
        VALUES
            (usps_id, 'USPS Priority Mail', 'usps_priority', '1-3 business days', FALSE, 12.99, TRUE),
            (usps_id, 'USPS Priority Mail Express', 'usps_express', '1-2 business days', FALSE, 34.99, TRUE),
            (usps_id, 'USPS Ground Advantage', 'usps_ground', '2-5 business days', FALSE, 9.99, TRUE)
        ON CONFLICT DO NOTHING;
    END IF;

    RAISE NOTICE '✅ Shipping methods added successfully';
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT
    sp.name AS provider,
    sm.name AS method,
    sm.code,
    sm.speed_estimate,
    sm.supports_ltl,
    sm.base_cost,
    sm.active
FROM shipping_methods sm
JOIN shipping_providers sp ON sm.provider_id = sp.id
ORDER BY sp.name, sm.name;

SELECT
    sp.name AS provider,
    COUNT(sm.id) AS method_count
FROM shipping_providers sp
LEFT JOIN shipping_methods sm ON sp.id = sm.provider_id
GROUP BY sp.name
ORDER BY sp.name;

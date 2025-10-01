-- =====================================================
-- ADD LTL FREIGHT SHIPPING PROVIDER AND METHODS
-- =====================================================
--
-- This script adds LTL (Less Than Truckload) freight shipping
-- for oversized items like massage chairs and spa capsules
--
-- =====================================================

BEGIN;

-- Add LTL Freight provider
INSERT INTO shipping_providers (id, name, api_identifier, active)
VALUES
    (gen_random_uuid(), 'LTL Freight', 'ltl_freight', TRUE)
ON CONFLICT (name) DO NOTHING
RETURNING id, name;

-- Get the LTL provider ID and add methods
DO $$
DECLARE
    ltl_provider_id UUID;
BEGIN
    -- Get LTL provider ID
    SELECT id INTO ltl_provider_id
    FROM shipping_providers
    WHERE api_identifier = 'ltl_freight'
    LIMIT 1;

    IF ltl_provider_id IS NOT NULL THEN
        -- Add LTL shipping methods
        INSERT INTO shipping_methods (provider_id, name, code, speed_estimate, supports_ltl, base_cost, active)
        VALUES
            (ltl_provider_id, 'Standard LTL Freight', 'ltl_standard', '7-21 business days', TRUE, 299.99, TRUE),
            (ltl_provider_id, 'Expedited LTL Freight', 'ltl_expedited', '3-7 business days', TRUE, 449.99, TRUE),
            (ltl_provider_id, 'LTL with Liftgate', 'ltl_liftgate', '7-21 business days', TRUE, 349.99, TRUE),
            (ltl_provider_id, 'LTL Inside Delivery', 'ltl_inside', '7-21 business days', TRUE, 399.99, TRUE)
        ON CONFLICT DO NOTHING;

        RAISE NOTICE '✅ LTL Freight methods added successfully';
    ELSE
        RAISE NOTICE '⚠️  LTL Freight provider not found';
    END IF;
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
    sm.base_cost
FROM shipping_methods sm
JOIN shipping_providers sp ON sm.provider_id = sp.id
WHERE sm.supports_ltl = TRUE
ORDER BY sp.name, sm.name;

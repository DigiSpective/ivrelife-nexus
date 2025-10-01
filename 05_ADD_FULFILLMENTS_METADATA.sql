-- =====================================================
-- ADD METADATA COLUMN TO FULFILLMENTS TABLE
-- =====================================================
--
-- This adds the missing 'metadata' JSONB column to store
-- additional shipment information like addresses, packages, etc.
--
-- =====================================================

BEGIN;

-- Add metadata column to fulfillments table
ALTER TABLE fulfillments
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN fulfillments.metadata IS 'Stores additional shipment data including addresses, packages, special instructions, etc.';

-- Create an index on metadata for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_fulfillments_metadata ON fulfillments USING GIN (metadata);

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'fulfillments'
AND column_name = 'metadata';

SELECT '✅ metadata column added to fulfillments table' AS status;

-- Show updated table structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'fulfillments'
ORDER BY ordinal_position;

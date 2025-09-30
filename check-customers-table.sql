-- ============================================================================
-- CHECK CUSTOMERS TABLE SCHEMA
-- ============================================================================
-- This will show us exactly what columns exist in the customers table
-- ============================================================================

-- Show columns for customers table
SELECT 
    'CUSTOMERS TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- Show a sample of data if any exists
SELECT 'SAMPLE CUSTOMERS DATA:' as info;
SELECT * FROM customers LIMIT 3;
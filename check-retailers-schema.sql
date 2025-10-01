-- Check the actual structure of the retailers table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'retailers'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show all current retailers
SELECT * FROM retailers LIMIT 10;

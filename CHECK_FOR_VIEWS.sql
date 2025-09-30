-- Check for views or API schema objects
SELECT
    schemaname,
    tablename as view_name,
    definition
FROM pg_views
WHERE schemaname IN ('public', 'api')
AND tablename LIKE '%order%';

-- Check if there's an api schema
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'api';

-- Check what PostgREST sees
SELECT
    n.nspname as schema,
    c.relname as table_name,
    c.relkind as type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'orders'
AND n.nspname IN ('public', 'api');

-- Check for any generated columns
SELECT
    column_name,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE table_name = 'orders'
AND is_generated = 'ALWAYS';
-- ============================================================================
-- CHECK SUPABASE AUTOMATIC BACKUPS
-- ============================================================================
-- First, let's see if we can find any backup information
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Check if there are any backup-related tables or views
SELECT 'Checking for backup information...' as step;

-- List all available schemas (sometimes backups are in different schemas)
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;

-- Check if there are any tables in other schemas that might be backups
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname != 'public'
AND schemaname NOT LIKE 'pg_%'
AND schemaname NOT LIKE 'information_schema'
ORDER BY schemaname, tablename;

-- Check for any views that might show backup info
SELECT 
    table_schema,
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
AND table_name ILIKE '%backup%'
OR table_name ILIKE '%history%'
OR table_name ILIKE '%log%';

SELECT 'Backup check complete - see results above' as status;
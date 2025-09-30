-- =====================================================
-- STEP 0: COMPLETE RESET - RUN THIS FIRST
-- =====================================================
--
-- This script will completely wipe the database clean
-- Drop ALL tables, views, functions, types, triggers
--
-- WARNING: This will DELETE EVERYTHING!
--
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: DROP ALL VIEWS
-- =====================================================

DO $$
DECLARE
    view_rec RECORD;
BEGIN
    FOR view_rec IN
        SELECT schemaname, viewname
        FROM pg_views
        WHERE schemaname = 'public'
        AND viewname NOT IN ('geography_columns', 'geometry_columns', 'spatial_ref_sys')  -- Skip PostGIS system views
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_rec.schemaname, view_rec.viewname);
        RAISE NOTICE 'Dropped view: %.%', view_rec.schemaname, view_rec.viewname;
    END LOOP;
END $$;

-- =====================================================
-- PART 2: DROP ALL MATERIALIZED VIEWS
-- =====================================================

DO $$
DECLARE
    mview_rec RECORD;
BEGIN
    FOR mview_rec IN
        SELECT schemaname, matviewname
        FROM pg_matviews
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I.%I CASCADE', mview_rec.schemaname, mview_rec.matviewname);
        RAISE NOTICE 'Dropped materialized view: %.%', mview_rec.schemaname, mview_rec.matviewname;
    END LOOP;
END $$;

-- =====================================================
-- PART 3: DROP ALL TABLES
-- =====================================================

DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
        AND tablename NOT IN ('spatial_ref_sys')  -- Skip PostGIS system table
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', table_rec.schemaname, table_rec.tablename);
        RAISE NOTICE 'Dropped table: %.%', table_rec.schemaname, table_rec.tablename;
    END LOOP;
END $$;

-- =====================================================
-- PART 4: DROP ALL SEQUENCES
-- =====================================================

DO $$
DECLARE
    seq_rec RECORD;
BEGIN
    FOR seq_rec IN
        SELECT schemaname, sequencename
        FROM pg_sequences
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP SEQUENCE IF EXISTS %I.%I CASCADE', seq_rec.schemaname, seq_rec.sequencename);
        RAISE NOTICE 'Dropped sequence: %.%', seq_rec.schemaname, seq_rec.sequencename;
    END LOOP;
END $$;

-- =====================================================
-- PART 5: DROP ALL FUNCTIONS
-- =====================================================

DO $$
DECLARE
    func_rec RECORD;
BEGIN
    FOR func_rec IN
        SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        AND d.objid IS NULL  -- Skip functions that belong to extensions
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', func_rec.schema_name, func_rec.function_name, func_rec.args);
        RAISE NOTICE 'Dropped function: %.%', func_rec.schema_name, func_rec.function_name;
    END LOOP;
END $$;

-- =====================================================
-- PART 6: DROP ALL TRIGGERS
-- =====================================================

DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN
        SELECT trigger_schema, trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', trigger_rec.trigger_name, trigger_rec.event_object_table);
        RAISE NOTICE 'Dropped trigger: % on %', trigger_rec.trigger_name, trigger_rec.event_object_table;
    END LOOP;
END $$;

-- =====================================================
-- PART 7: DROP ALL TYPES (including enums)
-- =====================================================

DO $$
DECLARE
    type_rec RECORD;
BEGIN
    FOR type_rec IN
        SELECT n.nspname as schema_name, t.typname as type_name
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        LEFT JOIN pg_depend d ON d.objid = t.oid AND d.deptype = 'e'
        WHERE n.nspname = 'public'
        AND t.typtype IN ('e', 'c')  -- enums and composite types
        AND t.typname NOT LIKE 'pg_%'
        AND d.objid IS NULL  -- Skip types that belong to extensions
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I.%I CASCADE', type_rec.schema_name, type_rec.type_name);
        RAISE NOTICE 'Dropped type: %.%', type_rec.schema_name, type_rec.type_name;
    END LOOP;
END $$;

-- =====================================================
-- PART 8: DROP ALL POLICIES
-- =====================================================

DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_rec.policyname, policy_rec.schemaname, policy_rec.tablename);
        RAISE NOTICE 'Dropped policy: % on %.%', policy_rec.policyname, policy_rec.schemaname, policy_rec.tablename;
    END LOOP;
END $$;

-- =====================================================
-- PART 9: DROP ALL AGGREGATES
-- =====================================================

DO $$
DECLARE
    agg_rec RECORD;
BEGIN
    FOR agg_rec IN
        SELECT n.nspname as schema_name, p.proname as agg_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
        WHERE n.nspname = 'public'
        AND p.prokind = 'a'  -- aggregates
        AND d.objid IS NULL  -- Skip aggregates that belong to extensions
    LOOP
        EXECUTE format('DROP AGGREGATE IF EXISTS %I.%I CASCADE', agg_rec.schema_name, agg_rec.agg_name);
        RAISE NOTICE 'Dropped aggregate: %.%', agg_rec.schema_name, agg_rec.agg_name;
    END LOOP;
END $$;

-- =====================================================
-- PART 10: DROP ALL DOMAINS
-- =====================================================

DO $$
DECLARE
    domain_rec RECORD;
BEGIN
    FOR domain_rec IN
        SELECT domain_schema, domain_name
        FROM information_schema.domains
        WHERE domain_schema = 'public'
    LOOP
        EXECUTE format('DROP DOMAIN IF EXISTS %I.%I CASCADE', domain_rec.domain_schema, domain_rec.domain_name);
        RAISE NOTICE 'Dropped domain: %.%', domain_rec.domain_schema, domain_rec.domain_name;
    END LOOP;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT
    '✅ COMPLETE RESET FINISHED' as status,
    'Database is now completely clean' as message;

-- Count remaining objects
SELECT 'Tables remaining' as object_type, COUNT(*)::text as count
FROM pg_tables
WHERE schemaname = 'public';

SELECT 'Views remaining' as object_type, COUNT(*)::text as count
FROM pg_views
WHERE schemaname = 'public';

SELECT 'Functions remaining' as object_type, COUNT(*)::text as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

SELECT 'Types remaining' as object_type, COUNT(*)::text as count
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
AND t.typtype IN ('e', 'c')
AND t.typname NOT LIKE 'pg_%';

SELECT
    '🎯 READY FOR FRESH SCHEMA' as status,
    'You can now run COMPLETE_DATABASE_SCHEMA.sql' as next_step;

COMMIT;
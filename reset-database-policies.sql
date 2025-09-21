-- Reset all RLS policies for the IV RELIFE database
-- Run this in your Supabase SQL Editor to reset policies before reapplying the setup

-- Drop all policies (only if tables exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    DROP POLICY IF EXISTS "Users can view own data" ON public.users;
    DROP POLICY IF EXISTS "Users can update own data" ON public.users;
    DROP POLICY IF EXISTS "Owners and backoffice can view all users" ON public.users;
    DROP POLICY IF EXISTS "Owners and backoffice can manage users" ON public.users;
    DROP POLICY IF EXISTS "Allow user creation" ON public.users;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invite_tokens') THEN
    DROP POLICY IF EXISTS "Owners and backoffice can manage invites" ON public.invite_tokens;
    DROP POLICY IF EXISTS "Users can view own invites" ON public.invite_tokens;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'retailers') THEN
    DROP POLICY IF EXISTS "retailers_owner_full" ON public.retailers;
    DROP POLICY IF EXISTS "retailers_backoffice_full" ON public.retailers;
    DROP POLICY IF EXISTS "retailers_retailer_view" ON public.retailers;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    DROP POLICY IF EXISTS "locations_owner_full" ON public.locations;
    DROP POLICY IF EXISTS "locations_backoffice_full" ON public.locations;
    DROP POLICY IF EXISTS "locations_retailer_manage" ON public.locations;
    DROP POLICY IF EXISTS "locations_location_view" ON public.locations;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    DROP POLICY IF EXISTS "customers_owner_full" ON public.customers;
    DROP POLICY IF EXISTS "customers_backoffice_retailer" ON public.customers;
    DROP POLICY IF EXISTS "customers_retailer" ON public.customers;
    DROP POLICY IF EXISTS "customers_location" ON public.customers;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_contacts') THEN
    DROP POLICY IF EXISTS "customer_contacts_parent_scope" ON public.customer_contacts;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_addresses') THEN
    DROP POLICY IF EXISTS "customer_addresses_parent_scope" ON public.customer_addresses;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_documents') THEN
    DROP POLICY IF EXISTS "customer_documents_scope" ON public.customer_documents;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_activity') THEN
    DROP POLICY IF EXISTS "customer_activity_read_scope" ON public.customer_activity;
    DROP POLICY IF EXISTS "customer_activity_insert_service" ON public.customer_activity;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_merge_requests') THEN
    DROP POLICY IF EXISTS "merge_requests_create" ON public.customer_merge_requests;
    DROP POLICY IF EXISTS "merge_requests_read" ON public.customer_merge_requests;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    DROP POLICY IF EXISTS "products_owner_full" ON public.products;
    DROP POLICY IF EXISTS "products_backoffice_full" ON public.products;
    DROP POLICY IF EXISTS "products_retailer_manage" ON public.products;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
    DROP POLICY IF EXISTS "product_variants_owner_full" ON public.product_variants;
    DROP POLICY IF EXISTS "product_variants_backoffice_full" ON public.product_variants;
    DROP POLICY IF EXISTS "product_variants_retailer_manage" ON public.product_variants;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    DROP POLICY IF EXISTS "orders_owner_full" ON public.orders;
    DROP POLICY IF EXISTS "orders_backoffice_full" ON public.orders;
    DROP POLICY IF EXISTS "orders_retailer_manage" ON public.orders;
    DROP POLICY IF EXISTS "orders_location_manage" ON public.orders;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    DROP POLICY IF EXISTS "order_items_owner_full" ON public.order_items;
    DROP POLICY IF EXISTS "order_items_backoffice_full" ON public.order_items;
    DROP POLICY IF EXISTS "order_items_retailer_manage" ON public.order_items;
    DROP POLICY IF EXISTS "order_items_location_manage" ON public.order_items;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipping_providers') THEN
    DROP POLICY IF EXISTS "shipping_providers_owner_full" ON public.shipping_providers;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipping_methods') THEN
    DROP POLICY IF EXISTS "shipping_methods_owner_full" ON public.shipping_methods;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipping_quotes') THEN
    DROP POLICY IF EXISTS "shipping_quotes_backoffice_full" ON public.shipping_quotes;
    DROP POLICY IF EXISTS "shipping_quotes_retailer_location" ON public.shipping_quotes;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fulfillments') THEN
    DROP POLICY IF EXISTS "fulfillments_backoffice_full" ON public.fulfillments;
    DROP POLICY IF EXISTS "fulfillments_retailer_location" ON public.fulfillments;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'claims') THEN
    DROP POLICY IF EXISTS "claims_owner_full" ON public.claims;
    DROP POLICY IF EXISTS "claims_backoffice_full" ON public.claims;
    DROP POLICY IF EXISTS "claims_retailer_manage" ON public.claims;
    DROP POLICY IF EXISTS "claims_location_manage" ON public.claims;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    DROP POLICY IF EXISTS "audit_logs_user_view" ON public.audit_logs;
    DROP POLICY IF EXISTS "audit_logs_admin_view" ON public.audit_logs;
    DROP POLICY IF EXISTS "audit_logs_system_insert" ON public.audit_logs;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'outbox') THEN
    DROP POLICY IF EXISTS "outbox_service_manage" ON public.outbox;
    DROP POLICY IF EXISTS "outbox_owner_view" ON public.outbox;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'file_metadata') THEN
    DROP POLICY IF EXISTS "file_metadata_owner_full" ON public.file_metadata;
    DROP POLICY IF EXISTS "file_metadata_user_view" ON public.file_metadata;
    DROP POLICY IF EXISTS "file_metadata_retailer_view" ON public.file_metadata;
    DROP POLICY IF EXISTS "file_metadata_location_view" ON public.file_metadata;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_features') THEN
    DROP POLICY IF EXISTS "user_features_self_manage" ON public.user_features;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_notifications') THEN
    DROP POLICY IF EXISTS "user_notifications_self_manage" ON public.user_notifications;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
    DROP POLICY IF EXISTS "system_settings_admin_manage" ON public.system_settings;
  END IF;
  
  RAISE NOTICE 'All existing policies dropped';
END $$;

-- Disable and re-enable RLS on all tables (only if tables exist)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invite_tokens') THEN
    ALTER TABLE public.invite_tokens DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'retailers') THEN
    ALTER TABLE public.retailers DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_contacts') THEN
    ALTER TABLE public.customer_contacts DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_addresses') THEN
    ALTER TABLE public.customer_addresses DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_documents') THEN
    ALTER TABLE public.customer_documents DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_activity') THEN
    ALTER TABLE public.customer_activity DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.customer_activity ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_merge_requests') THEN
    ALTER TABLE public.customer_merge_requests DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.customer_merge_requests ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_categories') THEN
    ALTER TABLE public.product_categories DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
    ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipping_providers') THEN
    ALTER TABLE public.shipping_providers DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.shipping_providers ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipping_methods') THEN
    ALTER TABLE public.shipping_methods DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipping_quotes') THEN
    ALTER TABLE public.shipping_quotes DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.shipping_quotes ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fulfillments') THEN
    ALTER TABLE public.fulfillments DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.fulfillments ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'claims') THEN
    ALTER TABLE public.claims DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'outbox') THEN
    ALTER TABLE public.outbox DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.outbox ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'file_metadata') THEN
    ALTER TABLE public.file_metadata DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_features') THEN
    ALTER TABLE public.user_features DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_features ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_notifications') THEN
    ALTER TABLE public.user_notifications DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
    ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  RAISE NOTICE 'RLS reset on all existing tables';
END $$;
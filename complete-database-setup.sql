-- IV RELIFE Complete Database Setup Script
-- This script creates all necessary tables, indexes, RLS policies, and initial data for the IV RELIFE system
-- Run this in your Supabase SQL Editor to set up the complete database

-- === Extensions ===
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- === Core Authentication Tables (Supabase Auth managed) ===
-- Note: The auth.users table is managed by Supabase Authentication
-- We only create application-specific user data tables

-- === Application Users Table ===
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role text CHECK (role IN ('owner','backoffice','retailer','location_user')) NOT NULL DEFAULT 'location_user',
  retailer_id uuid,
  location_id uuid,
  password_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === Invite Tokens ===
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  role text CHECK (role IN ('owner','backoffice','retailer','location_user')) NOT NULL,
  retailer_id uuid,
  location_id uuid,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

-- === Retailers ===
CREATE TABLE IF NOT EXISTS public.retailers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  status text CHECK (status IN ('active','inactive','suspended')) DEFAULT 'active',
  contract_url text,
  created_at timestamptz DEFAULT now()
);

-- === Locations ===
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid REFERENCES public.retailers(id) ON DELETE CASCADE,
  name text NOT NULL,
  address jsonb,
  phone text,
  timezone text,
  created_at timestamptz DEFAULT now()
);

-- === Customers Core ===
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NULL,
  primary_location_id uuid NULL,
  name text NOT NULL,
  email text,
  phone text,
  default_address jsonb,
  notes text,
  external_ids jsonb,
  created_by uuid NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === Customer Contacts ===
CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type text NOT NULL,
  value text NOT NULL,
  label text,
  verified boolean DEFAULT FALSE,
  created_at timestamptz DEFAULT now()
);

-- === Customer Addresses ===
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  address jsonb NOT NULL,
  label text,
  "primary" boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- === Customer Documents ===
CREATE TABLE IF NOT EXISTS public.customer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  retailer_id uuid NULL,
  location_id uuid NULL,
  bucket text NOT NULL,
  storage_path text NOT NULL,
  purpose text NOT NULL,
  content_type text,
  uploaded_by uuid NULL,
  metadata jsonb NULL,
  created_at timestamptz DEFAULT now()
);

-- === Customer Activity / Audit ===
CREATE TABLE IF NOT EXISTS public.customer_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NULL,
  actor_id uuid NULL,
  actor_role text NULL,
  action text NOT NULL,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- === Customer Merge Requests ===
CREATE TABLE IF NOT EXISTS public.customer_merge_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  duplicate_customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  proposed_merge_payload jsonb NOT NULL,
  requested_by uuid,
  requested_at timestamptz DEFAULT now(),
  approved boolean DEFAULT false,
  processed_at timestamptz NULL
);

-- === Product Categories ===
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NULL,
  name text NOT NULL,
  requires_ltl boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- === Products ===
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NULL,
  category_id uuid NULL REFERENCES public.product_categories(id),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- === Product Variants ===
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text UNIQUE NOT NULL,
  price numeric(10,2) NOT NULL,
  height_cm numeric(8,2),
  width_cm numeric(8,2),
  depth_cm numeric(8,2),
  weight_kg numeric(8,2),
  color text,
  ltl_flag boolean DEFAULT false,
  inventory_qty int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- === Orders ===
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL REFERENCES public.retailers(id),
  location_id uuid NOT NULL REFERENCES public.locations(id),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  created_by uuid NOT NULL REFERENCES public.users(id),
  status text CHECK (status IN ('draft','pending','processing','shipped','delivered','cancelled','returned','completed')) DEFAULT 'pending',
  total_amount numeric(10,2) NOT NULL,
  signature_url text,
  id_photo_url text,
  contract_url text,
  requires_ltl boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === Order Items ===
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_variant_id uuid NOT NULL REFERENCES public.product_variants(id),
  qty int NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- === Shipping Providers ===
CREATE TABLE IF NOT EXISTS public.shipping_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_identifier text,
  config jsonb,
  created_at timestamptz DEFAULT now()
);

-- === Shipping Methods ===
CREATE TABLE IF NOT EXISTS public.shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.shipping_providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  speed_estimate text,
  supports_ltl boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- === Shipping Quotes ===
CREATE TABLE IF NOT EXISTS public.shipping_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.shipping_providers(id),
  method_id uuid REFERENCES public.shipping_methods(id),
  order_id uuid,
  retailer_id uuid,
  location_id uuid,
  cost numeric,
  eta timestamptz,
  payload_json jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- === Fulfillments ===
CREATE TABLE IF NOT EXISTS public.fulfillments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  provider_id uuid REFERENCES public.shipping_providers(id),
  method_id uuid REFERENCES public.shipping_methods(id),
  tracking_number text,
  status text NOT NULL DEFAULT 'label_created',
  assigned_to uuid,
  retailer_id uuid,
  location_id uuid,
  last_status_raw jsonb,
  last_check timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === Claims ===
CREATE TABLE IF NOT EXISTS public.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid REFERENCES public.retailers(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id),
  order_id uuid REFERENCES public.orders(id),
  product_id uuid REFERENCES public.products(id),
  reason text NOT NULL,
  status text CHECK (status IN ('submitted','in_review','approved','rejected','resolved')) DEFAULT 'submitted',
  resolution_notes text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === Audit Logs ===
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  action text NOT NULL CHECK (action IN ('login','logout','password_reset','registration','invite_accepted','profile_update','role_change','create','update','delete')),
  entity text NOT NULL,
  entity_id text NOT NULL,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- === Outbox Events ===
CREATE TABLE IF NOT EXISTS public.outbox (
  id bigserial PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('welcome_email','password_reset_email','invite_email','notification')),
  entity text NOT NULL DEFAULT 'users',
  entity_id text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  retry_count int DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now()
);

-- === File Metadata ===
CREATE TABLE IF NOT EXISTS public.file_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_storage_path text NOT NULL,
  bucket text NOT NULL,
  uploaded_by uuid REFERENCES public.users(id),
  retailer_id uuid,
  location_id uuid,
  purpose text NOT NULL,
  content_type text,
  size_bytes int,
  created_at timestamptz DEFAULT now()
);

-- === User Features ===
CREATE TABLE IF NOT EXISTS public.user_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- === User Notifications ===
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text CHECK (type IN ('email','sms','push')) NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- === System Settings ===
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- === Indexes ===
-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_retailer_id ON public.users(retailer_id);
CREATE INDEX IF NOT EXISTS idx_users_location_id ON public.users(location_id);

-- Invite Tokens
CREATE INDEX IF NOT EXISTS idx_invite_tokens_email ON public.invite_tokens(email);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_expires_at ON public.invite_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_used_at ON public.invite_tokens(used_at);

-- Retailers
CREATE INDEX IF NOT EXISTS idx_retailers_name ON public.retailers(name);

-- Locations
CREATE INDEX IF NOT EXISTS idx_locations_retailer ON public.locations(retailer_id);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_retailer ON public.customers (retailer_id);
CREATE INDEX IF NOT EXISTS idx_customers_location ON public.customers (primary_location_id);

-- Customer Contacts
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer ON public.customer_contacts (customer_id);

-- Customer Addresses
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON public.customer_addresses (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_primary ON public.customer_addresses ("primary");

-- Customer Documents
CREATE INDEX IF NOT EXISTS idx_customer_documents_customer ON public.customer_documents (customer_id);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_retailer ON public.products (retailer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);

-- Product Variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants (sku);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_retailer ON public.orders (retailer_id);
CREATE INDEX IF NOT EXISTS idx_orders_location ON public.orders (location_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);

-- Shipping Quotes
CREATE INDEX IF NOT EXISTS idx_shipping_quotes_provider ON public.shipping_quotes (provider_id);
CREATE INDEX IF NOT EXISTS idx_shipping_quotes_retailer ON public.shipping_quotes (retailer_id);
CREATE INDEX IF NOT EXISTS idx_shipping_quotes_location ON public.shipping_quotes (location_id);
CREATE INDEX IF NOT EXISTS idx_shipping_quotes_expires ON public.shipping_quotes (expires_at);

-- Fulfillments
CREATE INDEX IF NOT EXISTS idx_fulfillments_provider ON public.fulfillments (provider_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_retailer ON public.fulfillments (retailer_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_location ON public.fulfillments (location_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_status ON public.fulfillments (status);

-- Claims
CREATE INDEX IF NOT EXISTS idx_claims_retailer ON public.claims (retailer_id);
CREATE INDEX IF NOT EXISTS idx_claims_location ON public.claims (location_id);
CREATE INDEX IF NOT EXISTS idx_claims_order ON public.claims (order_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.claims (status);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Outbox
CREATE INDEX IF NOT EXISTS idx_outbox_processed_at ON public.outbox(processed_at);
CREATE INDEX IF NOT EXISTS idx_outbox_event_type ON public.outbox(event_type);
CREATE INDEX IF NOT EXISTS idx_outbox_created_at ON public.outbox(created_at);

-- File Metadata
CREATE INDEX IF NOT EXISTS idx_file_metadata_bucket ON public.file_metadata(bucket);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploaded_by ON public.file_metadata(uploaded_by);

-- User Features
CREATE INDEX IF NOT EXISTS idx_user_features_user ON public.user_features (user_id);

-- User Notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications (user_id);

-- System Settings
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings (key);

-- === Enable Row Level Security (RLS) ===
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_merge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- === RLS Policies ===

-- === Users Policies ===
-- Users can view their own data
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Owners and backoffice can view all users
DROP POLICY IF EXISTS "Owners and backoffice can view all users" ON public.users;
CREATE POLICY "Owners and backoffice can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'backoffice')
    )
  );

-- Owners and backoffice can manage users
DROP POLICY IF EXISTS "Owners and backoffice can manage users" ON public.users;
CREATE POLICY "Owners and backoffice can manage users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'backoffice')
    )
  );

-- Allow INSERT for new user creation (migration)
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (true);

-- === Invite Tokens Policies ===
-- Only owners and backoffice can manage invite tokens
DROP POLICY IF EXISTS "Owners and backoffice can manage invites" ON public.invite_tokens;
CREATE POLICY "Owners and backoffice can manage invites" ON public.invite_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'backoffice')
    )
  );

-- Anyone can view their own invite (for validation)
DROP POLICY IF EXISTS "Users can view own invites" ON public.invite_tokens;
CREATE POLICY "Users can view own invites" ON public.invite_tokens
  FOR SELECT USING (
    email = (
      SELECT email FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- === Retailers Policies ===
-- Owners: full access to all retailers
DROP POLICY IF EXISTS "retailers_owner_full" ON public.retailers;
CREATE POLICY "retailers_owner_full" ON public.retailers
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

-- Backoffice: read/write access for all retailers
DROP POLICY IF EXISTS "retailers_backoffice_full" ON public.retailers;
CREATE POLICY "retailers_backoffice_full" ON public.retailers
  FOR ALL USING ((auth.jwt() ->> 'role') = 'backoffice');

-- Retailers: view their own retailer record
DROP POLICY IF EXISTS "retailers_retailer_view" ON public.retailers;
CREATE POLICY "retailers_retailer_view" ON public.retailers
  FOR SELECT USING (
    id = (SELECT retailer_id FROM public.users WHERE id = auth.uid())
  );

-- === Locations Policies ===
-- Owners: full access to all locations
DROP POLICY IF EXISTS "locations_owner_full" ON public.locations;
CREATE POLICY "locations_owner_full" ON public.locations
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

-- Backoffice: read/write access for all locations
DROP POLICY IF EXISTS "locations_backoffice_full" ON public.locations;
CREATE POLICY "locations_backoffice_full" ON public.locations
  FOR ALL USING ((auth.jwt() ->> 'role') = 'backoffice');

-- Retailers: manage locations for their retailer
DROP POLICY IF EXISTS "locations_retailer_manage" ON public.locations;
CREATE POLICY "locations_retailer_manage" ON public.locations
  FOR ALL USING (
    retailer_id = (SELECT retailer_id FROM public.users WHERE id = auth.uid())
  );

-- Location users: view their own location
DROP POLICY IF EXISTS "locations_location_view" ON public.locations;
CREATE POLICY "locations_location_view" ON public.locations
  FOR SELECT USING (
    id = (SELECT location_id FROM public.users WHERE id = auth.uid())
  );

-- === Customers Policies ===
-- Owners: full access to all customer data
DROP POLICY IF EXISTS "customers_owner_full" ON public.customers;
CREATE POLICY "customers_owner_full" ON public.customers
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

-- Backoffice: read/write access for matching retailer only
DROP POLICY IF EXISTS "customers_backoffice_retailer" ON public.customers;
CREATE POLICY "customers_backoffice_retailer" ON public.customers
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'backoffice' AND (auth.jwt() ->> 'retailer_id')::uuid = retailer_id)
    OR ((auth.jwt() ->> 'role') = 'owner')
  );

-- Retailer admins: manage their own retailer's customers
DROP POLICY IF EXISTS "customers_retailer" ON public.customers;
CREATE POLICY "customers_retailer" ON public.customers
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'retailer' AND (auth.jwt() ->> 'retailer_id')::uuid = retailer_id)
    OR ((auth.jwt() ->> 'role') = 'owner')
  );

-- Location users: only read/create customers for their location (if linked)
DROP POLICY IF EXISTS "customers_location" ON public.customers;
CREATE POLICY "customers_location" ON public.customers
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'location' AND (auth.jwt() ->> 'location_id')::uuid = primary_location_id)
    OR ((auth.jwt() ->> 'role') = 'owner')
  );

-- Contacts & Addresses use the same scoping as their parent customer.
DROP POLICY IF EXISTS "customer_contacts_parent_scope" ON public.customer_contacts;
CREATE POLICY "customer_contacts_parent_scope" ON public.customer_contacts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_contacts.customer_id AND (
      ((auth.jwt() ->> 'role') = 'owner')
      OR ((auth.jwt() ->> 'retailer_id')::uuid = customers.retailer_id AND (auth.jwt() ->> 'role') IN ('backoffice','retailer'))
      OR ((auth.jwt() ->> 'location_id')::uuid = customers.primary_location_id AND (auth.jwt() ->> 'role') = 'location')
    ))
  );

DROP POLICY IF EXISTS "customer_addresses_parent_scope" ON public.customer_addresses;
CREATE POLICY "customer_addresses_parent_scope" ON public.customer_addresses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_addresses.customer_id AND (
      ((auth.jwt() ->> 'role') = 'owner')
      OR ((auth.jwt() ->> 'retailer_id')::uuid = customers.retailer_id AND (auth.jwt() ->> 'role') IN ('backoffice','retailer'))
      OR ((auth.jwt() ->> 'location_id')::uuid = customers.primary_location_id AND (auth.jwt() ->> 'role') = 'location')
    ))
  );

-- Documents: allow upload/read by same scope (owner/backoffice/retailer/location)
DROP POLICY IF EXISTS "customer_documents_scope" ON public.customer_documents;
CREATE POLICY "customer_documents_scope" ON public.customer_documents
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'owner')
    OR ((auth.jwt() ->> 'retailer_id')::uuid = retailer_id AND (auth.jwt() ->> 'role') IN ('backoffice','retailer'))
    OR ((auth.jwt() ->> 'location_id')::uuid = location_id AND (auth.jwt() ->> 'role') = 'location')
  );

-- Activity (read) similar to customers; inserts should be allowed by server-side or service role only for integrity.
DROP POLICY IF EXISTS "customer_activity_read_scope" ON public.customer_activity;
CREATE POLICY "customer_activity_read_scope" ON public.customer_activity
  FOR SELECT USING (
    ((auth.jwt() ->> 'role') = 'owner')
    OR (EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_activity.customer_id AND (auth.jwt() ->> 'retailer_id')::uuid = customers.retailer_id))
  );

DROP POLICY IF EXISTS "customer_activity_insert_service" ON public.customer_activity;
CREATE POLICY "customer_activity_insert_service" ON public.customer_activity
  FOR INSERT WITH CHECK (true); -- prefer inserts via Edge / Service role; consider limiting in production

-- Merge requests: retailer/backoffice can create; only owner can approve final merge if desired
DROP POLICY IF EXISTS "merge_requests_create" ON public.customer_merge_requests;
CREATE POLICY "merge_requests_create" ON public.customer_merge_requests
  FOR INSERT WITH CHECK (
    ((auth.jwt() ->> 'role') IN ('backoffice','retailer') AND (auth.jwt() ->> 'retailer_id')::uuid = (SELECT retailer_id FROM public.customers WHERE id = primary_customer_id LIMIT 1))
    OR ((auth.jwt() ->> 'role') = 'owner')
  );

DROP POLICY IF EXISTS "merge_requests_read" ON public.customer_merge_requests;
CREATE POLICY "merge_requests_read" ON public.customer_merge_requests
  FOR SELECT USING (
    ((auth.jwt() ->> 'role') = 'owner')
    OR ((auth.jwt() ->> 'retailer_id')::uuid = (SELECT retailer_id FROM public.customers WHERE id = primary_customer_id LIMIT 1))
  );

-- === Products Policies ===
-- Owners: full access to all products
DROP POLICY IF EXISTS "products_owner_full" ON public.products;
CREATE POLICY "products_owner_full" ON public.products
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

-- Backoffice: read/write access for all products
DROP POLICY IF EXISTS "products_backoffice_full" ON public.products;
CREATE POLICY "products_backoffice_full" ON public.products
  FOR ALL USING ((auth.jwt() ->> 'role') = 'backoffice');

-- Retailers: manage products for their retailer
DROP POLICY IF EXISTS "products_retailer_manage" ON public.products;
CREATE POLICY "products_retailer_manage" ON public.products
  FOR ALL USING (
    retailer_id = (SELECT retailer_id FROM public.users WHERE id = auth.uid())
  );

-- === Product Variants Policies ===
-- Owners: full access to all product variants
DROP POLICY IF EXISTS "product_variants_owner_full" ON public.product_variants;
CREATE POLICY "product_variants_owner_full" ON public.product_variants
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

-- Backoffice: read/write access for all product variants
DROP POLICY IF EXISTS "product_variants_backoffice_full" ON public.product_variants;
CREATE POLICY "product_variants_backoffice_full" ON public.product_variants
  FOR ALL USING ((auth.jwt() ->> 'role') = 'backoffice');

-- Retailers: manage product variants for their retailer's products
DROP POLICY IF EXISTS "product_variants_retailer_manage" ON public.product_variants;
CREATE POLICY "product_variants_retailer_manage" ON public.product_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_variants.product_id 
      AND products.retailer_id = (SELECT retailer_id FROM public.users WHERE id = auth.uid())
    )
  );

-- === Orders Policies ===
-- Owners: full access to all orders
DROP POLICY IF EXISTS "orders_owner_full" ON public.orders;
CREATE POLICY "orders_owner_full" ON public.orders
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

-- Backoffice: read/write access for all orders
DROP POLICY IF EXISTS "orders_backoffice_full" ON public.orders;
CREATE POLICY "orders_backoffice_full" ON public.orders
  FOR ALL USING ((auth.jwt() ->> 'role') = 'backoffice');

-- Retailers: manage orders for their retailer
DROP POLICY IF EXISTS "orders_retailer_manage" ON public.orders;
CREATE POLICY "orders_retailer_manage" ON public.orders
  FOR ALL USING (
    retailer_id = (SELECT retailer_id FROM public.users WHERE id = auth.uid())
  );

-- Location users: manage orders for their location
DROP POLICY IF EXISTS "orders_location_manage" ON public.orders;
CREATE POLICY "orders_location_manage" ON public.orders
  FOR ALL USING (
    location_id = (SELECT location_id FROM public.users WHERE id = auth.uid())
  );

-- === Order Items Policies ===
-- Owners: full access to all order items
DROP POLICY IF EXISTS "order_items_owner_full" ON public.order_items;
CREATE POLICY "order_items_owner_full" ON public.order_items
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

-- Backoffice: read/write access for all order items
DROP POLICY IF EXISTS "order_items_backoffice_full" ON public.order_items;
CREATE POLICY "order_items_backoffice_full" ON public.order_items
  FOR ALL USING ((auth.jwt() ->> 'role') = 'backoffice');

-- Retailers: manage order items for their retailer's orders
DROP POLICY IF EXISTS "order_items_retailer_manage" ON public.order_items;
CREATE POLICY "order_items_retailer_manage" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.retailer_id = (SELECT retailer_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Location users: manage order items for their location's orders
DROP POLICY IF EXISTS "order_items_location_manage" ON public.order_items;
CREATE POLICY "order_items_location_manage" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.location_id = (SELECT location_id FROM public.users WHERE id = auth.uid())
    )
  );

-- === Shipping Policies ===
-- Only Owners can manage all providers/methods
DROP POLICY IF EXISTS "shipping_providers_owner_full" ON public.shipping_providers;
CREATE POLICY "shipping_providers_owner_full" ON public.shipping_providers
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

DROP POLICY IF EXISTS "shipping_methods_owner_full" ON public.shipping_methods;
CREATE POLICY "shipping_methods_owner_full" ON public.shipping_methods
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

-- Backoffice can view/manage quotes and fulfillments across all retailers
DROP POLICY IF EXISTS "shipping_quotes_backoffice_full" ON public.shipping_quotes;
CREATE POLICY "shipping_quotes_backoffice_full" ON public.shipping_quotes
  FOR ALL USING ((auth.jwt() ->> 'role') = 'backoffice');

DROP POLICY IF EXISTS "fulfillments_backoffice_full" ON public.fulfillments;
CREATE POLICY "fulfillments_backoffice_full" ON public.fulfillments
  FOR ALL USING ((auth.jwt() ->> 'role') = 'backoffice');

-- Retailers/Location Users can only view quotes/fulfillments tied to their retailer_id/location_id
DROP POLICY IF EXISTS "shipping_quotes_retailer_location" ON public.shipping_quotes;
CREATE POLICY "shipping_quotes_retailer_location" ON public.shipping_quotes
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'retailer' AND (auth.jwt() ->> 'retailer_id')::uuid = retailer_id)
    OR ((auth.jwt() ->> 'role') = 'location' AND (auth.jwt() ->> 'location_id')::uuid = location_id)
    OR ((auth.jwt() ->> 'role') = 'owner')
    OR ((auth.jwt() ->> 'role') = 'backoffice')
  );

DROP POLICY IF EXISTS "fulfillments_retailer_location" ON public.fulfillments;
CREATE POLICY "fulfillments_retailer_location" ON public.fulfillments
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'retailer' AND (auth.jwt() ->> 'retailer_id')::uuid = retailer_id)
    OR ((auth.jwt() ->> 'role') = 'location' AND (auth.jwt() ->> 'location_id')::uuid = location_id)
    OR ((auth.jwt() ->> 'role') = 'owner')
    OR ((auth.jwt() ->> 'role') = 'backoffice')
  );

-- === Claims Policies ===
-- Owners: full access to all claims
DROP POLICY IF EXISTS "claims_owner_full" ON public.claims;
CREATE POLICY "claims_owner_full" ON public.claims
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

-- Backoffice: read/write access for all claims
DROP POLICY IF EXISTS "claims_backoffice_full" ON public.claims;
CREATE POLICY "claims_backoffice_full" ON public.claims
  FOR ALL USING ((auth.jwt() ->> 'role') = 'backoffice');

-- Retailers: manage claims for their retailer
DROP POLICY IF EXISTS "claims_retailer_manage" ON public.claims;
CREATE POLICY "claims_retailer_manage" ON public.claims
  FOR ALL USING (
    retailer_id = (SELECT retailer_id FROM public.users WHERE id = auth.uid())
  );

-- Location users: manage claims for their location
DROP POLICY IF EXISTS "claims_location_manage" ON public.claims;
CREATE POLICY "claims_location_manage" ON public.claims
  FOR ALL USING (
    location_id = (SELECT location_id FROM public.users WHERE id = auth.uid())
  );

-- === Audit Logs Policies ===
-- Users can view their own audit logs
DROP POLICY IF EXISTS "audit_logs_user_view" ON public.audit_logs;
CREATE POLICY "audit_logs_user_view" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Owners and backoffice can view all audit logs
DROP POLICY IF EXISTS "audit_logs_admin_view" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_view" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'backoffice')
    )
  );

-- System can insert audit logs (allow all inserts)
DROP POLICY IF EXISTS "audit_logs_system_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_system_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- === Outbox Policies ===
-- System/service role can manage outbox events
DROP POLICY IF EXISTS "outbox_service_manage" ON public.outbox;
CREATE POLICY "outbox_service_manage" ON public.outbox
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

-- Owners can view outbox events
DROP POLICY IF EXISTS "outbox_owner_view" ON public.outbox;
CREATE POLICY "outbox_owner_view" ON public.outbox
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'owner'
    )
  );

-- === File Metadata Policies ===
-- Owners: full access to all file metadata
DROP POLICY IF EXISTS "file_metadata_owner_full" ON public.file_metadata;
CREATE POLICY "file_metadata_owner_full" ON public.file_metadata
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

-- Users can view their own uploaded files
DROP POLICY IF EXISTS "file_metadata_user_view" ON public.file_metadata;
CREATE POLICY "file_metadata_user_view" ON public.file_metadata
  FOR SELECT USING (uploaded_by = auth.uid());

-- Retailers can view files for their retailer
DROP POLICY IF EXISTS "file_metadata_retailer_view" ON public.file_metadata;
CREATE POLICY "file_metadata_retailer_view" ON public.file_metadata
  FOR SELECT USING (
    retailer_id = (SELECT retailer_id FROM public.users WHERE id = auth.uid())
  );

-- Location users can view files for their location
DROP POLICY IF EXISTS "file_metadata_location_view" ON public.file_metadata;
CREATE POLICY "file_metadata_location_view" ON public.file_metadata
  FOR SELECT USING (
    location_id = (SELECT location_id FROM public.users WHERE id = auth.uid())
  );

-- === User Features Policies ===
-- Users can manage their own features
DROP POLICY IF EXISTS "user_features_self_manage" ON public.user_features;
CREATE POLICY "user_features_self_manage" ON public.user_features
  FOR ALL USING (user_id = auth.uid());

-- === User Notifications Policies ===
-- Users can manage their own notifications
DROP POLICY IF EXISTS "user_notifications_self_manage" ON public.user_notifications;
CREATE POLICY "user_notifications_self_manage" ON public.user_notifications
  FOR ALL USING (user_id = auth.uid());

-- === System Settings Policies ===
-- Only owners and backoffice can manage system settings
DROP POLICY IF EXISTS "system_settings_admin_manage" ON public.system_settings;
CREATE POLICY "system_settings_admin_manage" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'backoffice')
    )
  );

-- === Triggers ===
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at column
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON public.customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fulfillments_updated_at ON public.fulfillments;
CREATE TRIGGER update_fulfillments_updated_at 
    BEFORE UPDATE ON public.fulfillments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claims_updated_at ON public.claims;
CREATE TRIGGER update_claims_updated_at 
    BEFORE UPDATE ON public.claims 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- === Initial Data Setup ===
-- Insert your existing admin user (update email as needed)
-- First, let's see what auth users exist
DO $$
DECLARE
    auth_user_id uuid;
    user_email text := 'admin@iv-relife.com'; -- Update this to your actual email
BEGIN
    -- Get the auth user ID for the email
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    -- Only insert if we found the auth user
    IF auth_user_id IS NOT NULL THEN
        INSERT INTO public.users (id, email, name, role, created_at) 
        VALUES (
            auth_user_id,
            user_email,
            'System Administrator',
            'owner',
            now()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            updated_at = now();
        
        RAISE NOTICE 'User created/updated for email: %', user_email;
    ELSE
        RAISE NOTICE 'No auth user found for email: %. Please check the email address.', user_email;
    END IF;
END $$;

-- Add sample data for testing (optional)
-- Uncomment the following section if you want to add sample data

/*
-- Sample Retailer
INSERT INTO public.retailers (name, email, phone) VALUES 
('Sample Retailer', 'retailer@example.com', '+1234567890')
ON CONFLICT DO NOTHING;

-- Sample Location
INSERT INTO public.locations (retailer_id, name, phone, timezone) 
SELECT id, 'Main Location', '+1234567891', 'America/New_York' 
FROM public.retailers 
WHERE name = 'Sample Retailer'
ON CONFLICT DO NOTHING;

-- Sample Product Category
INSERT INTO public.product_categories (name, requires_ltl) VALUES 
('Electronics', false)
ON CONFLICT DO NOTHING;

-- Sample Product
INSERT INTO public.products (retailer_id, category_id, name, description) 
SELECT r.id, pc.id, 'Sample Product', 'This is a sample product for testing'
FROM public.retailers r, public.product_categories pc
WHERE r.name = 'Sample Retailer' AND pc.name = 'Electronics'
ON CONFLICT DO NOTHING;

-- Sample Product Variant
INSERT INTO public.product_variants (product_id, sku, price, inventory_qty) 
SELECT p.id, 'SMPL-001', 99.99, 100
FROM public.products p
WHERE p.name = 'Sample Product'
ON CONFLICT DO NOTHING;
*/

-- === Comments ===
COMMENT ON TABLE public.users IS 'Application users with roles and permissions';
COMMENT ON TABLE public.invite_tokens IS 'Invitation tokens for user registration';
COMMENT ON TABLE public.retailers IS 'Retailer entities in the system';
COMMENT ON TABLE public.locations IS 'Retailer locations';
COMMENT ON TABLE public.customers IS 'Customer information';
COMMENT ON TABLE public.customer_contacts IS 'Customer contact information (emails, phones)';
COMMENT ON TABLE public.customer_addresses IS 'Customer addresses';
COMMENT ON TABLE public.customer_documents IS 'Customer documents (IDs, signatures, contracts)';
COMMENT ON TABLE public.customer_activity IS 'Immutable customer activity log';
COMMENT ON TABLE public.customer_merge_requests IS 'Customer merge requests for deduplication';
COMMENT ON TABLE public.product_categories IS 'Product categories';
COMMENT ON TABLE public.products IS 'Product information';
COMMENT ON TABLE public.product_variants IS 'Product variants with SKU, pricing, inventory';
COMMENT ON TABLE public.orders IS 'Customer orders';
COMMENT ON TABLE public.order_items IS 'Items in customer orders';
COMMENT ON TABLE public.shipping_providers IS 'Shipping providers';
COMMENT ON TABLE public.shipping_methods IS 'Shipping methods offered by providers';
COMMENT ON TABLE public.shipping_quotes IS 'Shipping quotes for orders';
COMMENT ON TABLE public.fulfillments IS 'Order fulfillments and tracking';
COMMENT ON TABLE public.claims IS 'Customer claims and returns';
COMMENT ON TABLE public.audit_logs IS 'Audit trail for all user actions';
COMMENT ON TABLE public.outbox IS 'Outbox pattern for async event processing';
COMMENT ON TABLE public.file_metadata IS 'Metadata for uploaded files';
COMMENT ON TABLE public.user_features IS 'User feature toggles';
COMMENT ON TABLE public.user_notifications IS 'User notification preferences';
COMMENT ON TABLE public.system_settings IS 'System-wide configuration settings';

-- === Security Notes ===
-- 1. This script assumes you have Supabase set up with authentication
-- 2. Make sure to update the admin email in the initial data section
-- 3. Review and adjust RLS policies based on your specific business requirements
-- 4. Consider adding additional constraints and validation as needed
-- 5. For production, review and tighten the outbox and audit log policies
-- 6. Ensure your JWT tokens include the required claims (role, retailer_id, location_id)
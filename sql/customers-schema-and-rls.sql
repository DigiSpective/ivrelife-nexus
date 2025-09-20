-- === Extensions ===
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- === Customers Core ===
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NULL,        -- which retailer this customer primarily belongs to (nullable for global customers)
  primary_location_id uuid NULL, -- optional location association
  name text NOT NULL,
  email text,
  phone text,
  default_address jsonb,
  notes text,
  external_ids jsonb,           -- map to POS / external systems
  created_by uuid NULL,         -- auth.uid()
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- === Customer Contacts (multiple phones/emails) ===
CREATE TABLE public.customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type text NOT NULL,           -- 'email' | 'phone' | 'other'
  value text NOT NULL,
  label text,
  verified boolean DEFAULT FALSE,
  created_at timestamptz DEFAULT now()
);

-- === Customer Addresses (multiple) ===
CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  address jsonb NOT NULL,
  label text,
  primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- === Customer Documents (ID photos, signatures, contracts) ===
CREATE TABLE public.customer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  retailer_id uuid NULL,
  location_id uuid NULL,
  bucket text NOT NULL,
  storage_path text NOT NULL,
  purpose text NOT NULL,        -- 'id_photo','signature','contract','other'
  content_type text,
  uploaded_by uuid NULL,
  metadata jsonb NULL,
  created_at timestamptz DEFAULT now()
);

-- === Customer Activity / Audit (immutable events) ===
CREATE TABLE public.customer_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NULL,
  actor_id uuid NULL,
  actor_role text NULL,
  action text NOT NULL,        -- 'created','updated','id_uploaded','signature_uploaded','merged','imported', etc.
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- === Customer Merge Requests (for review) ===
CREATE TABLE public.customer_merge_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  duplicate_customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  proposed_merge_payload jsonb NOT NULL, -- merged fields preview
  requested_by uuid,
  requested_at timestamptz DEFAULT now(),
  approved boolean DEFAULT false,
  processed_at timestamptz NULL
);

-- === Indexes ===
CREATE INDEX idx_customers_retailer ON public.customers (retailer_id);
CREATE INDEX idx_customer_contacts_customer ON public.customer_contacts (customer_id);
CREATE INDEX idx_customer_addresses_customer ON public.customer_addresses (customer_id);
CREATE INDEX idx_customer_documents_customer ON public.customer_documents (customer_id);

-- === Enable RLS ===
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_merge_requests ENABLE ROW LEVEL SECURITY;

-- === RLS POLICIES ===
-- NOTE: These policies assume your JWT contains 'role', 'retailer_id', and 'location_id' claims.
-- If not, use user_roles mapping functions and auth.uid() lookups.

-- Owners: full access to all customer data
CREATE POLICY "customers_owner_full" ON public.customers
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

-- Backoffice: read/write access for matching retailer only
CREATE POLICY "customers_backoffice_retailer" ON public.customers
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'backoffice' AND (auth.jwt() ->> 'retailer_id')::uuid = retailer_id)
    OR ((auth.jwt() ->> 'role') = 'owner')
  );

-- Retailer admins: manage their own retailer's customers
CREATE POLICY "customers_retailer" ON public.customers
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'retailer' AND (auth.jwt() ->> 'retailer_id')::uuid = retailer_id)
    OR ((auth.jwt() ->> 'role') = 'owner')
  );

-- Location users: only read/create customers for their location (if linked)
CREATE POLICY "customers_location" ON public.customers
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'location' AND (auth.jwt() ->> 'location_id')::uuid = primary_location_id)
    OR ((auth.jwt() ->> 'role') = 'owner')
  );

-- Contacts & Addresses use the same scoping as their parent customer.
CREATE POLICY "customer_contacts_parent_scope" ON public.customer_contacts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_contacts.customer_id AND (
      ((auth.jwt() ->> 'role') = 'owner')
      OR ((auth.jwt() ->> 'retailer_id')::uuid = customers.retailer_id AND (auth.jwt() ->> 'role') IN ('backoffice','retailer'))
      OR ((auth.jwt() ->> 'location_id')::uuid = customers.primary_location_id AND (auth.jwt() ->> 'role') = 'location')
    ))
  );

CREATE POLICY "customer_addresses_parent_scope" ON public.customer_addresses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_addresses.customer_id AND (
      ((auth.jwt() ->> 'role') = 'owner')
      OR ((auth.jwt() ->> 'retailer_id')::uuid = customers.retailer_id AND (auth.jwt() ->> 'role') IN ('backoffice','retailer'))
      OR ((auth.jwt() ->> 'location_id')::uuid = customers.primary_location_id AND (auth.jwt() ->> 'role') = 'location')
    ))
  );

-- Documents: allow upload/read by same scope (owner/backoffice/retailer/location)
CREATE POLICY "customer_documents_scope" ON public.customer_documents
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'owner')
    OR ((auth.jwt() ->> 'retailer_id')::uuid = retailer_id AND (auth.jwt() ->> 'role') IN ('backoffice','retailer'))
    OR ((auth.jwt() ->> 'location_id')::uuid = location_id AND (auth.jwt() ->> 'role') = 'location')
  );

-- Activity (read) similar to customers; inserts should be allowed by server-side or service role only for integrity.
CREATE POLICY "customer_activity_read_scope" ON public.customer_activity
  FOR SELECT USING (
    ((auth.jwt() ->> 'role') = 'owner')
    OR (EXISTS (SELECT 1 FROM public.customers WHERE customers.id = customer_activity.customer_id AND (auth.jwt() ->> 'retailer_id')::uuid = customers.retailer_id))
  );

CREATE POLICY "customer_activity_insert_service" ON public.customer_activity
  FOR INSERT USING ( true ); -- prefer inserts via Edge / Service role; consider limiting in production

-- Merge requests: retailer/backoffice can create; only owner can approve final merge if desired
CREATE POLICY "merge_requests_create" ON public.customer_merge_requests
  FOR INSERT USING (
    ((auth.jwt() ->> 'role') IN ('backoffice','retailer') AND (auth.jwt() ->> 'retailer_id')::uuid = (SELECT retailer_id FROM public.customers WHERE id = primary_customer_id LIMIT 1))
    OR ((auth.jwt() ->> 'role') = 'owner')
  );

CREATE POLICY "merge_requests_read" ON public.customer_merge_requests
  FOR SELECT USING (
    ((auth.jwt() ->> 'role') = 'owner')
    OR ((auth.jwt() ->> 'retailer_id')::uuid = (SELECT retailer_id FROM public.customers WHERE id = primary_customer_id LIMIT 1))
  );

-- IMPORTANT: If your JWT does not have retailer_id/location_id, replace the expressions above
-- with lookups to user_roles table using auth.uid().
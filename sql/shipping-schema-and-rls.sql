-- === Shipping Schema ===

-- Shipping providers table
CREATE TABLE public.shipping_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_key text,
  created_at timestamptz DEFAULT now()
);

-- Shipping methods table
CREATE TABLE public.shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.shipping_providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  service_level text,
  ltl_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Shipping quotes table
CREATE TABLE public.shipping_quotes (
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

-- Fulfillments table
CREATE TABLE public.fulfillments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  provider_id uuid REFERENCES public.shipping_providers(id),
  method_id uuid REFERENCES public.shipping_methods(id),
  tracking_number text,
  status text NOT NULL DEFAULT 'label_created',
  assigned_to uuid,
  retailer_id uuid,
  location_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  actor_id uuid,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Outbox events table
CREATE TABLE public.outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- === Indexes ===
CREATE INDEX idx_shipping_quotes_provider ON public.shipping_quotes (provider_id);
CREATE INDEX idx_shipping_quotes_retailer ON public.shipping_quotes (retailer_id);
CREATE INDEX idx_shipping_quotes_location ON public.shipping_quotes (location_id);
CREATE INDEX idx_shipping_quotes_expires ON public.shipping_quotes (expires_at);
CREATE INDEX idx_fulfillments_provider ON public.fulfillments (provider_id);
CREATE INDEX idx_fulfillments_retailer ON public.fulfillments (retailer_id);
CREATE INDEX idx_fulfillments_location ON public.fulfillments (location_id);
CREATE INDEX idx_fulfillments_status ON public.fulfillments (status);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity, entity_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs (actor_id);
CREATE INDEX idx_outbox_events_processed ON public.outbox_events (processed_at);

-- === Enable RLS ===
ALTER TABLE public.shipping_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;

-- === RLS POLICIES ===

-- Only Owners can manage all providers/methods
CREATE POLICY "shipping_providers_owner_full" ON public.shipping_providers
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

CREATE POLICY "shipping_methods_owner_full" ON public.shipping_methods
  FOR ALL USING ((auth.jwt() ->> 'role') = 'owner');

-- Backoffice can view/manage quotes and fulfillments across all retailers
CREATE POLICY "shipping_quotes_backoffice_full" ON public.shipping_quotes
  FOR ALL USING ((auth.jwt() ->> 'role') = 'backoffice');

CREATE POLICY "fulfillments_backoffice_full" ON public.fulfillments
  FOR ALL USING ((auth.jwt() ->> 'role') = 'backoffice');

-- Retailers/Location Users can only view quotes/fulfillments tied to their retailer_id/location_id
CREATE POLICY "shipping_quotes_retailer_location" ON public.shipping_quotes
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'retailer' AND (auth.jwt() ->> 'retailer_id')::uuid = retailer_id)
    OR ((auth.jwt() ->> 'role') = 'location' AND (auth.jwt() ->> 'location_id')::uuid = location_id)
    OR ((auth.jwt() ->> 'role') = 'owner')
    OR ((auth.jwt() ->> 'role') = 'backoffice')
  );

CREATE POLICY "fulfillments_retailer_location" ON public.fulfillments
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'retailer' AND (auth.jwt() ->> 'retailer_id')::uuid = retailer_id)
    OR ((auth.jwt() ->> 'role') = 'location' AND (auth.jwt() ->> 'location_id')::uuid = location_id)
    OR ((auth.jwt() ->> 'role') = 'owner')
    OR ((auth.jwt() ->> 'role') = 'backoffice')
  );

-- Audit logs are viewable by Backoffice and Owners; retailers can only see their own
CREATE POLICY "audit_logs_owner_backoffice" ON public.audit_logs
  FOR ALL USING (
    ((auth.jwt() ->> 'role') = 'owner')
    OR ((auth.jwt() ->> 'role') = 'backoffice')
  );

-- Outbox events are only accessible by system processes (service role)
CREATE POLICY "outbox_events_service_only" ON public.outbox_events
  FOR ALL USING (false);

CREATE POLICY "outbox_events_insert_service" ON public.outbox_events
  FOR INSERT WITH CHECK (true);
-- === Claims Schema ===

-- Retailers
CREATE TABLE retailers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Locations
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid REFERENCES retailers(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('owner','backoffice','retailer','location_user')) NOT NULL,
  retailer_id uuid REFERENCES retailers(id),
  location_id uuid REFERENCES locations(id),
  created_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid REFERENCES retailers(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid REFERENCES retailers(id),
  location_id uuid REFERENCES locations(id),
  product_id uuid REFERENCES products(id),
  quantity int NOT NULL,
  status text CHECK (status IN ('pending','shipped','delivered','canceled')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Shipping
CREATE TABLE shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number text,
  carrier text,
  status text CHECK (status IN ('preparing','in_transit','delivered','returned')) DEFAULT 'preparing',
  label_url text,
  created_at timestamptz DEFAULT now()
);

-- Claims
CREATE TABLE claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid REFERENCES retailers(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id),
  order_id uuid REFERENCES orders(id),
  product_id uuid REFERENCES products(id),
  reason text NOT NULL,
  status text CHECK (status IN ('submitted','in_review','approved','rejected','resolved')) DEFAULT 'submitted',
  resolution_notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Outbox Events
CREATE TABLE outbox (
  id bigserial PRIMARY KEY,
  event_type text NOT NULL,
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz
);

-- === Indexes ===
CREATE INDEX idx_claims_retailer ON claims (retailer_id);
CREATE INDEX idx_claims_location ON claims (location_id);
CREATE INDEX idx_claims_order ON claims (order_id);
CREATE INDEX idx_claims_status ON claims (status);
CREATE INDEX idx_audit_logs_user ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity, entity_id);
CREATE INDEX idx_outbox_processed ON outbox (processed_at);

-- === Enable RLS ===
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox ENABLE ROW LEVEL SECURITY;

-- === RLS POLICIES ===

-- Retailers: Owners/Backoffice view all, Retailers view own.
CREATE POLICY retailer_owner_access ON retailers FOR SELECT USING (
  EXISTS(SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('owner','backoffice'))
) WITH CHECK (true);

-- Claims: Retailers and their locations see only their claims.
CREATE POLICY claim_access ON claims FOR ALL USING (
  retailer_id = (SELECT retailer_id FROM users WHERE id = auth.uid())
);

-- Users can view their own user record
CREATE POLICY user_self_access ON users FOR SELECT USING (id = auth.uid());

-- Audit logs: Only owners and backoffice can view
CREATE POLICY audit_log_access ON audit_logs FOR ALL USING (
  EXISTS(SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('owner','backoffice'))
);

-- Outbox: Only system processes can access
CREATE POLICY outbox_access ON outbox FOR ALL USING (false);
CREATE POLICY outbox_insert_access ON outbox FOR INSERT WITH CHECK (true);
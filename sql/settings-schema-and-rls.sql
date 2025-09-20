-- === Settings Schema ===

-- Users table (extended for settings)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role text CHECK (role IN ('owner','backoffice','retailer','location_user')) NOT NULL,
  retailer_id uuid REFERENCES retailers(id),
  location_id uuid REFERENCES locations(id),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Feature toggles (per user)
CREATE TABLE user_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Notification preferences
CREATE TABLE user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text CHECK (type IN ('email','sms','push')) NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- System-wide settings
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
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

-- Outbox events
CREATE TABLE outbox (
  id bigserial PRIMARY KEY,
  event_type text NOT NULL,
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz
);

-- === Indexes ===
CREATE INDEX idx_user_features_user ON user_features (user_id);
CREATE INDEX idx_user_notifications_user ON user_notifications (user_id);
CREATE INDEX idx_system_settings_key ON system_settings (key);
CREATE INDEX idx_audit_logs_user ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity, entity_id);
CREATE INDEX idx_outbox_processed ON outbox (processed_at);

-- === Enable RLS ===
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox ENABLE ROW LEVEL SECURITY;

-- === RLS POLICIES ===

-- Users can manage their own profile
CREATE POLICY user_self_manage ON users FOR ALL USING (id = auth.uid());

-- Owners and backoffice can manage system-wide settings
CREATE POLICY system_settings_owner ON system_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('owner','backoffice'))
);

-- Users can read/write their own features
CREATE POLICY features_user ON user_features FOR ALL USING (user_id = auth.uid());

-- Users can read/write their own notifications
CREATE POLICY notifications_user ON user_notifications FOR ALL USING (user_id = auth.uid());

-- Users can view their own audit logs
CREATE POLICY audit_logs_user ON audit_logs FOR SELECT USING (user_id = auth.uid());

-- Owners and backoffice can view all audit logs
CREATE POLICY audit_logs_admin ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('owner','backoffice'))
);

-- Outbox: Only system processes can access
CREATE POLICY outbox_access ON outbox FOR ALL USING (false);
CREATE POLICY outbox_insert_access ON outbox FOR INSERT WITH CHECK (true);
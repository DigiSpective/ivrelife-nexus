-- IV RELIFE Database Setup Script
-- Run this in your Supabase SQL Editor to create the necessary tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
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

-- Create invite tokens table
CREATE TABLE IF NOT EXISTS invite_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  role text CHECK (role IN ('owner','backoffice','retailer','location_user')) NOT NULL,
  retailer_id uuid,
  location_id uuid,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  action text NOT NULL CHECK (action IN ('login','logout','password_reset','registration','invite_accepted','profile_update','role_change','create','update','delete')),
  entity text NOT NULL,
  entity_id text NOT NULL,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create outbox table for async notifications
CREATE TABLE IF NOT EXISTS outbox (
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

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Owners and backoffice can view all users" ON users;
DROP POLICY IF EXISTS "Owners and backoffice can manage users" ON users;

DROP POLICY IF EXISTS "Owners and backoffice can manage invites" ON invite_tokens;
DROP POLICY IF EXISTS "Users can view own invites" ON invite_tokens;

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Owners and backoffice can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

DROP POLICY IF EXISTS "Service role can manage outbox" ON outbox;
DROP POLICY IF EXISTS "Owners can view outbox events" ON outbox;

-- RLS Policies for users table

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Owners and backoffice can view all users
CREATE POLICY "Owners and backoffice can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'backoffice')
    )
  );

-- Owners and backoffice can create and update users
CREATE POLICY "Owners and backoffice can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'backoffice')
    )
  );

-- Allow INSERT for new user creation (migration)
CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (true);

-- RLS Policies for invite_tokens table

-- Only owners and backoffice can manage invite tokens
CREATE POLICY "Owners and backoffice can manage invites" ON invite_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'backoffice')
    )
  );

-- Anyone can view their own invite (for validation)
CREATE POLICY "Users can view own invites" ON invite_tokens
  FOR SELECT USING (
    email = (
      SELECT email FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for audit_logs table

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Owners and backoffice can view all audit logs
CREATE POLICY "Owners and backoffice can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'backoffice')
    )
  );

-- System can insert audit logs (allow all inserts)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for outbox table

-- System/service role can manage outbox events
CREATE POLICY "Service role can manage outbox" ON outbox
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.role() = 'authenticated'
  );

-- Owners can view outbox events
CREATE POLICY "Owners can view outbox events" ON outbox
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'owner'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_retailer_id ON users(retailer_id);
CREATE INDEX IF NOT EXISTS idx_users_location_id ON users(location_id);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_email ON invite_tokens(email);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_expires_at ON invite_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_used_at ON invite_tokens(used_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_outbox_processed_at ON outbox(processed_at);
CREATE INDEX IF NOT EXISTS idx_outbox_event_type ON outbox(event_type);
CREATE INDEX IF NOT EXISTS idx_outbox_created_at ON outbox(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

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
        INSERT INTO users (id, email, name, role, created_at) 
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

-- Add more users here if needed
-- Just duplicate the DO block above and change the email

COMMENT ON TABLE users IS 'Application users with roles and permissions';
COMMENT ON TABLE invite_tokens IS 'Invitation tokens for user registration';
COMMENT ON TABLE audit_logs IS 'Audit trail for all user actions';
COMMENT ON TABLE outbox IS 'Outbox pattern for async event processing';
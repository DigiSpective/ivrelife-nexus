-- IV RELIFE Production Authentication Schema
-- Migration 001: Initialize secure authentication tables
-- Version: 1.0
-- Date: 2025-09-21

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =============================================================================
-- APPLICATION USERS TABLE
-- Synchronized with auth.users but contains application-specific data
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.app_users (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    role text NOT NULL CHECK (role IN ('owner', 'backoffice', 'retailer', 'location_user')),
    retailer_id uuid REFERENCES public.retailers(id),
    location_id uuid REFERENCES public.locations(id),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    first_name text,
    last_name text,
    phone text,
    timezone text DEFAULT 'UTC',
    locale text DEFAULT 'en-US',
    last_login_at timestamptz,
    last_login_ip inet,
    password_changed_at timestamptz DEFAULT now(),
    mfa_enabled boolean DEFAULT false,
    mfa_backup_codes_generated_at timestamptz,
    profile_metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.app_users(user_id),
    
    -- Constraints
    CONSTRAINT app_users_retailer_location_scope CHECK (
        (role IN ('owner', 'backoffice') AND retailer_id IS NULL AND location_id IS NULL) OR
        (role = 'retailer' AND retailer_id IS NOT NULL AND location_id IS NULL) OR
        (role = 'location_user' AND location_id IS NOT NULL)
    )
);

-- =============================================================================
-- AUTHENTICATION SESSIONS TABLE
-- Server-side session tracking with device fingerprinting
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    session_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.app_users(user_id) ON DELETE CASCADE,
    refresh_token_hash text NOT NULL, -- bcrypt hash of refresh token
    access_token_jti text, -- JWT ID for access token tracking
    expires_at timestamptz NOT NULL,
    last_activity timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    
    -- Device and security metadata
    ip_address inet NOT NULL,
    user_agent text,
    device_id text, -- Client-generated device identifier
    device_fingerprint jsonb, -- Browser fingerprint data
    location_data jsonb, -- Geolocation if available
    
    -- Security flags
    revoked_at timestamptz,
    revoked_by uuid REFERENCES public.app_users(user_id),
    revoke_reason text,
    is_mfa_verified boolean DEFAULT false,
    
    -- Indexes for performance
    INDEX idx_auth_sessions_user_id (user_id),
    INDEX idx_auth_sessions_token_hash (refresh_token_hash),
    INDEX idx_auth_sessions_expires_at (expires_at),
    INDEX idx_auth_sessions_active (user_id, revoked_at) WHERE revoked_at IS NULL
);

-- =============================================================================
-- ROLES AND PERMISSIONS TABLE
-- Granular permission system
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
    role_name text PRIMARY KEY,
    display_name text NOT NULL,
    description text,
    permissions jsonb NOT NULL DEFAULT '{}',
    is_system_role boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Insert default roles
INSERT INTO public.roles (role_name, display_name, description, permissions) VALUES
('owner', 'System Owner', 'Full system access with all privileges', '{
    "system": ["*"],
    "users": ["create", "read", "update", "delete", "manage_roles"],
    "retailers": ["create", "read", "update", "delete"],
    "locations": ["create", "read", "update", "delete"],
    "customers": ["create", "read", "update", "delete"],
    "orders": ["create", "read", "update", "delete"],
    "claims": ["create", "read", "update", "delete"],
    "settings": ["read", "update"],
    "audit": ["read"],
    "sessions": ["read", "revoke"]
}'),
('backoffice', 'Back Office', 'Administrative access with retailer scope', '{
    "users": ["create", "read", "update", "manage_roles"],
    "retailers": ["read", "update"],
    "locations": ["create", "read", "update", "delete"],
    "customers": ["create", "read", "update", "delete"],
    "orders": ["create", "read", "update", "delete"],
    "claims": ["create", "read", "update", "delete"],
    "settings": ["read"],
    "audit": ["read"]
}'),
('retailer', 'Retailer', 'Retailer-scoped access', '{
    "users": ["read", "update_own"],
    "retailers": ["read_own"],
    "locations": ["read_own"],
    "customers": ["create", "read", "update"],
    "orders": ["create", "read", "update"],
    "claims": ["create", "read", "update"]
}'),
('location_user', 'Location User', 'Location-scoped access', '{
    "users": ["read_own", "update_own"],
    "customers": ["create", "read", "update"],
    "orders": ["create", "read", "update"],
    "claims": ["create", "read"]
}');

-- =============================================================================
-- INVITE TOKENS TABLE
-- Secure invitation system with expiration and single-use enforcement
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.invite_tokens (
    token_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_hash text UNIQUE NOT NULL, -- bcrypt hash of actual token
    email text NOT NULL,
    invited_by uuid NOT NULL REFERENCES public.app_users(user_id),
    role text NOT NULL CHECK (role IN ('owner', 'backoffice', 'retailer', 'location_user')),
    retailer_id uuid REFERENCES public.retailers(id),
    location_id uuid REFERENCES public.locations(id),
    permissions jsonb, -- Optional custom permissions
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    used_by uuid REFERENCES public.app_users(user_id),
    created_at timestamptz DEFAULT now(),
    
    -- Constraints
    CONSTRAINT invite_tokens_scope_check CHECK (
        (role IN ('owner', 'backoffice') AND retailer_id IS NULL AND location_id IS NULL) OR
        (role = 'retailer' AND retailer_id IS NOT NULL AND location_id IS NULL) OR
        (role = 'location_user' AND location_id IS NOT NULL)
    ),
    
    INDEX idx_invite_tokens_hash (token_hash),
    INDEX idx_invite_tokens_email (email),
    INDEX idx_invite_tokens_expires_at (expires_at)
);

-- =============================================================================
-- AUDIT LOGS TABLE
-- Comprehensive audit trail for security events
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    log_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type text NOT NULL, -- 'auth.signin', 'auth.signup', 'auth.mfa_enable', etc.
    user_id uuid REFERENCES public.app_users(user_id),
    session_id uuid REFERENCES public.auth_sessions(session_id),
    
    -- Request context
    ip_address inet,
    user_agent text,
    request_id text, -- Correlation ID for request tracing
    
    -- Event details
    resource_type text, -- 'user', 'session', 'role', etc.
    resource_id text,
    action text NOT NULL, -- 'create', 'update', 'delete', 'access', etc.
    status text NOT NULL CHECK (status IN ('success', 'failure', 'error')),
    
    -- Security metadata
    risk_score integer CHECK (risk_score >= 0 AND risk_score <= 100),
    anomaly_flags text[], -- Array of anomaly indicators
    
    -- Flexible metadata
    event_data jsonb DEFAULT '{}',
    error_details jsonb,
    
    created_at timestamptz DEFAULT now(),
    
    -- Indexes for performance and security queries
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_event_type (event_type),
    INDEX idx_audit_logs_created_at (created_at),
    INDEX idx_audit_logs_ip_address (ip_address),
    INDEX idx_audit_logs_status (status),
    INDEX idx_audit_logs_risk_score (risk_score) WHERE risk_score > 50
);

-- =============================================================================
-- MFA DEVICES TABLE
-- Multi-factor authentication device management
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.mfa_devices (
    device_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.app_users(user_id) ON DELETE CASCADE,
    device_type text NOT NULL CHECK (device_type IN ('totp', 'sms', 'backup_codes')),
    device_name text, -- User-friendly name
    secret_encrypted text, -- Encrypted TOTP secret or phone number
    backup_codes_encrypted text[], -- Encrypted backup codes
    is_active boolean DEFAULT true,
    last_used_at timestamptz,
    created_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(user_id, device_type, device_name),
    INDEX idx_mfa_devices_user_id (user_id),
    INDEX idx_mfa_devices_active (user_id, is_active) WHERE is_active = true
);

-- =============================================================================
-- PASSWORD HISTORY TABLE
-- Track password changes for security policy enforcement
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.password_history (
    history_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.app_users(user_id) ON DELETE CASCADE,
    password_hash text NOT NULL, -- bcrypt hash of old password
    created_at timestamptz DEFAULT now(),
    
    INDEX idx_password_history_user_id (user_id),
    INDEX idx_password_history_created_at (created_at)
);

-- =============================================================================
-- RATE LIMITING TABLE
-- Track rate limiting for security endpoints
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
    limit_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier text NOT NULL, -- IP, user_id, email, etc.
    limit_type text NOT NULL, -- 'signin', 'signup', 'password_reset', etc.
    attempt_count integer DEFAULT 1,
    window_start timestamptz DEFAULT now(),
    last_attempt timestamptz DEFAULT now(),
    blocked_until timestamptz,
    
    UNIQUE(identifier, limit_type),
    INDEX idx_rate_limits_identifier (identifier),
    INDEX idx_rate_limits_blocked_until (blocked_until) WHERE blocked_until IS NOT NULL
);

-- =============================================================================
-- SECURITY EVENTS TABLE
-- High-level security events and alerts
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.security_events (
    event_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type text NOT NULL, -- 'brute_force', 'anomalous_login', 'token_reuse', etc.
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id uuid REFERENCES public.app_users(user_id),
    ip_address inet,
    description text NOT NULL,
    event_data jsonb DEFAULT '{}',
    resolved_at timestamptz,
    resolved_by uuid REFERENCES public.app_users(user_id),
    created_at timestamptz DEFAULT now(),
    
    INDEX idx_security_events_type (event_type),
    INDEX idx_security_events_severity (severity),
    INDEX idx_security_events_created_at (created_at),
    INDEX idx_security_events_unresolved (resolved_at) WHERE resolved_at IS NULL
);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON public.app_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_sessions_last_activity BEFORE UPDATE ON public.auth_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECURITY FUNCTIONS
-- =============================================================================

-- Function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
    role_permissions jsonb;
BEGIN
    -- Get user role
    SELECT role INTO user_role
    FROM public.app_users
    WHERE user_id = target_user_id AND status = 'active';
    
    IF user_role IS NULL THEN
        RETURN '{}';
    END IF;
    
    -- Get role permissions
    SELECT permissions INTO role_permissions
    FROM public.roles
    WHERE role_name = user_role;
    
    RETURN COALESCE(role_permissions, '{}');
END;
$$;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
    target_user_id uuid,
    resource text,
    action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_permissions jsonb;
    resource_permissions jsonb;
BEGIN
    user_permissions := public.get_user_permissions(target_user_id);
    
    -- Check for wildcard system permission
    IF user_permissions->'system' ? '*' THEN
        RETURN true;
    END IF;
    
    -- Check specific resource permissions
    resource_permissions := user_permissions->resource;
    
    IF resource_permissions IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check for wildcard resource permission or specific action
    RETURN resource_permissions ? '*' OR resource_permissions ? action;
END;
$$;

-- Function to safely create audit log
CREATE OR REPLACE FUNCTION public.create_audit_log(
    p_event_type text,
    p_user_id uuid DEFAULT NULL,
    p_session_id uuid DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL,
    p_resource_type text DEFAULT NULL,
    p_resource_id text DEFAULT NULL,
    p_action text DEFAULT NULL,
    p_status text DEFAULT 'success',
    p_event_data jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO public.audit_logs (
        event_type, user_id, session_id, ip_address, user_agent,
        resource_type, resource_id, action, status, event_data
    ) VALUES (
        p_event_type, p_user_id, p_session_id, p_ip_address, p_user_agent,
        p_resource_type, p_resource_id, p_action, p_status, p_event_data
    ) RETURNING log_id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- =============================================================================
-- CLEANUP FUNCTIONS
-- =============================================================================

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.auth_sessions
    WHERE expires_at < now() OR revoked_at < now() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    PERFORM public.create_audit_log(
        'system.cleanup',
        NULL,
        NULL,
        NULL,
        'system',
        'auth_sessions',
        NULL,
        'delete',
        'success',
        jsonb_build_object('deleted_sessions', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$;

-- Function to cleanup expired invite tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_invites()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.invite_tokens
    WHERE expires_at < now() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    PERFORM public.create_audit_log(
        'system.cleanup',
        NULL,
        NULL,
        NULL,
        'system',
        'invite_tokens',
        NULL,
        'delete',
        'success',
        jsonb_build_object('deleted_invites', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$;

-- =============================================================================
-- GRANTS AND PERMISSIONS
-- =============================================================================

-- Grant necessary permissions for application user
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.app_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auth_sessions TO authenticated;
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invite_tokens TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.mfa_devices TO authenticated;
GRANT SELECT, INSERT ON public.password_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO authenticated;
GRANT INSERT ON public.security_events TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_audit_log(text, uuid, uuid, inet, text, text, text, text, text, jsonb) TO authenticated;

COMMENT ON TABLE public.app_users IS 'Application user profiles synchronized with auth.users';
COMMENT ON TABLE public.auth_sessions IS 'Server-side session tracking with security metadata';
COMMENT ON TABLE public.roles IS 'Role-based permission system';
COMMENT ON TABLE public.invite_tokens IS 'Secure invitation system with single-use tokens';
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for security events';
COMMENT ON TABLE public.mfa_devices IS 'Multi-factor authentication device management';
COMMENT ON TABLE public.password_history IS 'Password change history for security policy enforcement';
COMMENT ON TABLE public.rate_limits IS 'Rate limiting tracking for security endpoints';
COMMENT ON TABLE public.security_events IS 'High-level security events and alerts';
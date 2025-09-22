-- IV RELIFE Row Level Security Policies
-- Migration 002: Comprehensive RLS policies for all tables
-- Version: 1.0
-- Date: 2025-09-21

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing business tables
ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.app_users 
        WHERE user_id = auth.uid() AND status = 'active'
    );
END;
$$;

-- Get current user's retailer_id
CREATE OR REPLACE FUNCTION auth.user_retailer_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT retailer_id 
        FROM public.app_users 
        WHERE user_id = auth.uid() AND status = 'active'
    );
END;
$$;

-- Get current user's location_id
CREATE OR REPLACE FUNCTION auth.user_location_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT location_id 
        FROM public.app_users 
        WHERE user_id = auth.uid() AND status = 'active'
    );
END;
$$;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION auth.has_permission(resource text, action text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN public.user_has_permission(auth.uid(), resource, action);
END;
$$;

-- Check if user is owner or backoffice
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN auth.user_role() IN ('owner', 'backoffice');
END;
$$;

-- =============================================================================
-- APP_USERS TABLE POLICIES
-- =============================================================================

-- Users can view their own data
CREATE POLICY "app_users_select_own" ON public.app_users
FOR SELECT USING (
    auth.uid() = user_id
);

-- Users can update their own non-sensitive data
CREATE POLICY "app_users_update_own" ON public.app_users
FOR UPDATE USING (
    auth.uid() = user_id
) WITH CHECK (
    auth.uid() = user_id AND
    -- Prevent users from changing their own role, retailer_id, location_id, status
    role = (SELECT role FROM public.app_users WHERE user_id = auth.uid()) AND
    retailer_id = (SELECT retailer_id FROM public.app_users WHERE user_id = auth.uid()) AND
    location_id = (SELECT location_id FROM public.app_users WHERE user_id = auth.uid()) AND
    status = (SELECT status FROM public.app_users WHERE user_id = auth.uid())
);

-- Admins can view all users within their scope
CREATE POLICY "app_users_select_admin" ON public.app_users
FOR SELECT USING (
    auth.is_admin() AND (
        auth.user_role() = 'owner' OR
        (auth.user_role() = 'backoffice' AND (
            retailer_id IS NULL OR 
            retailer_id = auth.user_retailer_id()
        ))
    )
);

-- Retailers can view users in their retailer
CREATE POLICY "app_users_select_retailer" ON public.app_users
FOR SELECT USING (
    auth.user_role() = 'retailer' AND
    retailer_id = auth.user_retailer_id()
);

-- Admins can manage users within their scope
CREATE POLICY "app_users_manage_admin" ON public.app_users
FOR ALL USING (
    auth.has_permission('users', 'manage_roles') AND (
        auth.user_role() = 'owner' OR
        (auth.user_role() = 'backoffice' AND (
            retailer_id IS NULL OR 
            retailer_id = auth.user_retailer_id()
        ))
    )
);

-- Allow user creation during signup
CREATE POLICY "app_users_insert_signup" ON public.app_users
FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    auth.has_permission('users', 'create')
);

-- =============================================================================
-- AUTH_SESSIONS TABLE POLICIES
-- =============================================================================

-- Users can view their own sessions
CREATE POLICY "auth_sessions_select_own" ON public.auth_sessions
FOR SELECT USING (
    user_id = auth.uid()
);

-- Users can update their own sessions (for last_activity)
CREATE POLICY "auth_sessions_update_own" ON public.auth_sessions
FOR UPDATE USING (
    user_id = auth.uid()
) WITH CHECK (
    user_id = auth.uid()
);

-- Users can insert their own sessions
CREATE POLICY "auth_sessions_insert_own" ON public.auth_sessions
FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- Users can delete their own sessions (logout)
CREATE POLICY "auth_sessions_delete_own" ON public.auth_sessions
FOR DELETE USING (
    user_id = auth.uid()
);

-- Admins can view sessions for session management
CREATE POLICY "auth_sessions_select_admin" ON public.auth_sessions
FOR SELECT USING (
    auth.has_permission('sessions', 'read')
);

-- Admins can revoke sessions
CREATE POLICY "auth_sessions_revoke_admin" ON public.auth_sessions
FOR UPDATE USING (
    auth.has_permission('sessions', 'revoke')
) WITH CHECK (
    auth.has_permission('sessions', 'revoke')
);

-- =============================================================================
-- ROLES TABLE POLICIES
-- =============================================================================

-- All authenticated users can read roles (for UI purposes)
CREATE POLICY "roles_select_all" ON public.roles
FOR SELECT USING (
    auth.uid() IS NOT NULL
);

-- Only owners can modify roles
CREATE POLICY "roles_manage_owner" ON public.roles
FOR ALL USING (
    auth.user_role() = 'owner'
);

-- =============================================================================
-- INVITE_TOKENS TABLE POLICIES
-- =============================================================================

-- Users can view invites they created
CREATE POLICY "invite_tokens_select_created" ON public.invite_tokens
FOR SELECT USING (
    invited_by = auth.uid()
);

-- Users with permission can create invites within their scope
CREATE POLICY "invite_tokens_insert_scoped" ON public.invite_tokens
FOR INSERT WITH CHECK (
    auth.has_permission('users', 'create') AND
    invited_by = auth.uid() AND (
        -- Owner can invite anyone
        auth.user_role() = 'owner' OR
        -- Backoffice can invite within their retailer scope
        (auth.user_role() = 'backoffice' AND (
            retailer_id IS NULL OR retailer_id = auth.user_retailer_id()
        )) OR
        -- Retailers can invite location users within their retailer
        (auth.user_role() = 'retailer' AND 
         role = 'location_user' AND 
         retailer_id = auth.user_retailer_id())
    )
);

-- Users can update invite tokens they created (mark as used)
CREATE POLICY "invite_tokens_update_created" ON public.invite_tokens
FOR UPDATE USING (
    invited_by = auth.uid() OR
    used_by = auth.uid()
) WITH CHECK (
    invited_by = auth.uid() OR
    used_by = auth.uid()
);

-- Allow reading invite tokens for acceptance (by token hash lookup)
CREATE POLICY "invite_tokens_select_for_accept" ON public.invite_tokens
FOR SELECT USING (
    used_at IS NULL AND expires_at > now()
);

-- =============================================================================
-- AUDIT_LOGS TABLE POLICIES
-- =============================================================================

-- Users can view their own audit logs
CREATE POLICY "audit_logs_select_own" ON public.audit_logs
FOR SELECT USING (
    user_id = auth.uid()
);

-- Admins can view audit logs within their scope
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
FOR SELECT USING (
    auth.has_permission('audit', 'read')
);

-- System can insert audit logs
CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
FOR INSERT WITH CHECK (true);

-- =============================================================================
-- MFA_DEVICES TABLE POLICIES
-- =============================================================================

-- Users can manage their own MFA devices
CREATE POLICY "mfa_devices_manage_own" ON public.mfa_devices
FOR ALL USING (
    user_id = auth.uid()
) WITH CHECK (
    user_id = auth.uid()
);

-- =============================================================================
-- PASSWORD_HISTORY TABLE POLICIES
-- =============================================================================

-- Users can view their own password history
CREATE POLICY "password_history_select_own" ON public.password_history
FOR SELECT USING (
    user_id = auth.uid()
);

-- System can insert password history
CREATE POLICY "password_history_insert_system" ON public.password_history
FOR INSERT WITH CHECK (true);

-- =============================================================================
-- RATE_LIMITS TABLE POLICIES
-- =============================================================================

-- System can manage rate limits
CREATE POLICY "rate_limits_manage_system" ON public.rate_limits
FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- SECURITY_EVENTS TABLE POLICIES
-- =============================================================================

-- Admins can view security events
CREATE POLICY "security_events_select_admin" ON public.security_events
FOR SELECT USING (
    auth.has_permission('audit', 'read')
);

-- System can insert security events
CREATE POLICY "security_events_insert_system" ON public.security_events
FOR INSERT WITH CHECK (true);

-- Admins can update security events (resolve them)
CREATE POLICY "security_events_update_admin" ON public.security_events
FOR UPDATE USING (
    auth.has_permission('audit', 'read')
) WITH CHECK (
    auth.has_permission('audit', 'read')
);

-- =============================================================================
-- BUSINESS DATA TABLE POLICIES
-- =============================================================================

-- RETAILERS TABLE
CREATE POLICY "retailers_select_scoped" ON public.retailers
FOR SELECT USING (
    auth.user_role() = 'owner' OR
    auth.user_role() = 'backoffice' OR
    (auth.user_role() IN ('retailer', 'location_user') AND id = auth.user_retailer_id())
);

CREATE POLICY "retailers_manage_admin" ON public.retailers
FOR ALL USING (
    auth.has_permission('retailers', 'create') OR
    auth.has_permission('retailers', 'update') OR
    auth.has_permission('retailers', 'delete')
) WITH CHECK (
    auth.has_permission('retailers', 'create') OR
    auth.has_permission('retailers', 'update') OR
    auth.has_permission('retailers', 'delete')
);

-- LOCATIONS TABLE
CREATE POLICY "locations_select_scoped" ON public.locations
FOR SELECT USING (
    auth.user_role() = 'owner' OR
    auth.user_role() = 'backoffice' OR
    (auth.user_role() = 'retailer' AND retailer_id = auth.user_retailer_id()) OR
    (auth.user_role() = 'location_user' AND id = auth.user_location_id())
);

CREATE POLICY "locations_manage_scoped" ON public.locations
FOR ALL USING (
    auth.has_permission('locations', 'create') OR
    auth.has_permission('locations', 'update') OR
    auth.has_permission('locations', 'delete')
) WITH CHECK (
    (auth.has_permission('locations', 'create') OR
     auth.has_permission('locations', 'update') OR
     auth.has_permission('locations', 'delete')) AND
    (auth.user_role() IN ('owner', 'backoffice') OR
     retailer_id = auth.user_retailer_id())
);

-- CUSTOMERS TABLE
CREATE POLICY "customers_select_scoped" ON public.customers
FOR SELECT USING (
    auth.user_role() = 'owner' OR
    auth.user_role() = 'backoffice' OR
    (auth.user_role() = 'retailer' AND (
        retailer_id IS NULL OR retailer_id = auth.user_retailer_id()
    )) OR
    (auth.user_role() = 'location_user' AND (
        primary_location_id = auth.user_location_id() OR
        retailer_id = auth.user_retailer_id()
    ))
);

CREATE POLICY "customers_manage_scoped" ON public.customers
FOR ALL USING (
    auth.has_permission('customers', 'create') OR
    auth.has_permission('customers', 'update') OR
    auth.has_permission('customers', 'delete')
) WITH CHECK (
    (auth.has_permission('customers', 'create') OR
     auth.has_permission('customers', 'update') OR
     auth.has_permission('customers', 'delete')) AND
    (auth.user_role() IN ('owner', 'backoffice') OR
     retailer_id = auth.user_retailer_id() OR
     primary_location_id = auth.user_location_id())
);

-- CUSTOMER_CONTACTS TABLE
CREATE POLICY "customer_contacts_select_parent_scope" ON public.customer_contacts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = customer_id AND (
            auth.user_role() = 'owner' OR
            auth.user_role() = 'backoffice' OR
            (auth.user_role() = 'retailer' AND (
                c.retailer_id IS NULL OR c.retailer_id = auth.user_retailer_id()
            )) OR
            (auth.user_role() = 'location_user' AND (
                c.primary_location_id = auth.user_location_id() OR
                c.retailer_id = auth.user_retailer_id()
            ))
        )
    )
);

CREATE POLICY "customer_contacts_manage_parent_scope" ON public.customer_contacts
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = customer_id AND (
            auth.user_role() IN ('owner', 'backoffice') OR
            c.retailer_id = auth.user_retailer_id() OR
            c.primary_location_id = auth.user_location_id()
        )
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = customer_id AND (
            auth.user_role() IN ('owner', 'backoffice') OR
            c.retailer_id = auth.user_retailer_id() OR
            c.primary_location_id = auth.user_location_id()
        )
    )
);

-- CUSTOMER_ADDRESSES TABLE
CREATE POLICY "customer_addresses_select_parent_scope" ON public.customer_addresses
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = customer_id AND (
            auth.user_role() = 'owner' OR
            auth.user_role() = 'backoffice' OR
            (auth.user_role() = 'retailer' AND (
                c.retailer_id IS NULL OR c.retailer_id = auth.user_retailer_id()
            )) OR
            (auth.user_role() = 'location_user' AND (
                c.primary_location_id = auth.user_location_id() OR
                c.retailer_id = auth.user_retailer_id()
            ))
        )
    )
);

CREATE POLICY "customer_addresses_manage_parent_scope" ON public.customer_addresses
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = customer_id AND (
            auth.user_role() IN ('owner', 'backoffice') OR
            c.retailer_id = auth.user_retailer_id() OR
            c.primary_location_id = auth.user_location_id()
        )
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = customer_id AND (
            auth.user_role() IN ('owner', 'backoffice') OR
            c.retailer_id = auth.user_retailer_id() OR
            c.primary_location_id = auth.user_location_id()
        )
    )
);

-- ORDERS TABLE
CREATE POLICY "orders_select_scoped" ON public.orders
FOR SELECT USING (
    auth.user_role() = 'owner' OR
    auth.user_role() = 'backoffice' OR
    (auth.user_role() = 'retailer' AND retailer_id = auth.user_retailer_id()) OR
    (auth.user_role() = 'location_user' AND location_id = auth.user_location_id())
);

CREATE POLICY "orders_manage_scoped" ON public.orders
FOR ALL USING (
    auth.has_permission('orders', 'create') OR
    auth.has_permission('orders', 'update') OR
    auth.has_permission('orders', 'delete')
) WITH CHECK (
    (auth.has_permission('orders', 'create') OR
     auth.has_permission('orders', 'update') OR
     auth.has_permission('orders', 'delete')) AND
    (auth.user_role() IN ('owner', 'backoffice') OR
     retailer_id = auth.user_retailer_id() OR
     location_id = auth.user_location_id())
);

-- ORDER_ITEMS TABLE
CREATE POLICY "order_items_select_parent_scope" ON public.order_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND (
            auth.user_role() = 'owner' OR
            auth.user_role() = 'backoffice' OR
            (auth.user_role() = 'retailer' AND o.retailer_id = auth.user_retailer_id()) OR
            (auth.user_role() = 'location_user' AND o.location_id = auth.user_location_id())
        )
    )
);

CREATE POLICY "order_items_manage_parent_scope" ON public.order_items
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND (
            auth.user_role() IN ('owner', 'backoffice') OR
            o.retailer_id = auth.user_retailer_id() OR
            o.location_id = auth.user_location_id()
        )
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND (
            auth.user_role() IN ('owner', 'backoffice') OR
            o.retailer_id = auth.user_retailer_id() OR
            o.location_id = auth.user_location_id()
        )
    )
);

-- CLAIMS TABLE
CREATE POLICY "claims_select_scoped" ON public.claims
FOR SELECT USING (
    auth.user_role() = 'owner' OR
    auth.user_role() = 'backoffice' OR
    (auth.user_role() = 'retailer' AND retailer_id = auth.user_retailer_id()) OR
    (auth.user_role() = 'location_user' AND location_id = auth.user_location_id())
);

CREATE POLICY "claims_manage_scoped" ON public.claims
FOR ALL USING (
    auth.has_permission('claims', 'create') OR
    auth.has_permission('claims', 'update') OR
    auth.has_permission('claims', 'delete')
) WITH CHECK (
    (auth.has_permission('claims', 'create') OR
     auth.has_permission('claims', 'update') OR
     auth.has_permission('claims', 'delete')) AND
    (auth.user_role() IN ('owner', 'backoffice') OR
     retailer_id = auth.user_retailer_id() OR
     location_id = auth.user_location_id())
);

-- PRODUCTS TABLE
CREATE POLICY "products_select_all" ON public.products
FOR SELECT USING (
    auth.uid() IS NOT NULL
);

CREATE POLICY "products_manage_admin" ON public.products
FOR ALL USING (
    auth.user_role() IN ('owner', 'backoffice')
) WITH CHECK (
    auth.user_role() IN ('owner', 'backoffice')
);

-- FULFILLMENTS TABLE
CREATE POLICY "fulfillments_select_scoped" ON public.fulfillments
FOR SELECT USING (
    auth.user_role() = 'owner' OR
    auth.user_role() = 'backoffice' OR
    (auth.user_role() = 'retailer' AND retailer_id = auth.user_retailer_id()) OR
    (auth.user_role() = 'location_user' AND location_id = auth.user_location_id())
);

CREATE POLICY "fulfillments_manage_scoped" ON public.fulfillments
FOR ALL USING (
    auth.user_role() IN ('owner', 'backoffice') OR
    retailer_id = auth.user_retailer_id() OR
    location_id = auth.user_location_id()
) WITH CHECK (
    auth.user_role() IN ('owner', 'backoffice') OR
    retailer_id = auth.user_retailer_id() OR
    location_id = auth.user_location_id()
);

-- =============================================================================
-- POLICY TESTING FUNCTIONS
-- =============================================================================

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION public.test_rls_policies()
RETURNS TABLE (
    table_name text,
    policy_name text,
    test_result text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function would contain comprehensive RLS tests
    -- Implementation would be extensive, showing example structure:
    
    RETURN QUERY
    SELECT 
        'app_users'::text,
        'app_users_select_own'::text,
        'PASS'::text
    WHERE EXISTS (
        SELECT 1 FROM public.app_users WHERE user_id = auth.uid()
    );
    
    -- Add more test cases for each policy...
END;
$$;

-- =============================================================================
-- POLICY VALIDATION
-- =============================================================================

-- Ensure all tables have RLS enabled
DO $$
DECLARE
    tbl record;
    missing_rls text[] := ARRAY[]::text[];
BEGIN
    FOR tbl IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
    LOOP
        IF NOT (
            SELECT rowsecurity 
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = tbl.schemaname 
            AND c.relname = tbl.tablename
        ) THEN
            missing_rls := array_append(missing_rls, tbl.schemaname || '.' || tbl.tablename);
        END IF;
    END LOOP;
    
    IF array_length(missing_rls, 1) > 0 THEN
        RAISE EXCEPTION 'Tables missing RLS: %', array_to_string(missing_rls, ', ');
    END IF;
    
    RAISE NOTICE 'All public tables have RLS enabled successfully';
END;
$$;

COMMENT ON FUNCTION auth.user_role() IS 'Get current authenticated user role';
COMMENT ON FUNCTION auth.user_retailer_id() IS 'Get current authenticated user retailer scope';
COMMENT ON FUNCTION auth.user_location_id() IS 'Get current authenticated user location scope';
COMMENT ON FUNCTION auth.has_permission(text, text) IS 'Check if current user has specific permission';
COMMENT ON FUNCTION auth.is_admin() IS 'Check if current user is owner or backoffice';
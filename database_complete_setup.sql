-- ============================================================================
-- IV RELIFE Nexus - Complete Database Setup
-- ============================================================================
-- This script sets up the complete database schema for a fresh Supabase instance
-- Run this in your Supabase SQL Editor
-- 
-- Project: IV RELIFE Nexus (React + Vite SPA)
-- Database: Supabase PostgreSQL
-- Version: 1.0.0
-- Created: 2025-09-23
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'employee', 'viewer');

-- Order status enum
CREATE TYPE order_status AS ENUM (
    'new', 
    'processing', 
    'shipped', 
    'delivered', 
    'cancelled', 
    'refunded'
);

-- Retailer status enum
CREATE TYPE retailer_status AS ENUM (
    'setup_pending',
    'active', 
    'suspended', 
    'inactive'
);

-- Audit action types
CREATE TYPE audit_action AS ENUM (
    'create',
    'read', 
    'update',
    'delete',
    'login',
    'logout',
    'password_change',
    'role_change',
    'export',
    'import'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Retailers table (top-level organization)
CREATE TABLE retailers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address JSONB,
    settings JSONB DEFAULT '{}',
    status retailer_status DEFAULT 'setup_pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table (physical business locations)
CREATE TABLE locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address JSONB,
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'UTC',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App users table (extends Supabase auth.users)
CREATE TABLE app_users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'employee',
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location user assignments (many-to-many)
CREATE TABLE location_user_assignments (
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES app_users(id),
    PRIMARY KEY (user_id, location_id)
);

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    order_number TEXT, -- Will be populated by trigger
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address JSONB,
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    shipping_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    status order_status DEFAULT 'new',
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES app_users(id),
    updated_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order status history
CREATE TABLE order_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    old_status order_status,
    new_status order_status NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES app_users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products/Services catalog
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    category TEXT,
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory tracking
CREATE TABLE inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_available INTEGER DEFAULT 0, -- Will be updated by trigger
    reorder_point INTEGER DEFAULT 0,
    max_stock INTEGER,
    last_counted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, location_id)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID,
    action audit_action NOT NULL,
    old_values JSONB,
    new_values JSONB,
    acted_by UUID REFERENCES app_users(id),
    impersonated_retailer UUID REFERENCES retailers(id),
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES app_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(retailer_id, category, key)
);

-- Notifications/Messages
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User and authentication indexes
CREATE INDEX idx_app_users_retailer_id ON app_users(retailer_id);
CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_role ON app_users(role);
CREATE INDEX idx_app_users_active ON app_users(is_active);

-- Location indexes
CREATE INDEX idx_locations_retailer_id ON locations(retailer_id);
CREATE INDEX idx_locations_active ON locations(is_active);

-- Order indexes
CREATE INDEX idx_orders_retailer_id ON orders(retailer_id);
CREATE INDEX idx_orders_location_id ON orders(location_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_by ON orders(created_by);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order status history indexes
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_changed_at ON order_status_history(changed_at);

-- Product indexes
CREATE INDEX idx_products_retailer_id ON products(retailer_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);

-- Inventory indexes
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_location_id ON inventory(location_id);
CREATE INDEX idx_inventory_low_stock ON inventory(quantity_available) WHERE quantity_available <= reorder_point;

-- Audit log indexes
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_acted_by ON audit_logs(acted_by);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- System settings indexes
CREATE INDEX idx_system_settings_retailer_id ON system_settings(retailer_id);
CREATE INDEX idx_system_settings_category ON system_settings(category);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's retailer_id
CREATE OR REPLACE FUNCTION get_current_user_retailer_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT retailer_id 
        FROM app_users 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role::text = required_role::text OR role::text = 'owner'
        FROM app_users 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retailers policies
CREATE POLICY "Users can view their retailer" ON retailers
    FOR SELECT USING (id = get_current_user_retailer_id());

CREATE POLICY "Owners can update their retailer" ON retailers
    FOR UPDATE USING (id = get_current_user_retailer_id() AND user_has_role('owner'));

-- Locations policies
CREATE POLICY "Users can view locations in their retailer" ON locations
    FOR SELECT USING (retailer_id = get_current_user_retailer_id());

CREATE POLICY "Admins can manage locations" ON locations
    FOR ALL USING (
        retailer_id = get_current_user_retailer_id() 
        AND (user_has_role('owner') OR user_has_role('admin'))
    );

-- App users policies
CREATE POLICY "Users can view users in their retailer" ON app_users
    FOR SELECT USING (retailer_id = get_current_user_retailer_id());

CREATE POLICY "Users can update their own profile" ON app_users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage users in their retailer" ON app_users
    FOR ALL USING (
        retailer_id = get_current_user_retailer_id() 
        AND (user_has_role('owner') OR user_has_role('admin'))
    );

-- Location user assignments policies
CREATE POLICY "Users can view assignments in their retailer" ON location_user_assignments
    FOR SELECT USING (
        location_id IN (
            SELECT id FROM locations WHERE retailer_id = get_current_user_retailer_id()
        )
    );

CREATE POLICY "Admins can manage assignments" ON location_user_assignments
    FOR ALL USING (
        (user_has_role('owner') OR user_has_role('admin'))
        AND location_id IN (
            SELECT id FROM locations WHERE retailer_id = get_current_user_retailer_id()
        )
    );

-- Orders policies
CREATE POLICY "Users can view orders in their retailer" ON orders
    FOR SELECT USING (retailer_id = get_current_user_retailer_id());

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (retailer_id = get_current_user_retailer_id());

CREATE POLICY "Users can update orders they created or admins" ON orders
    FOR UPDATE USING (
        retailer_id = get_current_user_retailer_id() 
        AND (created_by = auth.uid() OR user_has_role('admin') OR user_has_role('owner'))
    );

-- Order status history policies
CREATE POLICY "Users can view order history in their retailer" ON order_status_history
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE retailer_id = get_current_user_retailer_id()
        )
    );

CREATE POLICY "Users can insert order history" ON order_status_history
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM orders WHERE retailer_id = get_current_user_retailer_id()
        )
    );

-- Products policies
CREATE POLICY "Users can view products in their retailer" ON products
    FOR SELECT USING (retailer_id = get_current_user_retailer_id());

CREATE POLICY "Managers can manage products" ON products
    FOR ALL USING (
        retailer_id = get_current_user_retailer_id() 
        AND (user_has_role('owner') OR user_has_role('admin') OR user_has_role('manager'))
    );

-- Inventory policies
CREATE POLICY "Users can view inventory in their retailer" ON inventory
    FOR SELECT USING (
        location_id IN (
            SELECT id FROM locations WHERE retailer_id = get_current_user_retailer_id()
        )
    );

CREATE POLICY "Managers can manage inventory" ON inventory
    FOR ALL USING (
        (user_has_role('owner') OR user_has_role('admin') OR user_has_role('manager'))
        AND location_id IN (
            SELECT id FROM locations WHERE retailer_id = get_current_user_retailer_id()
        )
    );

-- Audit logs policies (read-only for most users)
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        (user_has_role('owner') OR user_has_role('admin'))
        AND (impersonated_retailer = get_current_user_retailer_id() OR impersonated_retailer IS NULL)
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- System settings policies
CREATE POLICY "Admins can manage system settings" ON system_settings
    FOR ALL USING (
        retailer_id = get_current_user_retailer_id() 
        AND (user_has_role('owner') OR user_has_role('admin'))
    );

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can create notifications" ON notifications
    FOR INSERT WITH CHECK (
        user_has_role('owner') OR user_has_role('admin')
    );

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_retailers_updated_at BEFORE UPDATE ON retailers
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log_entry()
RETURNS TRIGGER AS $$
DECLARE
    audit_action_type audit_action;
    retailer_id_val UUID;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        audit_action_type = 'create';
    ELSIF TG_OP = 'UPDATE' THEN
        audit_action_type = 'update';
    ELSIF TG_OP = 'DELETE' THEN
        audit_action_type = 'delete';
    END IF;

    -- Get retailer_id based on table
    IF TG_TABLE_NAME = 'app_users' THEN
        retailer_id_val = COALESCE(NEW.retailer_id, OLD.retailer_id);
    ELSIF TG_TABLE_NAME = 'orders' THEN
        retailer_id_val = COALESCE(NEW.retailer_id, OLD.retailer_id);
    ELSIF TG_TABLE_NAME = 'locations' THEN
        retailer_id_val = COALESCE(NEW.retailer_id, OLD.retailer_id);
    ELSIF TG_TABLE_NAME = 'products' THEN
        retailer_id_val = COALESCE(NEW.retailer_id, OLD.retailer_id);
    ELSE
        retailer_id_val = get_current_user_retailer_id();
    END IF;

    -- Insert audit log
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        acted_by,
        impersonated_retailer
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        audit_action_type,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        auth.uid(),
        retailer_id_val
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to key tables
CREATE TRIGGER audit_retailers AFTER INSERT OR UPDATE OR DELETE ON retailers
    FOR EACH ROW EXECUTE PROCEDURE create_audit_log_entry();

CREATE TRIGGER audit_locations AFTER INSERT OR UPDATE OR DELETE ON locations
    FOR EACH ROW EXECUTE PROCEDURE create_audit_log_entry();

CREATE TRIGGER audit_app_users AFTER INSERT OR UPDATE OR DELETE ON app_users
    FOR EACH ROW EXECUTE PROCEDURE create_audit_log_entry();

CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE PROCEDURE create_audit_log_entry();

CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE PROCEDURE create_audit_log_entry();

-- Function to handle order status changes
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history entry if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (
            order_id,
            old_status,
            new_status,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for order status changes
CREATE TRIGGER order_status_change_trigger AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE PROCEDURE handle_order_status_change();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    day_part TEXT;
    sequence_part TEXT;
    order_count INTEGER;
BEGIN
    -- Extract year and day of year
    year_part := EXTRACT(YEAR FROM NEW.created_at)::TEXT;
    day_part := LPAD(EXTRACT(DOY FROM NEW.created_at)::TEXT, 3, '0');
    
    -- Get count of orders created today for this retailer
    SELECT COUNT(*) + 1 INTO order_count
    FROM orders 
    WHERE retailer_id = NEW.retailer_id 
    AND DATE(created_at) = DATE(NEW.created_at)
    AND id != NEW.id;
    
    -- Create sequence part
    sequence_part := LPAD(order_count::TEXT, 4, '0');
    
    -- Generate order number
    NEW.order_number := 'ORD-' || year_part || '-' || day_part || '-' || sequence_part;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate order numbers
CREATE TRIGGER generate_order_number_trigger 
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE PROCEDURE generate_order_number();

-- Function to calculate inventory quantities
CREATE OR REPLACE FUNCTION calculate_inventory_quantities()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate available quantity
    NEW.quantity_available := NEW.quantity_on_hand - NEW.quantity_reserved;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate inventory quantities
CREATE TRIGGER calculate_inventory_quantities_trigger 
    BEFORE INSERT OR UPDATE ON inventory
    FOR EACH ROW EXECUTE PROCEDURE calculate_inventory_quantities();

-- Function to automatically create app_user on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.app_users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================================
-- INITIAL DATA AND DEMO SETUP
-- ============================================================================

-- Create a default retailer for testing (optional)
INSERT INTO retailers (id, name, email, status) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'IV RELIFE Demo Store', 'demo@iv-relife.com', 'active');

-- Create default location
INSERT INTO locations (id, retailer_id, name, timezone) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Main Location', 'America/New_York');

-- Create some sample products
INSERT INTO products (retailer_id, name, description, sku, category, price) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'IV Hydration Therapy', 'Basic hydration therapy session', 'IVH-001', 'Hydration', 75.00),
    ('550e8400-e29b-41d4-a716-446655440000', 'Vitamin B12 Boost', 'Energy boost with B12 vitamins', 'VIT-B12', 'Vitamins', 95.00),
    ('550e8400-e29b-41d4-a716-446655440000', 'Immunity Support', 'Immune system support therapy', 'IMM-001', 'Immunity', 125.00);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- User details with retailer info
CREATE VIEW user_details AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    u.last_login_at,
    u.created_at,
    r.name as retailer_name,
    r.status as retailer_status
FROM app_users u
LEFT JOIN retailers r ON u.retailer_id = r.id;

-- Order summary view
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_email,
    o.status,
    o.total_amount,
    o.created_at,
    l.name as location_name,
    r.name as retailer_name,
    u.full_name as created_by_name
FROM orders o
LEFT JOIN locations l ON o.location_id = l.id
LEFT JOIN retailers r ON o.retailer_id = r.id
LEFT JOIN app_users u ON o.created_by = u.id;

-- Inventory levels view
CREATE VIEW inventory_levels AS
SELECT 
    i.id,
    p.name as product_name,
    p.sku,
    l.name as location_name,
    i.quantity_on_hand,
    i.quantity_reserved,
    i.quantity_available,
    i.reorder_point,
    CASE 
        WHEN i.quantity_available <= i.reorder_point THEN 'LOW'
        WHEN i.quantity_available = 0 THEN 'OUT_OF_STOCK'
        ELSE 'NORMAL'
    END as stock_status
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN locations l ON i.location_id = l.id;

-- ============================================================================
-- SECURITY FUNCTIONS
-- ============================================================================

-- Function to check if current user can access retailer
CREATE OR REPLACE FUNCTION can_access_retailer(target_retailer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN target_retailer_id = get_current_user_retailer_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM app_users 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEANUP AND OPTIMIZATION
-- ============================================================================

-- Analyze tables for query optimization
ANALYZE retailers;
ANALYZE locations;
ANALYZE app_users;
ANALYZE orders;
ANALYZE products;
ANALYZE inventory;
ANALYZE audit_logs;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'IV RELIFE Nexus Database Setup Complete!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Tables created: %', (
        SELECT count(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'retailers', 'locations', 'app_users', 'location_user_assignments',
            'orders', 'order_status_history', 'products', 'inventory',
            'audit_logs', 'system_settings', 'notifications'
        )
    );
    RAISE NOTICE 'RLS policies: Enabled on all tables';
    RAISE NOTICE 'Triggers: Created for auditing and timestamps';
    RAISE NOTICE 'Indexes: Optimized for performance';
    RAISE NOTICE 'Sample data: Demo retailer and products created';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Your React + Vite app is ready to connect!';
    RAISE NOTICE 'Supabase URL: https://qeiyxwuyhetnrnundpep.supabase.co';
    RAISE NOTICE '=================================================================';
END $$;
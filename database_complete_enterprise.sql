-- ============================================================================
-- IV RELIFE Nexus - COMPLETE ENTERPRISE DATABASE SETUP
-- ============================================================================
-- This script sets up the complete enterprise database schema (26+ tables)
-- Run this in your Supabase SQL Editor
-- 
-- Project: IV RELIFE Nexus (React + Vite SPA)
-- Database: Supabase PostgreSQL
-- Version: 2.0.0 (Complete Enterprise Schema)
-- Created: 2025-09-23
-- Tables: 26+ tables for full business management
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis" CASCADE;

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

-- User roles enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'employee', 'viewer', 'customer', 'provider');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Order status enum
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'draft', 'new', 'confirmed', 'processing', 'shipped', 'delivered', 
        'cancelled', 'refunded', 'on_hold', 'pending_payment'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment status enum
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partial'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Retailer status enum
DO $$ BEGIN
    CREATE TYPE retailer_status AS ENUM (
        'setup_pending', 'active', 'suspended', 'inactive', 'trial', 'premium'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Appointment status enum
DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM (
        'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Inventory transaction types
DO $$ BEGIN
    CREATE TYPE inventory_transaction_type AS ENUM (
        'purchase', 'sale', 'adjustment', 'transfer', 'return', 'waste', 'recount'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Audit action types
DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM (
        'create', 'read', 'update', 'delete', 'login', 'logout', 'password_change',
        'role_change', 'export', 'import', 'backup', 'restore', 'bulk_update'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Document types
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM (
        'invoice', 'receipt', 'contract', 'form', 'image', 'pdf', 'spreadsheet', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Communication types
DO $$ BEGIN
    CREATE TYPE communication_type AS ENUM (
        'email', 'sms', 'phone', 'in_person', 'video_call', 'chat', 'note'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Subscription status
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM (
        'active', 'inactive', 'cancelled', 'expired', 'trial', 'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CORE BUSINESS TABLES
-- ============================================================================

-- Retailers table (top-level organization)
CREATE TABLE retailers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    business_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address JSONB,
    business_hours JSONB,
    settings JSONB DEFAULT '{}',
    tax_id TEXT,
    license_number TEXT,
    status retailer_status DEFAULT 'setup_pending',
    subscription_tier TEXT DEFAULT 'basic',
    onboarding_completed BOOLEAN DEFAULT false,
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
    coordinates POINT,
    business_hours JSONB,
    settings JSONB DEFAULT '{}',
    capacity INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App users table (extends Supabase auth.users)
CREATE TABLE app_users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role user_role DEFAULT 'employee',
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    avatar_url TEXT,
    emergency_contact JSONB,
    employment_start_date DATE,
    salary_amount DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location user assignments (many-to-many)
CREATE TABLE location_user_assignments (
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'employee',
    is_primary BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES app_users(id),
    PRIMARY KEY (user_id, location_id)
);

-- ============================================================================
-- CUSTOMER MANAGEMENT
-- ============================================================================

-- Customers table
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    customer_number TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    date_of_birth DATE,
    gender TEXT,
    address JSONB,
    emergency_contact JSONB,
    medical_history JSONB,
    allergies TEXT[],
    preferences JSONB DEFAULT '{}',
    notes TEXT,
    source TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    total_visits INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_visit_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer communications log
CREATE TABLE customer_communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id),
    type communication_type NOT NULL,
    subject TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PRODUCT AND SERVICE MANAGEMENT
-- ============================================================================

-- Product categories
CREATE TABLE product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products/Services catalog
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    barcode TEXT,
    type TEXT DEFAULT 'service', -- service, product, package
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    duration_minutes INTEGER, -- for services
    preparation_time INTEGER,
    requires_consent BOOLEAN DEFAULT false,
    contraindications TEXT[],
    ingredients JSONB,
    images TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_taxable BOOLEAN DEFAULT true,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants (sizes, strengths, etc.)
CREATE TABLE product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    cost_adjustment DECIMAL(10,2) DEFAULT 0,
    attributes JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INVENTORY MANAGEMENT
-- ============================================================================

-- Inventory tracking
CREATE TABLE inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_available INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 0,
    max_stock INTEGER,
    unit_cost DECIMAL(10,2),
    expiry_date DATE,
    lot_number TEXT,
    last_counted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, location_id, variant_id)
);

-- Inventory transactions
CREATE TABLE inventory_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    type inventory_transaction_type NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_id UUID, -- order_id, purchase_id, etc.
    reference_type TEXT,
    notes TEXT,
    performed_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address JSONB,
    payment_terms TEXT,
    tax_id TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase orders
CREATE TABLE purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    location_id UUID REFERENCES locations(id),
    po_number TEXT UNIQUE,
    status TEXT DEFAULT 'draft',
    subtotal DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    shipping_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    expected_delivery_date DATE,
    notes TEXT,
    created_by UUID REFERENCES app_users(id),
    approved_by UUID REFERENCES app_users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order items
CREATE TABLE purchase_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APPOINTMENT AND SCHEDULING
-- ============================================================================

-- Appointments
CREATE TABLE appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    customer_id UUID REFERENCES customers(id),
    assigned_user_id UUID REFERENCES app_users(id),
    service_id UUID REFERENCES products(id),
    appointment_number TEXT UNIQUE,
    title TEXT,
    description TEXT,
    status appointment_status DEFAULT 'scheduled',
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    price DECIMAL(10,2),
    notes TEXT,
    internal_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointment services (for multi-service appointments)
CREATE TABLE appointment_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    service_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER DEFAULT 1,
    price DECIMAL(10,2),
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff schedules/availability
CREATE TABLE staff_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, location_id, date, start_time)
);

-- ============================================================================
-- ORDER AND PAYMENT MANAGEMENT
-- ============================================================================

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id),
    appointment_id UUID REFERENCES appointments(id),
    order_number TEXT UNIQUE,
    type TEXT DEFAULT 'service', -- service, retail, package
    status order_status DEFAULT 'new',
    subtotal DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    tip_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2),
    notes TEXT,
    internal_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES app_users(id),
    updated_by UUID REFERENCES app_users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    cost DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Payments
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    customer_id UUID REFERENCES customers(id),
    payment_number TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    method TEXT NOT NULL, -- cash, card, check, digital, etc.
    status payment_status DEFAULT 'pending',
    reference_number TEXT,
    processor TEXT,
    processor_transaction_id TEXT,
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds
CREATE TABLE refunds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    method TEXT,
    reference_number TEXT,
    status TEXT DEFAULT 'pending',
    processed_by UUID REFERENCES app_users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MARKETING AND PROMOTIONS
-- ============================================================================

-- Promotions/Discounts
CREATE TABLE promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE,
    type TEXT NOT NULL, -- percentage, fixed_amount, buy_x_get_y
    value DECIMAL(10,2),
    minimum_amount DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    applicable_products UUID[], -- array of product IDs
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing campaigns
CREATE TABLE marketing_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT, -- email, sms, social, print
    target_audience JSONB,
    content JSONB,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft',
    metrics JSONB DEFAULT '{}',
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer loyalty program
CREATE TABLE loyalty_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    points_per_dollar DECIMAL(5,2) DEFAULT 1.00,
    points_value DECIMAL(5,4) DEFAULT 0.01, -- $0.01 per point
    minimum_redemption INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer loyalty points
CREATE TABLE customer_loyalty_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    loyalty_program_id UUID REFERENCES loyalty_programs(id),
    order_id UUID REFERENCES orders(id),
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FINANCIAL MANAGEMENT
-- ============================================================================

-- Chart of accounts
CREATE TABLE chart_of_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    account_number TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- asset, liability, equity, revenue, expense
    parent_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal entries
CREATE TABLE journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    entry_number TEXT UNIQUE,
    date DATE NOT NULL,
    description TEXT,
    reference_id UUID,
    reference_type TEXT,
    total_debit DECIMAL(10,2) DEFAULT 0,
    total_credit DECIMAL(10,2) DEFAULT 0,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal entry lines
CREATE TABLE journal_entry_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    description TEXT,
    debit_amount DECIMAL(10,2) DEFAULT 0,
    credit_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DOCUMENT AND FILE MANAGEMENT
-- ============================================================================

-- Documents
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type document_type,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    customer_id UUID REFERENCES customers(id),
    order_id UUID REFERENCES orders(id),
    appointment_id UUID REFERENCES appointments(id),
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP WITH TIME ZONE,
    signed_by UUID REFERENCES app_users(id),
    uploaded_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form templates
CREATE TABLE form_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    form_fields JSONB NOT NULL,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer form submissions
CREATE TABLE customer_form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    form_template_id UUID REFERENCES form_templates(id),
    appointment_id UUID REFERENCES appointments(id),
    submission_data JSONB NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id),
    table_name TEXT NOT NULL,
    record_id UUID,
    action audit_action NOT NULL,
    old_values JSONB,
    new_values JSONB,
    acted_by UUID REFERENCES app_users(id),
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
    retailer_id UUID REFERENCES retailers(id),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys and integrations
CREATE TABLE api_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retailer_id UUID REFERENCES retailers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- payment, email, sms, etc.
    credentials JSONB, -- encrypted
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS (Sample - key ones only due to length)
-- ============================================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    day_part TEXT;
    sequence_part TEXT;
    order_count INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM NEW.created_at)::TEXT;
    day_part := LPAD(EXTRACT(DOY FROM NEW.created_at)::TEXT, 3, '0');
    
    SELECT COUNT(*) + 1 INTO order_count
    FROM orders 
    WHERE retailer_id = NEW.retailer_id 
    AND DATE(created_at) = DATE(NEW.created_at)
    AND id != NEW.id;
    
    sequence_part := LPAD(order_count::TEXT, 4, '0');
    NEW.order_number := 'ORD-' || year_part || '-' || day_part || '-' || sequence_part;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate customer numbers
CREATE OR REPLACE FUNCTION generate_customer_number()
RETURNS TRIGGER AS $$
DECLARE
    customer_count INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO customer_count
    FROM customers 
    WHERE retailer_id = NEW.retailer_id;
    
    NEW.customer_number := 'CUST-' || LPAD(customer_count::TEXT, 6, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate inventory quantities
CREATE OR REPLACE FUNCTION calculate_inventory_quantities()
RETURNS TRIGGER AS $$
BEGIN
    NEW.quantity_available := NEW.quantity_on_hand - NEW.quantity_reserved;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer totals
CREATE OR REPLACE FUNCTION update_customer_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE customers SET
            total_visits = (
                SELECT COUNT(*) FROM appointments 
                WHERE customer_id = NEW.customer_id AND status = 'completed'
            ),
            total_spent = (
                SELECT COALESCE(SUM(total_amount), 0) FROM orders 
                WHERE customer_id = NEW.customer_id AND status IN ('completed', 'delivered')
            ),
            last_visit_at = (
                SELECT MAX(actual_end) FROM appointments 
                WHERE customer_id = NEW.customer_id AND status = 'completed'
            )
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ESSENTIAL TRIGGERS
-- ============================================================================

-- Updated_at triggers for main tables
CREATE TRIGGER update_retailers_updated_at BEFORE UPDATE ON retailers
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Auto-generation triggers
CREATE TRIGGER generate_order_number_trigger 
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE PROCEDURE generate_order_number();

CREATE TRIGGER generate_customer_number_trigger 
    BEFORE INSERT ON customers
    FOR EACH ROW EXECUTE PROCEDURE generate_customer_number();

CREATE TRIGGER calculate_inventory_quantities_trigger 
    BEFORE INSERT OR UPDATE ON inventory
    FOR EACH ROW EXECUTE PROCEDURE calculate_inventory_quantities();

-- Customer stats triggers
CREATE TRIGGER update_customer_totals_on_order
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE PROCEDURE update_customer_totals();

CREATE TRIGGER update_customer_totals_on_appointment
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE PROCEDURE update_customer_totals();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create default retailer
INSERT INTO retailers (id, name, email, status) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'IV RELIFE Demo Store', 'demo@iv-relife.com', 'active');

-- Create default location
INSERT INTO locations (id, retailer_id, name, timezone, is_primary) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Main Location', 'America/New_York', true);

-- Create product categories
INSERT INTO product_categories (retailer_id, name, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'IV Therapy', 'Intravenous hydration and vitamin therapy'),
    ('550e8400-e29b-41d4-a716-446655440000', 'Vitamin Shots', 'Intramuscular vitamin injections'),
    ('550e8400-e29b-41d4-a716-446655440000', 'Wellness Packages', 'Comprehensive wellness treatment packages');

-- Create sample products/services
INSERT INTO products (retailer_id, name, description, sku, type, price, duration_minutes) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Basic Hydration IV', 'Essential hydration therapy with electrolytes', 'IV-HYD-001', 'service', 75.00, 30),
    ('550e8400-e29b-41d4-a716-446655440000', 'Energy Boost IV', 'B-vitamin complex IV for energy enhancement', 'IV-ENE-001', 'service', 125.00, 45),
    ('550e8400-e29b-41d4-a716-446655440000', 'Immunity Support IV', 'Vitamin C and zinc IV for immune support', 'IV-IMM-001', 'service', 150.00, 45),
    ('550e8400-e29b-41d4-a716-446655440000', 'B12 Shot', 'Vitamin B12 intramuscular injection', 'SHOT-B12', 'service', 25.00, 5),
    ('550e8400-e29b-41d4-a716-446655440000', 'Vitamin D Shot', 'Vitamin D3 intramuscular injection', 'SHOT-VD', 'service', 30.00, 5);

-- Create chart of accounts (basic)
INSERT INTO chart_of_accounts (retailer_id, account_number, name, type) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', '1000', 'Cash', 'asset'),
    ('550e8400-e29b-41d4-a716-446655440000', '1200', 'Accounts Receivable', 'asset'),
    ('550e8400-e29b-41d4-a716-446655440000', '1300', 'Inventory', 'asset'),
    ('550e8400-e29b-41d4-a716-446655440000', '4000', 'Service Revenue', 'revenue'),
    ('550e8400-e29b-41d4-a716-446655440000', '5000', 'Cost of Goods Sold', 'expense'),
    ('550e8400-e29b-41d4-a716-446655440000', '6000', 'Operating Expenses', 'expense');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'IV RELIFE Nexus COMPLETE ENTERPRISE Database Setup Complete!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Total Tables Created: %', (
        SELECT count(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'sql_%'
    );
    RAISE NOTICE 'Core Business: retailers, locations, users, customers';
    RAISE NOTICE 'Products: categories, products, variants, inventory';
    RAISE NOTICE 'Scheduling: appointments, staff schedules';
    RAISE NOTICE 'Orders: orders, items, payments, refunds';
    RAISE NOTICE 'Marketing: promotions, campaigns, loyalty';
    RAISE NOTICE 'Financial: chart of accounts, journal entries';
    RAISE NOTICE 'Documents: templates, submissions, files';
    RAISE NOTICE 'System: audit logs, settings, notifications';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Your React + Vite app now has a complete enterprise database!';
    RAISE NOTICE 'Supabase URL: https://qeiyxwuyhetnrnundpep.supabase.co';
    RAISE NOTICE '=================================================================';
END $$;
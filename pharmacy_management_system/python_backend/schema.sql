-- =====================================================
-- Pharmacy Management System - Complete Database Schema
-- =====================================================

-- Drop existing tables if recreating (use with caution in production)
-- DROP TABLE IF EXISTS auth_tokens CASCADE;
-- DROP TABLE IF EXISTS sales_items CASCADE;
-- DROP TABLE IF EXISTS sales CASCADE;
-- DROP TABLE IF EXISTS inventory CASCADE;
-- DROP TABLE IF EXISTS prescriptions CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS medicines CASCADE;
-- DROP TABLE IF EXISTS suppliers CASCADE;
-- DROP TABLE IF EXISTS pharmacy CASCADE;

-- =====================================================
-- 1. PHARMACY TABLE (New)
-- =====================================================
CREATE TABLE IF NOT EXISTS pharmacy (
    id SERIAL PRIMARY KEY,
    pharmacy_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    license_number VARCHAR(100),
    gst_number VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    is_profile_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Only allow one pharmacy registration
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_pharmacy ON pharmacy ((1));

-- =====================================================
-- 2. USERS TABLE (Updated with roles and pharmacy_id)
-- =====================================================
-- First, check if users table exists and backup if needed
DO $$
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='pharmacy_id') THEN
        ALTER TABLE users ADD COLUMN pharmacy_id INTEGER REFERENCES pharmacy(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'EMPLOYEE' CHECK (role IN ('ADMIN', 'EMPLOYEE'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    pharmacy_id INTEGER REFERENCES pharmacy(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'EMPLOYEE' CHECK (role IN ('ADMIN', 'EMPLOYEE')),
    status VARCHAR(20) DEFAULT 'active',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one admin per pharmacy
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_admin_per_pharmacy 
ON users (pharmacy_id) WHERE role = 'ADMIN';

-- =====================================================
-- 3. AUTH TOKENS TABLE (New)
-- =====================================================
CREATE TABLE IF NOT EXISTS auth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_valid BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);

-- =====================================================
-- 4. SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. MEDICINES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    medicine_name VARCHAR(255) NOT NULL,
    composition TEXT,
    uses TEXT,
    side_effects TEXT,
    image_url TEXT,
    manufacturer VARCHAR(255),
    excellent_review_percent INTEGER DEFAULT 0,
    average_review_percent INTEGER DEFAULT 0,
    poor_review_percent INTEGER DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(medicine_name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);

-- =====================================================
-- 6. INVENTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    medicine_id INTEGER REFERENCES medicines(id) ON DELETE CASCADE,
    batch_id VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    expiry_date DATE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_price DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    barcode VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_medicine ON inventory(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(barcode);

-- =====================================================
-- 7. CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- =====================================================
-- 8. PRESCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255),
    prescription_date DATE,
    prescription_image TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_customer ON prescriptions(customer_id);

-- =====================================================
-- 9. ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    doctor_name VARCHAR(255),
    prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE SET NULL,
    total DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- =====================================================
-- 10. SALES TABLE (Updated with pharmacy_id and generated_by)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales' AND column_name='pharmacy_id') THEN
        ALTER TABLE sales ADD COLUMN pharmacy_id INTEGER REFERENCES pharmacy(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales' AND column_name='generated_by_user_id') THEN
        ALTER TABLE sales ADD COLUMN generated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    pharmacy_id INTEGER REFERENCES pharmacy(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    subtotal DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) DEFAULT 0,
    payment_method VARCHAR(50),
    generated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);

-- =====================================================
-- 11. SALES ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sales_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_items_sale ON sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_medicine ON sales_items(medicine_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at 
                       BEFORE UPDATE ON %I 
                       FOR EACH ROW 
                       EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- =====================================================
-- INITIAL DATA / MIGRATION
-- =====================================================
-- Note: Run this only once during initial setup
-- If you have existing data, you'll need to migrate it appropriately

COMMENT ON TABLE pharmacy IS 'Stores pharmacy registration and profile information. Only one pharmacy allowed per database.';
COMMENT ON TABLE users IS 'User accounts with role-based access (ADMIN or EMPLOYEE). Each pharmacy has one admin.';
COMMENT ON TABLE auth_tokens IS 'JWT authentication tokens for session management.';
COMMENT ON COLUMN users.role IS 'User role: ADMIN (pharmacy owner) or EMPLOYEE (staff member)';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active. Admins can deactivate employees.';
COMMENT ON COLUMN sales.generated_by_user_id IS 'User who generated this sale/invoice';

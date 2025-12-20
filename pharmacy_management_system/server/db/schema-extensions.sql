-- Extended Schema for Complete Pharmacy Management System
-- This file adds all missing tables for full operational functionality

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  date_of_birth DATE,
  gender VARCHAR(20),
  loyalty_points INTEGER DEFAULT 0,
  total_purchases DECIMAL(10, 2) DEFAULT 0,
  last_purchase_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash',
  payment_status VARCHAR(50) DEFAULT 'paid',
  sold_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales_items table
CREATE TABLE IF NOT EXISTS sales_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  medicine_id INTEGER REFERENCES medicines(id) ON DELETE RESTRICT,
  medicine_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  batch_id VARCHAR(100),
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE RESTRICT,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  received_date DATE,
  invoice_number VARCHAR(100),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  medicine_id INTEGER REFERENCES medicines(id) ON DELETE RESTRICT,
  medicine_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255) NOT NULL,
  doctor_id VARCHAR(100),
  doctor_contact VARCHAR(50),
  prescription_date DATE NOT NULL,
  expiry_date DATE,
  image_url TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create prescription_items table
CREATE TABLE IF NOT EXISTS prescription_items (
  id SERIAL PRIMARY KEY,
  prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_id INTEGER REFERENCES medicines(id) ON DELETE RESTRICT,
  medicine_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id SERIAL PRIMARY KEY,
  medicine_id INTEGER REFERENCES medicines(id) ON DELETE RESTRICT,
  batch_id VARCHAR(100),
  adjustment_type VARCHAR(50) NOT NULL, -- 'add', 'remove', 'transfer', 'damage', 'expired'
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_number VARCHAR(100),
  adjusted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_fulfillment table (for doctor orders)
CREATE TABLE IF NOT EXISTS order_fulfillment (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  medicine_id INTEGER REFERENCES medicines(id) ON DELETE RESTRICT,
  quantity_allocated INTEGER NOT NULL,
  batch_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'allocated', -- 'allocated', 'packed', 'shipped', 'delivered'
  delivery_date DATE,
  tracking_number VARCHAR(100),
  notes TEXT,
  fulfilled_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create low_stock_thresholds table
CREATE TABLE IF NOT EXISTS low_stock_thresholds (
  id SERIAL PRIMARY KEY,
  medicine_id INTEGER REFERENCES medicines(id) ON DELETE CASCADE,
  threshold_quantity INTEGER NOT NULL DEFAULT 50,
  auto_reorder BOOLEAN DEFAULT false,
  reorder_quantity INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(medicine_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_items_sale ON sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_medicine ON sales_items(medicine_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_customer ON prescriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_name);
CREATE INDEX IF NOT EXISTS idx_prescriptions_expiry ON prescriptions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_medicine ON stock_adjustments(medicine_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillment_order ON order_fulfillment(order_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_thresholds_medicine ON low_stock_thresholds(medicine_id);

-- Add barcode column to medicines if not exists (for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medicines' AND column_name = 'barcode'
  ) THEN
    ALTER TABLE medicines ADD COLUMN barcode VARCHAR(50) UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);
  END IF;
END $$;


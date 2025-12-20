-- Create medicines table
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

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  contact VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  doctor_name VARCHAR(255) NOT NULL,
  doctor_id VARCHAR(100),
  contact VARCHAR(50),
  email VARCHAR(255),
  drugs TEXT,
  quantity INTEGER DEFAULT 1,
  total DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  order_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory table (for tracking stock levels)
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  medicine_id INTEGER REFERENCES medicines(id) ON DELETE CASCADE,
  batch_id VARCHAR(100),
  quantity INTEGER NOT NULL,
  expiry_date DATE,
  supplier_id INTEGER REFERENCES suppliers(id),
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(medicine_name);
CREATE INDEX IF NOT EXISTS idx_medicines_manufacturer ON medicines(manufacturer);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_medicine ON inventory(medicine_id);


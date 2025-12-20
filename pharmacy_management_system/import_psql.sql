-- PostgreSQL Import Script
-- Run this in psql shell to import CSV data

-- Step 1: Create the database (if not exists)
-- Run this first: CREATE DATABASE pharmacy_db;

-- Step 2: Connect to the database
-- \c pharmacy_db

-- Step 3: Create medicines table
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

-- Step 4: Import CSV data using COPY command
-- Note: Adjust the file path to match your system
COPY medicines(
    medicine_name, 
    composition, 
    uses, 
    side_effects, 
    image_url, 
    manufacturer, 
    excellent_review_percent, 
    average_review_percent, 
    poor_review_percent
)
FROM 'C:\Users\user\OneDrive\Desktop\DBMS-EL\Pharmacy-20management-20system\Medicine_Details (2).csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"', ESCAPE '"');

-- Step 5: Verify the import
SELECT COUNT(*) as total_medicines FROM medicines;
SELECT medicine_name, manufacturer FROM medicines LIMIT 5;


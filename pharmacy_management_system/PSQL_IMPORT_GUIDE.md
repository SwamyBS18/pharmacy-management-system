# Import CSV Data Using psql Shell

## Step-by-Step Guide

### Step 1: Open psql Shell

Open PowerShell or Command Prompt and run:
```bash
psql -U postgres
```
Enter your PostgreSQL password when prompted.

### Step 2: Create Database (if not exists)

```sql
CREATE DATABASE pharmacy_db;
```

### Step 3: Connect to the Database

```sql
\c pharmacy_db
```

### Step 4: Create the Medicines Table

Copy and paste this SQL:

```sql
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
```

### Step 5: Import CSV Data

**Important:** First, check the exact path to your CSV file. Then run:

```sql
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
```

**Note:** 
- Replace the file path with your actual CSV file path
- Make sure to use forward slashes `/` or double backslashes `\\` in Windows paths
- The CSV file must be accessible by the PostgreSQL server (usually needs to be in a location PostgreSQL can read)

### Step 6: Verify Import

```sql
-- Count total records
SELECT COUNT(*) as total_medicines FROM medicines;

-- View sample records
SELECT medicine_name, manufacturer, excellent_review_percent 
FROM medicines 
LIMIT 10;

-- View all columns of first record
SELECT * FROM medicines LIMIT 1;
```

## Alternative: If COPY doesn't work (permissions issue)

If you get a permission error with COPY, you can use the Node.js script instead:

```bash
cd "C:\Users\user\OneDrive\Desktop\DBMS-EL\Pharmacy-20management-20system"
npm run db:import
```

## Troubleshooting

### Error: "could not open file"
- Make sure the file path is correct
- Use forward slashes: `C:/Users/user/...` instead of backslashes
- Or escape backslashes: `C:\\Users\\user\\...`
- PostgreSQL needs read access to the file location

### Error: "permission denied"
- PostgreSQL user needs read permissions on the file
- Try moving CSV to a more accessible location (like `C:\temp\`)
- Or use the Node.js import script instead

### Error: "column count mismatch"
- Check that CSV has 9 columns (excluding header)
- Verify CSV format is correct
- Check for special characters or encoding issues

### Error: "invalid input syntax"
- Check CSV encoding (should be UTF-8)
- Verify no extra commas in data fields
- Check that numeric fields contain only numbers

## Quick Reference Commands

```sql
-- Connect to database
\c pharmacy_db

-- List all tables
\dt

-- View table structure
\d medicines

-- Count records
SELECT COUNT(*) FROM medicines;

-- View first 5 records
SELECT * FROM medicines LIMIT 5;

-- Exit psql
\q
```

## After Import

Once data is imported:
1. Your Node.js API will automatically read from PostgreSQL
2. Start dev server: `npm run dev`
3. Visit: `http://localhost:5173/dashboard/medicines`
4. You'll see all imported medicines!



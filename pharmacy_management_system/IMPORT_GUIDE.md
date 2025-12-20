# How to Import Excel/CSV Data into PostgreSQL

## Quick Start Guide

### Step 1: Install PostgreSQL (if not already installed)
- Download from: https://www.postgresql.org/download/
- During installation, remember the password you set for the `postgres` user

### Step 2: Create the Database

Open PowerShell or Command Prompt and run:

```bash
psql -U postgres
```

Enter your PostgreSQL password when prompted, then run:

```sql
CREATE DATABASE pharmacy_db;
\q
```

### Step 3: Install Node.js Dependencies

Navigate to your project folder and install dependencies:

```bash
cd "C:\Users\user\OneDrive\Desktop\DBMS-EL\Pharmacy-20management-20system"
npm install
```

### Step 4: Create .env File

Create a file named `.env` in the `Pharmacy-20management-20system` folder with:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pharmacy_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
```

**Replace `your_postgres_password_here` with your actual PostgreSQL password!**

### Step 5: Initialize Database Tables

Run this command to create all the necessary tables:

```bash
npm run db:init
```

You should see: `✅ Database schema initialized successfully!`

### Step 6: Import CSV Data

Now import your medicine data from the CSV file:

```bash
npm run db:import
```

This will:
- Read `Medicine_Details (2).csv`
- Parse all ~11,827 medicine records
- Insert them into PostgreSQL

**This may take 2-5 minutes depending on your system.**

You'll see progress like:
```
✅ Parsed 11827 medicines from CSV
🗑️  Cleared existing medicines data
📦 Inserted 100/11827 medicines...
📦 Inserted 200/11827 medicines...
...
✅ Successfully imported 11827 medicines into database!
```

### Step 7: Verify the Import

Check that the data was imported correctly:

```bash
psql -U postgres -d pharmacy_db
```

Then run:

```sql
SELECT COUNT(*) FROM medicines;
-- Should show: 11827 (or close to it)

SELECT medicine_name, manufacturer, price FROM medicines LIMIT 5;
-- Should show sample medicine records

\q
```

## Alternative: Direct PostgreSQL Import (Faster Method)

If you prefer to use PostgreSQL's built-in CSV import (faster for large files):

### Step 1: Create the table first
```bash
npm run db:init
```

### Step 2: Use PostgreSQL COPY command

```bash
psql -U postgres -d pharmacy_db
```

Then run this SQL command (adjust the path to your CSV file):

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
WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"');
```

**Note:** You may need to:
1. Remove the header row from CSV or handle it
2. Adjust column names to match CSV headers exactly
3. Handle special characters/encoding

## Troubleshooting

### "Connection refused" or "password authentication failed"
- Check your `.env` file has the correct password
- Make sure PostgreSQL service is running
- Try: `pg_isready` to check if PostgreSQL is accessible

### "Database does not exist"
- Run: `CREATE DATABASE pharmacy_db;` in psql

### "CSV file not found"
- Make sure `Medicine_Details (2).csv` is in the project root folder
- Check the file path is correct

### "Module not found" errors
- Run `npm install` again
- Make sure you're in the correct directory

### Import is slow
- This is normal for 11,000+ records
- The script processes in batches of 100
- Be patient, it should complete in a few minutes

## After Import

Once the data is imported:
1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:5173/dashboard/medicines`
3. You should see all your medicines from the CSV!

## Need Help?

If you encounter errors:
1. Check the error message carefully
2. Verify PostgreSQL is running: `pg_isready`
3. Check your `.env` file has correct credentials
4. Make sure the CSV file exists and is readable



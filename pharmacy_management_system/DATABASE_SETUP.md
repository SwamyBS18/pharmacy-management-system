# Database Setup Guide

This guide will help you set up PostgreSQL and import the medicine data from the CSV file.

## Prerequisites

1. **PostgreSQL** installed and running on your system
2. **Node.js** and npm/pnpm installed
3. The CSV file `Medicine_Details (2).csv` in the project root

## Step 1: Install Dependencies

```bash
npm install
# or
pnpm install
```

## Step 2: Configure Database Connection

Create a `.env` file in the project root with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pharmacy_db
DB_USER=postgres
DB_PASSWORD=your_password_here
```

## Step 3: Create Database

Connect to PostgreSQL and create the database:

```bash
psql -U postgres
```

Then run:

```sql
CREATE DATABASE pharmacy_db;
\q
```

## Step 4: Initialize Database Schema

Run the schema initialization script:

```bash
npm run db:init
```

This will create all necessary tables (medicines, suppliers, orders, users, inventory).

## Step 5: Import CSV Data

Import the medicine data from the CSV file:

```bash
npm run db:import
```

This will:
- Read the `Medicine_Details (2).csv` file
- Parse all medicine records
- Insert them into the PostgreSQL database

**Note:** This may take a few minutes as there are over 11,000 medicine records.

## Step 6: Verify Import

You can verify the import by checking the database:

```bash
psql -U postgres -d pharmacy_db
```

```sql
SELECT COUNT(*) FROM medicines;
-- Should show the number of imported medicines
SELECT * FROM medicines LIMIT 5;
-- Should show sample medicine records
```

## API Endpoints

Once the database is set up, the following API endpoints will be available:

- `GET /api/medicines` - Get all medicines (supports search, pagination)
- `GET /api/medicines/:id` - Get single medicine
- `POST /api/medicines` - Create new medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

- `GET /api/orders` - Get all orders
- `GET /api/suppliers` - Get all suppliers
- `GET /api/inventory` - Get inventory status
- `GET /api/inventory/expired` - Get expired drugs
- `GET /api/inventory/out-of-stock` - Get out of stock items
- `GET /api/users` - Get all users

## Troubleshooting

### Connection Error
- Make sure PostgreSQL is running: `pg_isready` or check service status
- Verify your `.env` file has correct credentials
- Check if the database exists: `psql -U postgres -l`

### Import Error
- Make sure the CSV file is in the project root: `Pharmacy-20management-20system/Medicine_Details (2).csv`
- Check file permissions
- Verify the CSV file is not corrupted

### Port Already in Use
- If port 5432 is in use, change `DB_PORT` in `.env`
- Or stop the conflicting PostgreSQL instance

## Next Steps

After setting up the database:
1. Start the development server: `npm run dev`
2. The frontend will automatically fetch data from the API
3. All pages (Medicines, Orders, etc.) will display real data from PostgreSQL


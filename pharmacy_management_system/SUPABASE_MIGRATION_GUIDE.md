# Migrating Pharmacy Database to Supabase

## Prerequisites
- Supabase account (sign up at https://supabase.com)
- PostgreSQL dump of your local database
- Access to your local database credentials

## Step 1: Export Your Local Database

### Option A: Using pg_dump (Recommended)
```bash
# Export schema and data
pg_dump -h localhost -p 5432 -U postgres -d pharmacy_db -F c -f pharmacy_backup.dump

# Or export as SQL file
pg_dump -h localhost -p 5432 -U postgres -d pharmacy_db > pharmacy_backup.sql
```

### Option B: Using pgAdmin
1. Open pgAdmin
2. Right-click on `pharmacy_db` database
3. Select **Backup...**
4. Choose format: **Custom** or **Plain**
5. Save the file

## Step 2: Create Supabase Project

1. Go to https://app.supabase.com
2. Click **New Project**
3. Fill in:
   - **Name**: pharmacy-management-system
   - **Database Password**: (create a strong password - SAVE THIS!)
   - **Region**: Choose closest to your users
4. Click **Create new project**
5. Wait for project to be provisioned (~2 minutes)

## Step 3: Get Supabase Database Credentials

1. In your Supabase project, go to **Settings** → **Database**
2. Find the **Connection string** section
3. Copy the connection details:
   - **Host**: db.xxx.supabase.co
   - **Port**: 5432
   - **Database**: postgres
   - **User**: postgres
   - **Password**: (the one you created)

## Step 4: Import Database to Supabase

### Option A: Using Supabase SQL Editor (For SQL files)
1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Paste your SQL dump content
4. Click **Run**

### Option B: Using psql Command Line
```bash
# Connect to Supabase and import
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres" < pharmacy_backup.sql
```

### Option C: Using pg_restore (For .dump files)
```bash
pg_restore -h db.xxx.supabase.co -p 5432 -U postgres -d postgres -v pharmacy_backup.dump
```

## Step 5: Update Your Application Configuration

Update your `.env` file in `python_backend`:

```env
DB_HOST=db.xxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password
```

## Step 6: Verify the Migration

1. Test the connection:
```bash
cd python_backend
python -c "from db import init_db_pool, execute_query; init_db_pool(); print('Connected!' if execute_query('SELECT COUNT(*) FROM medicines', fetch_one=True) else 'Failed')"
```

2. Check tables exist:
```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## Step 7: Enable Row Level Security (Optional but Recommended)

In Supabase SQL Editor:
```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies as needed
-- Example: Allow authenticated users to read medicines
CREATE POLICY "Allow public read access" ON medicines
FOR SELECT USING (true);
```

## Troubleshooting

### Issue: Connection Timeout
- Check if your IP is allowed in Supabase **Database Settings** → **Connection Pooling**
- Supabase allows connections from any IP by default

### Issue: Permission Denied
- Ensure you're using the correct password
- Check that the user has proper permissions

### Issue: Table Already Exists
- Drop existing tables in Supabase first, or
- Use `--clean` flag with pg_restore

## Important Notes

1. **Supabase uses `postgres` as the default database name**, not `pharmacy_db`
2. **Connection pooling**: Supabase provides connection pooling at port 6543 for better performance
3. **Backups**: Supabase automatically backs up your database daily
4. **Free tier limits**: 500MB database size, 2GB bandwidth

## Alternative: Manual Table Creation

If you prefer to recreate tables manually, you can:
1. Copy your table creation SQL from local database
2. Run in Supabase SQL Editor
3. Use the barcode generation and category simplification endpoints to populate data

# Diagnostic Steps - Find the Real Error

## Step 1: Test Database Connection

Open your browser and go to:
```
http://localhost:8000/test-db
```

This will show:
- If DATABASE_URL is configured
- If database connection works
- How many users exist
- The actual error if connection fails

## Step 2: Check Backend Console Logs

Look at your backend server terminal. You should see:
- "Database connection string: postgresql://postgres:****@..." (if configured)
- OR "DATABASE_URL is not set!" (if missing)

## Step 3: Check Backend .env File

Make sure `backend/.env` has:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.wpifwwamyltspunhkjwu.supabase.co:5432/postgres
```

Get this from: Supabase Dashboard > Settings > Database > Connection string > URI

## Step 4: Fix RLS

Run `database/FIX_ALL_RLS.sql` in Supabase SQL Editor:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

## Step 5: Try Registration Again

After fixing RLS, try registering. Check:
1. Backend console - you should see detailed error messages now
2. Browser console - error message should show actual error (not "Internal Server Error")
3. Frontend - error should show specific message

## Step 6: Verify User Was Created

In Supabase SQL Editor, run:
```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

You should see the users you created.

## Common Issues

### "DATABASE_URL is not set!"
- Add DATABASE_URL to `backend/.env`
- Restart backend server

### "relation users does not exist"
- Run `database/supabase_schema.sql` in Supabase SQL Editor

### "permission denied" or RLS blocking
- Run `database/FIX_ALL_RLS.sql` to disable RLS

### Connection refused/timeout
- Check DATABASE_URL format is correct
- Check Supabase project is active
- Check password in connection string is correct


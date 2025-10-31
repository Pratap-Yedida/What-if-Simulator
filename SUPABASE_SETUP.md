# Supabase Setup Instructions

## Getting Your Database Connection String

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `wpifwwamyltspunhkjwu`
3. **Navigate to Settings > Database**
4. **Find "Connection string"** section
5. **Copy the "URI"** connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.wpifwwamyltspunhkjwu.supabase.co:5432/postgres
   ```

## Setting Up Environment Variables

Create or update `backend/.env` file with:

```env
# Supabase Configuration (already set)
SUPABASE_URL=https://wpifwwamyltspunhkjwu.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Database Connection String (ADD THIS)
# Option 1: Use the full connection string from Supabase Dashboard
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.wpifwwamyltspunhkjwu.supabase.co:5432/postgres

# Option 2: Or set the password separately
# SUPABASE_DB_PASSWORD=your_database_password
```

## Running the Database Schema

1. **Open Supabase SQL Editor**: In your Supabase dashboard, go to SQL Editor
2. **Copy the schema**: Open `database/supabase_schema.sql`
3. **Run the SQL**: Paste and execute it in the SQL Editor

Or use the Supabase CLI:
```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref wpifwwamyltspunhkjwu

# Run migrations
supabase db push
```

## Verify Setup

After setting up:
1. Check Supabase Dashboard > Table Editor > `users` table
2. You should see the sample users if the schema ran successfully
3. Restart your backend server
4. Try logging in again

## Troubleshooting

### "Internal Server Error" on Login
- Check backend console logs for detailed error messages
- Verify `DATABASE_URL` is set correctly in `backend/.env`
- Make sure the database schema has been run
- Check that the `users` table exists in Supabase

### "Database connection failed"
- Verify your connection string is correct
- Check that your Supabase project is active
- Make sure you're using the correct password from Supabase dashboard

### No Users in Database
- Run the schema SQL in Supabase SQL Editor
- Check the `users` table exists
- Verify RLS policies allow backend access


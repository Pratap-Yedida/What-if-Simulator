# Complete Fix - Step by Step

## Step 1: Fix Database Connection String

1. **Get your database password from Supabase:**
   - Go to Supabase Dashboard > Settings > Database
   - Find "Connection string" section
   - Click "Show connection string" (reveals password)
   - Copy the **URI** connection string

2. **Add to `backend/.env`:**
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.wpifwwamyltspunhkjwu.supabase.co:5432/postgres
   ```
   Replace `[YOUR-PASSWORD]` with your actual database password.

## Step 2: Disable RLS in Supabase

Run this in Supabase SQL Editor:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

Or run the full fix:
```sql
-- Copy contents of database/FIX_ALL_RLS.sql and run it
```

## Step 3: Test Database Connection

Run this command from project root:
```bash
cd backend
node check-db.js
```

This will tell you if the connection works.

Or test via browser:
```
http://localhost:8000/test-db
```

## Step 4: Restart Backend Server

**IMPORTANT:** After changing `.env`, restart your backend:

```powershell
# Stop the current backend server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

## Step 5: Check Backend Console

When you try to register/login, watch the backend console. You should now see:
- Detailed error messages
- Database connection status
- Exact error codes

## Step 6: Try Registration/Login Again

After fixing everything:
1. Try registering a new user
2. Check backend console for actual error (not "Internal Server Error")
3. Check Supabase Table Editor > `users` table to see if user was created
4. Try logging in

## Troubleshooting

### If `check-db.js` fails:
- Verify DATABASE_URL is correct
- Check password is correct
- Ensure Supabase project is active

### If still getting "Internal Server Error":
- Check backend console - you should see detailed errors now
- Look for the error message starting with `===`
- Share that error message with me

### If users table is empty:
- Run `database/create_test_user.sql` in Supabase SQL Editor
- Or try registering from frontend after fixing RLS

## What I Fixed:

1. ✅ Database connection string construction
2. ✅ Enhanced error logging (you'll see actual errors now)
3. ✅ Better error messages in responses
4. ✅ Database query error details
5. ✅ Connection test endpoint (`/test-db`)

After completing all steps, you should see the **actual error** instead of "Internal Server Error", which will tell us exactly what's wrong!


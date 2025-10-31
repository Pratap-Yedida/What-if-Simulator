# Test User Credentials

## Test Account Details

Run `database/create_test_user.sql` in your Supabase SQL Editor to create this test user.

**Username:** `testuser`  
**Email:** `test@example.com`  
**Password:** `Test1234!@#$`  
**Display Name:** `Test User`  
**Subscription Tier:** `free`

## How to Create the Test User

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy the contents** of `database/create_test_user.sql`
3. **Paste and run** in the SQL Editor
4. **Verify** - The query will show the created user details

## Alternative: Use Existing Demo Users

The schema also includes these demo users (if you ran the full schema):

- **Username:** `demo_user`  
  **Email:** `demo@example.com`  
  **Password:** (check the schema - it uses a default hash)

- **Username:** `test_writer`  
  **Email:** `writer@example.com`  
  **Password:** (check the schema - it uses a default hash)

## Test the Login

After creating the test user:
1. Go to your frontend: http://localhost:3000
2. Navigate to the login page
3. Use the credentials above
4. You should be able to log in successfully!


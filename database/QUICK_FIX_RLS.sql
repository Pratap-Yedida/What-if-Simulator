-- QUICK FIX: Allow Backend to Insert/Select Users
-- Run this IMMEDIATELY in Supabase SQL Editor to fix registration and login

-- Option 1: Disable RLS on users table (SIMPLEST - Recommended for backend with direct PostgreSQL connection)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Option 2: Or add permissive policies (if you want to keep RLS enabled)
-- Uncomment below if you prefer to keep RLS but allow backend access:

-- DROP POLICY IF EXISTS "Service role full access" ON users;
-- DROP POLICY IF EXISTS "Allow registration" ON users;
-- DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- CREATE POLICY "Service role full access" ON users
--     FOR ALL
--     USING (true)
--     WITH CHECK (true);

-- CREATE POLICY "Allow registration" ON users
--     FOR INSERT
--     WITH CHECK (true);

-- CREATE POLICY "Users can view their own data" ON users
--     FOR SELECT
--     USING (true);


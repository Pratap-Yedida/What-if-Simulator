-- DISABLE RLS FOR BACKEND ACCESS
-- Run this if you're using direct PostgreSQL connection (not Supabase Auth)
-- This allows the backend to insert/select users without RLS blocking it

-- Disable RLS on users table (backend uses direct PostgreSQL connection)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- You can also keep RLS enabled and use the fix_rls_policies.sql instead
-- But if you're connecting via DATABASE_URL (direct PostgreSQL), 
-- disabling RLS is the simplest solution


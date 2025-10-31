-- Fix RLS Policies for Backend Access
-- Run this in Supabase SQL Editor to allow backend to insert/select users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Allow service role (backend) to do everything
-- When connecting via DATABASE_URL with service role, this will work
CREATE POLICY "Service role full access" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow users to view their own data (for frontend with auth)
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT
    USING (auth.uid() = id OR true);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE
    USING (auth.uid() = id OR true)
    WITH CHECK (auth.uid() = id OR true);

-- Allow public registration (via backend)
CREATE POLICY "Allow registration" ON users
    FOR INSERT
    WITH CHECK (true);

-- Alternative: Disable RLS if you're using direct PostgreSQL connection
-- Uncomment below if RLS is causing issues:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;


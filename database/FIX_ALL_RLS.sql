-- COMPLETE FIX: Disable RLS on ALL tables for backend access
-- Run this in Supabase SQL Editor to fix ALL RLS issues

-- Disable RLS on all tables (backend uses direct PostgreSQL connection)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_collaborations DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_analytics DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (cleanup)
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Allow registration" ON users;
DROP POLICY IF EXISTS "Public stories are viewable by everyone" ON stories;
DROP POLICY IF EXISTS "Authors can manage their own stories" ON stories;
DROP POLICY IF EXISTS "Story nodes are viewable with story access" ON story_nodes;
DROP POLICY IF EXISTS "Story branches are viewable with story access" ON story_branches;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'stories', 'story_nodes', 'story_branches');

-- Test query (should work now)
SELECT COUNT(*) as user_count FROM users;


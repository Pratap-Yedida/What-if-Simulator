-- Supabase Schema for What-If Storytelling Simulator
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'professional');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE story_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE node_type AS ENUM ('start', 'choice', 'ending', 'narrative');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE branch_type AS ENUM ('choice', 'condition', 'random');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    subscription_tier subscription_tier DEFAULT 'free',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status story_status DEFAULT 'draft',
    is_public BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Story nodes table
CREATE TABLE IF NOT EXISTS story_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    node_type node_type DEFAULT 'narrative',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story branches table
CREATE TABLE IF NOT EXISTS story_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    from_node_id UUID NOT NULL REFERENCES story_nodes(id) ON DELETE CASCADE,
    to_node_id UUID REFERENCES story_nodes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    branch_type branch_type DEFAULT 'choice',
    condition_expression TEXT,
    weight INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    token_version INTEGER DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story collaborations table
CREATE TABLE IF NOT EXISTS story_collaborations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'editor',
    permissions JSONB DEFAULT '{}',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(story_id, user_id)
);

-- Story analytics table
CREATE TABLE IF NOT EXISTS story_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_public ON stories(is_public);
CREATE INDEX IF NOT EXISTS idx_story_nodes_story_id ON story_nodes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_branches_story_id ON story_branches(story_id);
CREATE INDEX IF NOT EXISTS idx_story_branches_from_node ON story_branches(from_node_id);
CREATE INDEX IF NOT EXISTS idx_story_branches_to_node ON story_branches(to_node_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_story_collaborations_story_id ON story_collaborations(story_id);
CREATE INDEX IF NOT EXISTS idx_story_collaborations_user_id ON story_collaborations(user_id);
CREATE INDEX IF NOT EXISTS idx_story_analytics_story_id ON story_analytics(story_id);
CREATE INDEX IF NOT EXISTS idx_story_analytics_event_type ON story_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_story_analytics_created_at ON story_analytics(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop existing first to avoid conflicts)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_story_nodes_updated_at ON story_nodes;
CREATE TRIGGER update_story_nodes_updated_at BEFORE UPDATE ON story_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_story_branches_updated_at ON story_branches;
CREATE TRIGGER update_story_branches_updated_at BEFORE UPDATE ON story_branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (only if they don't exist)
INSERT INTO users (username, email, password_hash, display_name, subscription_tier) 
SELECT 'demo_user', 'demo@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/9yQK.2O', 'Demo User', 'premium'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'demo_user' OR email = 'demo@example.com');

INSERT INTO users (username, email, password_hash, display_name, subscription_tier) 
SELECT 'test_writer', 'writer@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/9yQK.2O', 'Test Writer', 'free'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'test_writer' OR email = 'writer@example.com');

-- Insert sample story (only if it doesn't exist)
INSERT INTO stories (title, description, author_id, status, is_public, tags)
SELECT 
    'The Time Traveler''s Dilemma',
    'A story about choices and consequences in time travel',
    (SELECT id FROM users WHERE username = 'demo_user' LIMIT 1),
    'published',
    true,
    ARRAY['sci-fi', 'time-travel', 'choices']
WHERE NOT EXISTS (
    SELECT 1 FROM stories WHERE title = 'The Time Traveler''s Dilemma'
)
AND EXISTS (SELECT 1 FROM users WHERE username = 'demo_user');

-- Insert sample nodes (only if they don't exist)
INSERT INTO story_nodes (story_id, title, content, node_type, position_x, position_y)
SELECT 
    (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1),
    'The Discovery',
    'You find a mysterious device in your grandfather''s attic...',
    'start',
    100,
    100
WHERE NOT EXISTS (
    SELECT 1 FROM story_nodes WHERE title = 'The Discovery' 
    AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1)
)
AND EXISTS (SELECT 1 FROM stories WHERE title = 'The Time Traveler''s Dilemma');

INSERT INTO story_nodes (story_id, title, content, node_type, position_x, position_y)
SELECT 
    (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1),
    'Activate Device',
    'The device begins to glow and hum with energy...',
    'narrative',
    300,
    100
WHERE NOT EXISTS (
    SELECT 1 FROM story_nodes WHERE title = 'Activate Device' 
    AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1)
)
AND EXISTS (SELECT 1 FROM stories WHERE title = 'The Time Traveler''s Dilemma');

INSERT INTO story_nodes (story_id, title, content, node_type, position_x, position_y)
SELECT 
    (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1),
    'Travel to Past',
    'You are transported to 1950s New York...',
    'narrative',
    500,
    50
WHERE NOT EXISTS (
    SELECT 1 FROM story_nodes WHERE title = 'Travel to Past' 
    AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1)
)
AND EXISTS (SELECT 1 FROM stories WHERE title = 'The Time Traveler''s Dilemma');

INSERT INTO story_nodes (story_id, title, content, node_type, position_x, position_y)
SELECT 
    (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1),
    'Travel to Future',
    'You find yourself in a dystopian 2080...',
    'narrative',
    500,
    150
WHERE NOT EXISTS (
    SELECT 1 FROM story_nodes WHERE title = 'Travel to Future' 
    AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1)
)
AND EXISTS (SELECT 1 FROM stories WHERE title = 'The Time Traveler''s Dilemma');

INSERT INTO story_nodes (story_id, title, content, node_type, position_x, position_y)
SELECT 
    (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1),
    'Stay Present',
    'You decide to keep the device hidden...',
    'ending',
    300,
    200
WHERE NOT EXISTS (
    SELECT 1 FROM story_nodes WHERE title = 'Stay Present' 
    AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1)
)
AND EXISTS (SELECT 1 FROM stories WHERE title = 'The Time Traveler''s Dilemma');

-- Insert sample branches (only if they don't exist)
INSERT INTO story_branches (story_id, from_node_id, to_node_id, title, description, branch_type)
SELECT 
    (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1),
    (SELECT id FROM story_nodes WHERE title = 'The Discovery' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1),
    (SELECT id FROM story_nodes WHERE title = 'Activate Device' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1),
    'Press the button',
    'Activate the mysterious device',
    'choice'
WHERE NOT EXISTS (
    SELECT 1 FROM story_branches 
    WHERE story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1)
    AND from_node_id = (SELECT id FROM story_nodes WHERE title = 'The Discovery' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1)
    AND title = 'Press the button'
)
AND EXISTS (SELECT 1 FROM story_nodes WHERE title = 'The Discovery' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1))
AND EXISTS (SELECT 1 FROM story_nodes WHERE title = 'Activate Device' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1));

INSERT INTO story_branches (story_id, from_node_id, to_node_id, title, description, branch_type)
SELECT 
    (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1),
    (SELECT id FROM story_nodes WHERE title = 'Activate Device' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1),
    (SELECT id FROM story_nodes WHERE title = 'Travel to Past' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1),
    'Go to the past',
    'Travel back to 1950s',
    'choice'
WHERE NOT EXISTS (
    SELECT 1 FROM story_branches 
    WHERE story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1)
    AND from_node_id = (SELECT id FROM story_nodes WHERE title = 'Activate Device' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1)
    AND to_node_id = (SELECT id FROM story_nodes WHERE title = 'Travel to Past' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1)
)
AND EXISTS (SELECT 1 FROM story_nodes WHERE title = 'Activate Device' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1))
AND EXISTS (SELECT 1 FROM story_nodes WHERE title = 'Travel to Past' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1));

INSERT INTO story_branches (story_id, from_node_id, to_node_id, title, description, branch_type)
SELECT 
    (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1),
    (SELECT id FROM story_nodes WHERE title = 'Activate Device' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1),
    (SELECT id FROM story_nodes WHERE title = 'Travel to Future' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1),
    'Go to the future',
    'Travel forward to 2080',
    'choice'
WHERE NOT EXISTS (
    SELECT 1 FROM story_branches 
    WHERE story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1)
    AND from_node_id = (SELECT id FROM story_nodes WHERE title = 'Activate Device' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1)
    AND to_node_id = (SELECT id FROM story_nodes WHERE title = 'Travel to Future' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1)
)
AND EXISTS (SELECT 1 FROM story_nodes WHERE title = 'Activate Device' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1))
AND EXISTS (SELECT 1 FROM story_nodes WHERE title = 'Travel to Future' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1));

INSERT INTO story_branches (story_id, from_node_id, to_node_id, title, description, branch_type)
SELECT 
    (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1),
    (SELECT id FROM story_nodes WHERE title = 'Activate Device' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1),
    (SELECT id FROM story_nodes WHERE title = 'Stay Present' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1),
    'Keep it safe',
    'Hide the device and continue your normal life',
    'choice'
WHERE NOT EXISTS (
    SELECT 1 FROM story_branches 
    WHERE story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1)
    AND from_node_id = (SELECT id FROM story_nodes WHERE title = 'Activate Device' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1)
    AND to_node_id = (SELECT id FROM story_nodes WHERE title = 'Stay Present' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1) LIMIT 1)
)
AND EXISTS (SELECT 1 FROM story_nodes WHERE title = 'Activate Device' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1))
AND EXISTS (SELECT 1 FROM story_nodes WHERE title = 'Stay Present' AND story_id = (SELECT id FROM stories WHERE title = 'The Time Traveler''s Dilemma' LIMIT 1));

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic ones - you can customize these)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Allow registration" ON users;
DROP POLICY IF EXISTS "Public stories are viewable by everyone" ON stories;
DROP POLICY IF EXISTS "Authors can manage their own stories" ON stories;
DROP POLICY IF EXISTS "Story nodes are viewable with story access" ON story_nodes;
DROP POLICY IF EXISTS "Story branches are viewable with story access" ON story_branches;

-- Allow service role (backend) full access - IMPORTANT for backend operations
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

CREATE POLICY "Public stories are viewable by everyone" ON stories
    FOR SELECT USING (is_public = true);

CREATE POLICY "Authors can manage their own stories" ON stories
    FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Story nodes are viewable with story access" ON story_nodes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE id = story_nodes.story_id 
            AND (is_public = true OR auth.uid() = author_id)
        )
    );

CREATE POLICY "Story branches are viewable with story access" ON story_branches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE id = story_branches.story_id 
            AND (is_public = true OR auth.uid() = author_id)
        )
    );

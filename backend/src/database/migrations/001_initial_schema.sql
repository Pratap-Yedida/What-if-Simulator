-- What-If Simulator Database Schema
-- Initial migration with all core tables

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    subscription_tier VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stories table
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    root_node_id UUID,
    genre VARCHAR(50),
    tone VARCHAR(50),
    audience_age VARCHAR(20),
    is_public BOOLEAN DEFAULT false,
    is_collaborative BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Story Nodes table
CREATE TABLE story_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id),
    parent_node_id UUID REFERENCES story_nodes(id),
    position_order INTEGER DEFAULT 0,
    sync_id VARCHAR(100), -- For dual perspectives
    sync_offset INTEGER DEFAULT 0,
    node_type VARCHAR(50) DEFAULT 'story', -- story, choice, ending
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TRIGGER update_story_nodes_updated_at BEFORE UPDATE ON story_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for story_nodes
CREATE INDEX idx_story_nodes_story_id ON story_nodes(story_id);
CREATE INDEX idx_story_nodes_sync_id ON story_nodes(sync_id);
CREATE INDEX idx_story_nodes_parent ON story_nodes(parent_node_id);

-- Story Branches table
CREATE TABLE story_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    from_node_id UUID REFERENCES story_nodes(id) ON DELETE CASCADE,
    to_node_id UUID REFERENCES story_nodes(id) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL,
    branch_type VARCHAR(50), -- character-driven, plot-twist, moral-dilemma, etc.
    impact_score DECIMAL(3,2) DEFAULT 0.50,
    selection_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Indexes for story_branches
CREATE INDEX idx_branches_from_node ON story_branches(from_node_id);
CREATE INDEX idx_branches_to_node ON story_branches(to_node_id);
CREATE INDEX idx_branches_story ON story_branches(story_id);

-- Characters table
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    traits JSONB DEFAULT '[]', -- Array of trait strings
    description TEXT,
    avatar_url VARCHAR(500),
    is_protagonist BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_characters_story_id ON characters(story_id);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    era VARCHAR(100),
    place VARCHAR(200),
    mood VARCHAR(50),
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_settings_story_id ON settings(story_id);

-- Prompt Templates table
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- logical, creative, character-driven, etc.
    template_text TEXT NOT NULL,
    parameters JSONB DEFAULT '{}', -- Required parameters
    constraints JSONB DEFAULT '{}', -- Genre, tone constraints
    usage_count INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(3,2) DEFAULT 0.50,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON prompt_templates(category);
CREATE INDEX idx_templates_effectiveness ON prompt_templates(effectiveness_score);

-- Generated Prompts table
CREATE TABLE generated_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    prompt_text TEXT NOT NULL,
    prompt_type VARCHAR(50), -- logical, creative, twist, character, thematic
    input_parameters JSONB NOT NULL,
    generation_method VARCHAR(50), -- rule-based, llm, hybrid
    template_used UUID REFERENCES prompt_templates(id),
    impact_score DECIMAL(3,2),
    confidence_score DECIMAL(3,2),
    was_accepted BOOLEAN DEFAULT false,
    was_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prompts_story_id ON generated_prompts(story_id);
CREATE INDEX idx_prompts_user_id ON generated_prompts(user_id);
CREATE INDEX idx_prompts_type ON generated_prompts(prompt_type);

-- User Analytics table
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- story_created, prompt_generated, branch_selected, etc.
    event_data JSONB DEFAULT '{}',
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_analytics_story_id ON user_analytics(story_id);
CREATE INDEX idx_analytics_event_type ON user_analytics(event_type);
CREATE INDEX idx_analytics_created_at ON user_analytics(created_at);

-- Content Moderation table
CREATE TABLE content_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL, -- story_node, generated_prompt, user_input
    content_id UUID NOT NULL, -- References various content tables
    content_text TEXT NOT NULL,
    safety_score DECIMAL(3,2),
    flagged_categories JSONB DEFAULT '[]', -- toxicity, sexual, hate_speech, etc.
    moderation_status VARCHAR(50) DEFAULT 'pending', -- approved, rejected, flagged, reviewing
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    auto_flagged_at TIMESTAMP DEFAULT NOW(),
    user_reported BOOLEAN DEFAULT false
);

CREATE INDEX idx_moderation_content_type ON content_moderation(content_type);
CREATE INDEX idx_moderation_status ON content_moderation(moderation_status);
CREATE INDEX idx_moderation_safety_score ON content_moderation(safety_score);

-- Story Collaborators table
CREATE TABLE story_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'contributor', -- owner, editor, contributor, reader
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(story_id, user_id)
);

CREATE INDEX idx_collaborators_story_id ON story_collaborators(story_id);
CREATE INDEX idx_collaborators_user_id ON story_collaborators(user_id);

-- Story Tags table
CREATE TABLE story_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(story_id, tag)
);

CREATE INDEX idx_story_tags_story_id ON story_tags(story_id);
CREATE INDEX idx_story_tags_tag ON story_tags(tag);

-- Add foreign key constraint for stories.root_node_id after story_nodes table is created
ALTER TABLE stories ADD CONSTRAINT fk_stories_root_node 
    FOREIGN KEY (root_node_id) REFERENCES story_nodes(id) ON DELETE SET NULL;

-- Sample data for What-If Simulator
-- This file provides initial data for development and testing

-- Insert sample users
INSERT INTO users (id, username, email, password_hash, display_name, subscription_tier, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@what-if-simulator.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkY2V7GIN/Vj2Oe', 'Administrator', 'premium', true),
('550e8400-e29b-41d4-a716-446655440002', 'storyteller1', 'author1@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkY2V7GIN/Vj2Oe', 'Alex Chen', 'free', true),
('550e8400-e29b-41d4-a716-446655440003', 'writer_maya', 'maya@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkY2V7GIN/Vj2Oe', 'Maya Patel', 'premium', true),
('550e8400-e29b-41d4-a716-446655440004', 'creative_sam', 'sam@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkY2V7GIN/Vj2Oe', 'Sam Rodriguez', 'free', true);

-- Insert sample stories
INSERT INTO stories (id, title, description, author_id, genre, tone, audience_age, is_public, is_collaborative) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'The Shadow City Mystery', 'A thrilling mystery set in a city where shadows have vanished overnight', '550e8400-e29b-41d4-a716-446655440002', 'mystery', 'tense', '13-17', true, false),
('650e8400-e29b-41d4-a716-446655440002', 'Lost in Time', 'A time-travel adventure through different historical periods', '550e8400-e29b-41d4-a716-446655440003', 'sci-fi', 'adventurous', '10-12', true, true),
('650e8400-e29b-41d4-a716-446655440003', 'The Enchanted Forest', 'A magical tale of friendship and courage in an mystical woodland', '550e8400-e29b-41d4-a716-446655440004', 'fantasy', 'whimsical', '8-12', true, false);

-- Insert sample story nodes
INSERT INTO story_nodes (id, story_id, content, author_id, node_type, position_order) VALUES
-- Shadow City Mystery nodes
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Detective Sarah Martinez woke up to reports flooding the police station. Throughout the entire city, every shadow had vanished overnight. Trees cast no shade, buildings created no darkness, and people walked around in an eerie, shadowless world.', '550e8400-e29b-41d4-a716-446655440002', 'story', 1),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'Sarah decided to investigate the anomaly by visiting the city''s science district, where the university''s physics department might have answers about this impossible phenomenon.', '550e8400-e29b-41d4-a716-446655440002', 'story', 2),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', 'Instead, Sarah chose to interview witnesses throughout the city, gathering first-hand accounts of when people first noticed their shadows were gone.', '550e8400-e29b-41d4-a716-446655440002', 'story', 2),

-- Lost in Time nodes  
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002', 'Emma discovered the antique pocket watch in her grandmother''s attic. As she wound it, the world around her began to shimmer and blur. When the spinning stopped, she found herself standing in a bustling Victorian London street.', '550e8400-e29b-41d4-a716-446655440003', 'story', 1),
('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', 'Emma decided to explore this Victorian world, marveling at the horse-drawn carriages and gas-lit streets, trying to understand how the watch had transported her through time.', '550e8400-e29b-41d4-a716-446655440003', 'story', 2),

-- Enchanted Forest nodes
('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440003', 'Ten-year-old Lily stumbled upon a hidden path while playing in the woods behind her house. The path seemed to glow with a soft, golden light, and she could hear the faint sound of tinkling bells in the distance.', '550e8400-e29b-41d4-a716-446655440004', 'story', 1);

-- Update stories with root_node_id
UPDATE stories SET root_node_id = '750e8400-e29b-41d4-a716-446655440001' WHERE id = '650e8400-e29b-41d4-a716-446655440001';
UPDATE stories SET root_node_id = '750e8400-e29b-41d4-a716-446655440004' WHERE id = '650e8400-e29b-41d4-a716-446655440002';
UPDATE stories SET root_node_id = '750e8400-e29b-41d4-a716-446655440006' WHERE id = '650e8400-e29b-41d4-a716-446655440003';

-- Insert sample story branches
INSERT INTO story_branches (id, story_id, from_node_id, to_node_id, label, branch_type, impact_score) VALUES
('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002', 'Investigate the science district', 'procedural', 0.75),
('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440003', 'Interview witnesses', 'character-driven', 0.65),
('850e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440005', 'Explore Victorian London', 'character-driven', 0.80);

-- Insert sample characters
INSERT INTO characters (id, story_id, name, traits, description, is_protagonist) VALUES
('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Detective Sarah Martinez', '["determined", "analytical", "intuitive"]', 'A seasoned detective with 15 years of experience solving unusual cases', true),
('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Emma Thompson', '["curious", "brave", "adaptable"]', 'A 16-year-old history enthusiast who discovers time travel', true),
('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'Lily Chen', '["imaginative", "kind", "adventurous"]', 'A young girl who discovers a magical forest', true);

-- Insert sample settings
INSERT INTO settings (id, story_id, name, era, place, mood, description) VALUES
('a50e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Shadow City', 'present-day', 'metropolitan city', 'mysterious', 'A large modern city experiencing an impossible phenomenon'),
('a50e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'Multiple Time Periods', 'various', 'historical locations', 'adventurous', 'Different historical periods connected by time travel'),
('a50e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'The Enchanted Forest', 'timeless', 'magical woodland', 'whimsical', 'A mystical forest filled with magic and wonder');

-- Insert sample prompt templates
INSERT INTO prompt_templates (id, name, category, template_text, parameters, constraints, created_by, effectiveness_score) VALUES
('b50e8400-e29b-41d4-a716-446655440001', 'Character Trait Reversal', 'logical', 'What if {character} acted completely opposite to their {trait} nature when {event}?', '{"required": ["character", "trait", "event"]}', '{"genres": ["any"], "tone": ["any"]}', '550e8400-e29b-41d4-a716-446655440001', 0.85),
('b50e8400-e29b-41d4-a716-446655440002', 'Setting Inversion', 'logical', 'What if the {event} happened in a {opposite_setting} instead of {original_setting}?', '{"required": ["event", "original_setting", "opposite_setting"]}', '{"genres": ["any"], "tone": ["any"]}', '550e8400-e29b-41d4-a716-446655440001', 0.78),
('b50e8400-e29b-41d4-a716-446655440003', 'Consequence Escalation', 'creative', 'What if the {event} caused {unexpected_consequence} that changed everything?', '{"required": ["event", "unexpected_consequence"]}', '{"genres": ["sci-fi", "fantasy", "mystery"], "tone": ["tense", "dramatic"]}', '550e8400-e29b-41d4-a716-446655440001', 0.82),
('b50e8400-e29b-41d4-a716-446655440004', 'Moral Dilemma Creator', 'character-driven', 'What if {character} had to choose between {value1} and {value2} when {conflict_situation}?', '{"required": ["character", "value1", "value2", "conflict_situation"]}', '{"genres": ["drama", "thriller"], "tone": ["tense", "thoughtful"]}', '550e8400-e29b-41d4-a716-446655440001', 0.90);

-- Insert story tags
INSERT INTO story_tags (story_id, tag) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'mystery'),
('650e8400-e29b-41d4-a716-446655440001', 'supernatural'),
('650e8400-e29b-41d4-a716-446655440001', 'detective'),
('650e8400-e29b-41d4-a716-446655440002', 'time-travel'),
('650e8400-e29b-41d4-a716-446655440002', 'adventure'),
('650e8400-e29b-41d4-a716-446655440002', 'historical'),
('650e8400-e29b-41d4-a716-446655440003', 'fantasy'),
('650e8400-e29b-41d4-a716-446655440003', 'magic'),
('650e8400-e29b-41d4-a716-446655440003', 'friendship');

-- Insert sample story collaborators
INSERT INTO story_collaborators (story_id, user_id, role, invited_by) VALUES
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'contributor', '550e8400-e29b-41d4-a716-446655440003');

-- The password for all sample users is 'password123' (hashed with bcrypt)

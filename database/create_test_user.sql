-- Create Test User
-- Run this in Supabase SQL Editor to create a test account

-- Test User Credentials:
-- Username: testuser
-- Email: test@example.com
-- Password: Test1234!@#$
-- Display Name: Test User
-- Subscription Tier: free

INSERT INTO users (username, email, password_hash, display_name, subscription_tier) 
SELECT 
    'testuser',
    'test@example.com',
    '$2a$12$xME5RP/zHX5CZtzxgbNTVux82QRNgBiNW3jxDtgVl3f3ROUwcboBu',
    'Test User',
    'free'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'testuser' OR email = 'test@example.com'
);

-- Verify the user was created
SELECT id, username, email, display_name, subscription_tier, created_at, is_active
FROM users 
WHERE username = 'testuser' OR email = 'test@example.com';


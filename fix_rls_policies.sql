-- ============================================
-- RLS FIX SCRIPT FOR NOSTALGIC REQUESTS
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Enable RLS on dj_profiles (if not already enabled)
ALTER TABLE dj_profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON dj_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON dj_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON dj_profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON dj_profiles;

-- Step 3: Create proper RLS policies for dj_profiles

-- Allow users to SELECT their own profile
CREATE POLICY "Users can view own profile" ON dj_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update own profile" ON dj_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow INSERT (for signup) - service role handles this, but just in case
CREATE POLICY "Users can insert own profile" ON dj_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 4: Verify your profile exists
-- Replace YOUR_USER_ID with your actual auth user ID from Authentication > Users
-- SELECT * FROM dj_profiles WHERE user_id = 'YOUR_USER_ID';

-- Step 5: If your profile is missing, create it manually:
-- INSERT INTO dj_profiles (user_id, email, dj_name)
-- VALUES ('YOUR_USER_ID', 'your@email.com', 'Your DJ Name');

-- ============================================
-- EVENTS TABLE (Optional - if filtering by DJ)
-- ============================================

-- Enable RLS on events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing event policies
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Users can manage own events" ON events;

-- Allow anyone to view events (public portals need this)
CREATE POLICY "Anyone can view events" ON events
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update/delete events
CREATE POLICY "Authenticated users can manage events" ON events
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if your user exists in auth.users
-- SELECT id, email FROM auth.users LIMIT 10;

-- Check if profiles exist
-- SELECT id, user_id, dj_name, email FROM dj_profiles;

-- Check events
-- SELECT id, name, status FROM events;


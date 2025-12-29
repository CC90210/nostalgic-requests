-- DJ Profiles table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS dj_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  dj_name TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  bio TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add dj_id to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS dj_id UUID REFERENCES dj_profiles(id);

-- Enable RLS
ALTER TABLE dj_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON dj_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON dj_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON dj_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only see their own events
DROP POLICY IF EXISTS "Allow all operations on events" ON events;
CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (
    dj_id IN (SELECT id FROM dj_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own events" ON events
  FOR INSERT WITH CHECK (
    dj_id IN (SELECT id FROM dj_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (
    dj_id IN (SELECT id FROM dj_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own events" ON events
  FOR DELETE USING (
    dj_id IN (SELECT id FROM dj_profiles WHERE user_id = auth.uid())
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_dj_profiles_user_id ON dj_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_events_dj_id ON events(dj_id);

-- 1. Add user_id to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Add Unique Constraint for Upsert (Per DJ, One Lead per Phone)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_phone_key; -- Drop old global uniqueness if exists
CREATE UNIQUE INDEX IF NOT EXISTS leads_user_phone_key ON leads(user_id, phone);

-- 3. Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Policies

-- EVENTS
DROP POLICY IF EXISTS "Users view own events" ON events;
CREATE POLICY "Users view own events" ON events FOR ALL USING (auth.uid() = user_id);

-- REQUESTS
DROP POLICY IF EXISTS "DJ views own requests" ON requests;
CREATE POLICY "DJ views own requests" ON requests FOR ALL USING (
  exists (select 1 from events where events.id = requests.event_id and events.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Public insert requests" ON requests;
CREATE POLICY "Public insert requests" ON requests FOR INSERT WITH CHECK (true);

-- LEADS
DROP POLICY IF EXISTS "DJ views own leads" ON leads;
CREATE POLICY "DJ views own leads" ON leads FOR ALL USING (auth.uid() = user_id);

-- PROFILES
DROP POLICY IF EXISTS "DJ views own profile" ON dj_profiles;
CREATE POLICY "DJ views own profile" ON dj_profiles FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public view profiles" ON dj_profiles;
CREATE POLICY "Public view profiles" ON dj_profiles FOR SELECT USING (true);

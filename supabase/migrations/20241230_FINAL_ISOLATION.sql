-- FINAL SECURITY LOCKDOWN: DROP EVERYTHING AND ISOLATE
-- Run this in Supabase SQL Editor immediately.

BEGIN;

-- 1. FORCE RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events FORCE ROW LEVEL SECURITY;

-- 2. NUCLEAR OPTION: Drop ALL existing policies on events to prevent "Unknown Policy" leaks
-- We cannot loop efficiently in simple SQL script without DO block, but we can drop known suspects.
DROP POLICY IF EXISTS "Users can only view their own events" ON events;
DROP POLICY IF EXISTS "Users view own events" ON events;
DROP POLICY IF EXISTS "Admin view all" ON events; -- Hypothetical bad policy
DROP POLICY IF EXISTS "Public view events" ON events;
DROP POLICY IF EXISTS "Enable read access for all users" ON events;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON events;
DROP POLICY IF EXISTS "Enable update for users based on email" ON events;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON events;

-- 3. APPLY STRICT ISOLATION (No Admin Exception)
-- SELECT
CREATE POLICY "Strict_Isolation_Select"
ON events FOR SELECT
USING (user_id = auth.uid());

-- INSERT
CREATE POLICY "Strict_Isolation_Insert"
ON events FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE
CREATE POLICY "Strict_Isolation_Update"
ON events FOR UPDATE
USING (user_id = auth.uid());

-- DELETE
CREATE POLICY "Strict_Isolation_Delete"
ON events FOR DELETE
USING (user_id = auth.uid());

COMMIT;

-- 4. VERIFY NO "VIEW ALL"
-- After running this, select count(*) from events; as konamak should return ONLY their created events.

-- CRITICAL SECURITY FIX: STRICT EVENTS ISOLATION
-- Run this script in your Supabase SQL Editor

-- 1. Enable RLS and Force it (Applies to Table Owner too)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events FORCE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Users view own events" ON events;
DROP POLICY IF EXISTS "Users can only view their own events" ON events;
DROP POLICY IF EXISTS "Users can only insert their own events" ON events;
DROP POLICY IF EXISTS "Users can only update their own events" ON events;
DROP POLICY IF EXISTS "Users can only delete their own events" ON events;
DROP POLICY IF EXISTS "Enable read access for all users" ON events;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON events;

-- 3. Create STRICT Isolation Policies

-- SELECT
CREATE POLICY "Users can only view their own events"
ON events FOR SELECT
USING (user_id = auth.uid());

-- INSERT
CREATE POLICY "Users can only insert their own events"
ON events FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE
CREATE POLICY "Users can only update their own events"
ON events FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE
CREATE POLICY "Users can only delete their own events"
ON events FOR DELETE
USING (user_id = auth.uid());

-- 4. Audit: Check for Orphaned Events (Events with NULL user_id)
-- If this query returns rows, you have data integrity issues.
-- You should manually assign them or delete them.
/* 
SELECT * FROM events WHERE user_id IS NULL;
*/

-- Optional: Delete orphaned events automatically (Uncomment if desired)
-- DELETE FROM events WHERE user_id IS NULL;

-- 5. Add NOT NULL constraint to ensure future integrity
-- This will fail if there are existing NULLs, forcing you to fix them first.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM events WHERE user_id IS NOT NULL) THEN
        ALTER TABLE events ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

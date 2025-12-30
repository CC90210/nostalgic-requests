-- Add venue_address to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_address TEXT;

-- Performance Indices for Nostalgic Requests

-- 1. Requests: Heavily queried by event_id (Dashboard) and stripe_payment_id (Webhook)
CREATE INDEX IF NOT EXISTS idx_requests_event_id ON requests(event_id);
CREATE INDEX IF NOT EXISTS idx_requests_stripe_payment_id ON requests(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_requests_status_is_paid ON requests(status, is_paid);

-- 2. Events: Queried by user_id (My Events) and unique_slug (Public Portal)
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_unique_slug ON events(unique_slug);

-- 3. Leads: Queried by user_id
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

-- 4. Sorting optimizations (Recent items first)
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time DESC);

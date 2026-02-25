CREATE INDEX IF NOT EXISTS idx_requests_event_id_is_paid ON requests(event_id, is_paid);
CREATE INDEX IF NOT EXISTS idx_requests_event_id_status ON requests(event_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_user_id_phone ON leads(user_id, phone);

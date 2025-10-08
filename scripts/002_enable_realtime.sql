-- Enable realtime for the tables we need
ALTER PUBLICATION supabase_realtime ADD TABLE drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drivers_online ON drivers(is_online) WHERE status = 'verified';
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

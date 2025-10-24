-- ================================================
-- NOTIFICATIONS SYSTEM - SAFE MIGRATION
-- ================================================
-- Add user_notifications table for tracking read/unread status
-- ================================================

-- Create user_notifications junction table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, announcement_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_announcement ON user_notifications(announcement_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;

-- RLS Policies
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON user_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON user_notifications;

CREATE POLICY "Users can view own notifications"
  ON user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON user_notifications FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON user_notifications TO authenticated;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_announcement_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO user_notifications (user_id, announcement_id, is_read, read_at)
  VALUES (auth.uid(), p_announcement_id, TRUE, NOW())
  ON CONFLICT (user_id, announcement_id)
  DO UPDATE SET
    is_read = TRUE,
    read_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Get count of announcements that user hasn't read
  SELECT COUNT(DISTINCT a.id)
  INTO v_count
  FROM announcements a
  LEFT JOIN user_notifications un ON un.announcement_id = a.id AND un.user_id = auth.uid()
  WHERE 
    (a.school_id IS NULL OR a.school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    ))
    AND (un.id IS NULL OR un.is_read = FALSE)
    AND a.created_at >= NOW() - INTERVAL '30 days'; -- Only announcements from last 30 days
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notifications_count() TO authenticated;

-- Verification
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'user_notifications'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Notifications system migration completed successfully!';
  RAISE NOTICE '✅ Table created: user_notifications';
  RAISE NOTICE '✅ Functions created: mark_notification_read(), get_unread_notifications_count()';
  RAISE NOTICE '✅ RLS policies and indexes created';
END $$;

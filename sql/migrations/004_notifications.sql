-- Real-time Notifications Table
-- Run this migration after 003_qr_attendance.sql

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('announcement', 'grade', 'attendance', 'assignment')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recipient_ids UUID[] NOT NULL, -- Array of user IDs who should receive this
  data JSONB, -- Additional data for the notification
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipients ON notifications USING GIN(recipient_ids);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Grant permissions
GRANT ALL ON notifications TO authenticated;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view notifications intended for them
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(recipient_ids));

-- Teachers and admins can create notifications
CREATE POLICY "Teachers and admins can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
        AND role IN ('Admin', 'Guru', 'Kepala Sekolah', 'Kepala Yayasan')
    )
  );

-- Users can mark their own notifications as read
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = ANY(recipient_ids))
  WITH CHECK (auth.uid() = ANY(recipient_ids));

-- Function to create notification for all users in a school
CREATE OR REPLACE FUNCTION create_school_notification(
  p_school_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipient_ids UUID[];
  v_notification_id UUID;
BEGIN
  -- Get all user IDs in the school
  SELECT ARRAY_AGG(id) INTO v_recipient_ids
  FROM profiles
  WHERE school_id = p_school_id;

  -- Create notification
  INSERT INTO notifications (type, title, message, recipient_ids, data)
  VALUES (p_type, p_title, p_message, v_recipient_ids, p_data)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Function to create notification for students in a class
CREATE OR REPLACE FUNCTION create_class_notification(
  p_class_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipient_ids UUID[];
  v_notification_id UUID;
BEGIN
  -- Get all student IDs in the class
  SELECT ARRAY_AGG(profile_id) INTO v_recipient_ids
  FROM class_members
  WHERE class_id = p_class_id AND role = 'student';

  -- Create notification
  INSERT INTO notifications (type, title, message, recipient_ids, data)
  VALUES (p_type, p_title, p_message, v_recipient_ids, p_data)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_school_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_class_notification TO authenticated;

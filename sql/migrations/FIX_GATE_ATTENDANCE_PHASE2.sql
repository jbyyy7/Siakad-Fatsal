-- ================================================
-- FIX GATE ATTENDANCE PHASE 2 - SAFE MIGRATION
-- ================================================
-- This file fixes all errors from PHASE2 migration
-- Run this AFTER running FIX_GATE_ATTENDANCE_FUNCTIONS.sql
-- ================================================

-- ================================================
-- 1. FIX PARENT_CONTACTS TABLE
-- ================================================

-- Drop old table if exists with wrong references
DROP TABLE IF EXISTS parent_contacts CASCADE;

-- Create corrected parent_contacts table
CREATE TABLE IF NOT EXISTS parent_contacts (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_name TEXT NOT NULL,
  relationship TEXT CHECK (relationship IN ('Father', 'Mother', 'Guardian')),
  phone_number TEXT NOT NULL,
  email TEXT,
  whatsapp_number TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick student lookup
CREATE INDEX IF NOT EXISTS idx_parent_contacts_student ON parent_contacts(student_id);

-- RLS Policies for parent_contacts
ALTER TABLE parent_contacts ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Students can view own parent contacts" ON parent_contacts;
DROP POLICY IF EXISTS "Admin can manage all parent contacts" ON parent_contacts;
DROP POLICY IF EXISTS "Staff can manage parent contacts in their school" ON parent_contacts;

-- Students can view own parent contacts
CREATE POLICY "Students can view own parent contacts"
  ON parent_contacts FOR SELECT
  USING (auth.uid() = student_id);

-- Admin can manage all parent contacts
CREATE POLICY "Admin can manage all parent contacts"
  ON parent_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Staff can manage parent contacts in their school
CREATE POLICY "Staff can manage parent contacts in their school"
  ON parent_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.school_id = p2.school_id
      WHERE p1.id = auth.uid()
      AND p1.role IN ('Staff', 'Kepala Sekolah')
      AND p2.id = parent_contacts.student_id
    )
  );


-- ================================================
-- 2. FIX GATE_ATTENDANCE_NOTIFICATIONS TABLE
-- ================================================

-- Drop old table if exists
DROP TABLE IF EXISTS gate_attendance_notifications CASCADE;

-- Create corrected notifications table
CREATE TABLE IF NOT EXISTS gate_attendance_notifications (
  id SERIAL PRIMARY KEY,
  gate_attendance_id BIGINT REFERENCES gate_attendance(id) ON DELETE CASCADE,
  recipient_type TEXT CHECK (recipient_type IN ('Parent', 'Teacher', 'Admin')),
  recipient_id UUID REFERENCES profiles(id),
  notification_type TEXT CHECK (notification_type IN ('CheckIn', 'CheckOut', 'LateArrival')),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT CHECK (delivery_status IN ('Pending', 'Sent', 'Failed')) DEFAULT 'Pending',
  delivery_method TEXT CHECK (delivery_method IN ('InApp', 'WhatsApp', 'Email')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_gate_notifications_attendance ON gate_attendance_notifications(gate_attendance_id);
CREATE INDEX IF NOT EXISTS idx_gate_notifications_recipient ON gate_attendance_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gate_notifications_status ON gate_attendance_notifications(delivery_status);

-- RLS for notifications
ALTER TABLE gate_attendance_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Recipients can view own gate notifications" ON gate_attendance_notifications;
DROP POLICY IF EXISTS "Admin can view all gate notifications" ON gate_attendance_notifications;

-- Recipients can view their own notifications
CREATE POLICY "Recipients can view own gate notifications"
  ON gate_attendance_notifications FOR SELECT
  USING (auth.uid() = recipient_id);

-- Admin can view all notifications
CREATE POLICY "Admin can view all gate notifications"
  ON gate_attendance_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Admin', 'Kepala Yayasan')
    )
  );


-- ================================================
-- 3. ADD MISSING COLUMNS TO GATE_ATTENDANCE
-- ================================================

-- Add late arrival tracking
ALTER TABLE gate_attendance ADD COLUMN IF NOT EXISTS late_arrival BOOLEAN DEFAULT FALSE;
ALTER TABLE gate_attendance ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;

-- Add index for late arrivals
CREATE INDEX IF NOT EXISTS idx_gate_attendance_late ON gate_attendance(late_arrival);


-- ================================================
-- 4. ADD TIME RULES TO SCHOOLS TABLE
-- ================================================

-- Add attendance time rules columns
ALTER TABLE schools ADD COLUMN IF NOT EXISTS gate_check_in_start TIME DEFAULT '05:00:00';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS gate_check_in_end TIME DEFAULT '23:59:59';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS gate_late_threshold TIME DEFAULT '07:30:00';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS gate_check_out_start TIME DEFAULT '05:00:00';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS gate_check_out_end TIME DEFAULT '23:59:59';

-- Add notification settings
ALTER TABLE schools ADD COLUMN IF NOT EXISTS gate_notify_parents BOOLEAN DEFAULT TRUE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS gate_notify_on_late BOOLEAN DEFAULT TRUE;


-- ================================================
-- 5. CREATE/REPLACE CALCULATE LATE ARRIVAL FUNCTION
-- ================================================

DROP FUNCTION IF EXISTS calculate_late_arrival() CASCADE;

CREATE OR REPLACE FUNCTION calculate_late_arrival()
RETURNS TRIGGER AS $$
DECLARE
  school_late_threshold TIME;
  check_in_time_only TIME;
  late_mins INTEGER;
BEGIN
  -- Only process when check_in_time is set
  IF NEW.check_in_time IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get school's late threshold
  SELECT gate_late_threshold INTO school_late_threshold
  FROM schools
  WHERE id = NEW.school_id;

  -- Extract time only from check_in_time
  check_in_time_only := NEW.check_in_time::TIME;

  -- Calculate if late
  IF check_in_time_only > school_late_threshold THEN
    NEW.late_arrival := TRUE;
    
    -- Calculate late minutes
    late_mins := EXTRACT(EPOCH FROM (check_in_time_only - school_late_threshold)) / 60;
    NEW.late_minutes := late_mins;
  ELSE
    NEW.late_arrival := FALSE;
    NEW.late_minutes := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for late arrival calculation
DROP TRIGGER IF EXISTS trg_calculate_late_arrival ON gate_attendance;
CREATE TRIGGER trg_calculate_late_arrival
  BEFORE INSERT OR UPDATE OF check_in_time ON gate_attendance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_late_arrival();


-- ================================================
-- 6. GRANT PERMISSIONS
-- ================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON parent_contacts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE parent_contacts_id_seq TO authenticated;

GRANT SELECT, INSERT, UPDATE ON gate_attendance_notifications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE gate_attendance_notifications_id_seq TO authenticated;

GRANT EXECUTE ON FUNCTION calculate_late_arrival() TO authenticated;


-- ================================================
-- VERIFICATION
-- ================================================

-- Check parent_contacts table
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'parent_contacts'
ORDER BY ordinal_position;

-- Check gate_attendance_notifications table
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'gate_attendance_notifications'
ORDER BY ordinal_position;

-- Check new columns in gate_attendance
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'gate_attendance'
AND column_name IN ('late_arrival', 'late_minutes')
ORDER BY ordinal_position;

-- Check new columns in schools
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'schools'
AND column_name LIKE 'gate_%'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Gate Attendance Phase 2 fixes completed successfully!';
  RAISE NOTICE '✅ Tables created: parent_contacts, gate_attendance_notifications';
  RAISE NOTICE '✅ Columns added to: gate_attendance, schools';
  RAISE NOTICE '✅ Functions created: calculate_late_arrival()';
END $$;

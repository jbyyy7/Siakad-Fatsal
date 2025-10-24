-- ================================================
-- GATE ATTENDANCE SYSTEM - PHASE 2 MIGRATION
-- ================================================
-- Features: Late Arrival Tracking, Time Rules, Notifications, Analytics
-- Date: 2024-10-24
-- ================================================

-- ================================================
-- 1. ADD LATE ARRIVAL TRACKING
-- ================================================

-- Add late_arrival column to gate_attendance
ALTER TABLE gate_attendance ADD COLUMN IF NOT EXISTS late_arrival BOOLEAN DEFAULT FALSE;

-- Add late_minutes column to track how many minutes late
ALTER TABLE gate_attendance ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;

-- Add index for late arrivals
CREATE INDEX IF NOT EXISTS idx_gate_attendance_late ON gate_attendance(late_arrival);

-- ================================================
-- 2. ADD TIME RULES TO SCHOOLS TABLE
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
-- 3. CREATE PARENT CONTACT TABLE (if not exists)
-- ================================================

CREATE TABLE IF NOT EXISTS parent_contacts (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view own parent contacts" ON parent_contacts;
DROP POLICY IF EXISTS "Admin can manage all parent contacts" ON parent_contacts;

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
CREATE POLICY IF NOT EXISTS "Staff can manage parent contacts in their school"
  ON parent_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Staff'
      AND profiles.school_id = (
        SELECT school_id FROM profiles WHERE id = parent_contacts.student_id
      )
    )
  );

-- ================================================
-- 4. CREATE GATE ATTENDANCE NOTIFICATIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS gate_attendance_notifications (
  id SERIAL PRIMARY KEY,
  gate_attendance_id INTEGER REFERENCES gate_attendance(id) ON DELETE CASCADE,
  recipient_type TEXT CHECK (recipient_type IN ('Parent', 'Teacher', 'Admin')),
  recipient_id UUID REFERENCES auth.users(id),
  notification_type TEXT CHECK (notification_type IN ('CheckIn', 'CheckOut', 'LateArrival')),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT CHECK (delivery_status IN ('Pending', 'Sent', 'Failed')) DEFAULT 'Pending',
  delivery_method TEXT CHECK (delivery_method IN ('InApp', 'WhatsApp', 'Email')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for notifications
CREATE INDEX IF NOT EXISTS idx_gate_notifications_attendance ON gate_attendance_notifications(gate_attendance_id);
CREATE INDEX IF NOT EXISTS idx_gate_notifications_recipient ON gate_attendance_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gate_notifications_status ON gate_attendance_notifications(delivery_status);

-- RLS for notifications
ALTER TABLE gate_attendance_notifications ENABLE ROW LEVEL SECURITY;

-- Recipients can view their own notifications
CREATE POLICY IF NOT EXISTS "Recipients can view own gate notifications"
  ON gate_attendance_notifications FOR SELECT
  USING (auth.uid() = recipient_id);

-- Admin can view all notifications
CREATE POLICY IF NOT EXISTS "Admin can view all gate notifications"
  ON gate_attendance_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Admin', 'Kepala Yayasan')
    )
  );

-- ================================================
-- 5. FUNCTION: CALCULATE LATE ARRIVAL
-- ================================================

CREATE OR REPLACE FUNCTION calculate_late_arrival()
RETURNS TRIGGER AS $$
DECLARE
  school_late_threshold TIME;
  check_in_time_only TIME;
  late_mins INTEGER;
BEGIN
  -- Get school's late threshold
  SELECT gate_late_threshold INTO school_late_threshold
  FROM schools
  WHERE id = NEW.school_id;

  -- If no threshold set, use default 07:30
  IF school_late_threshold IS NULL THEN
    school_late_threshold := '07:30:00'::TIME;
  END IF;

  -- Extract time only from check_in_time
  check_in_time_only := NEW.check_in_time::TIME;

  -- Check if late
  IF check_in_time_only > school_late_threshold THEN
    NEW.late_arrival := TRUE;
    
    -- Calculate minutes late
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
DROP TRIGGER IF EXISTS trigger_calculate_late_arrival ON gate_attendance;
CREATE TRIGGER trigger_calculate_late_arrival
  BEFORE INSERT OR UPDATE OF check_in_time ON gate_attendance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_late_arrival();

-- ================================================
-- 6. FUNCTION: AUTO-CREATE NOTIFICATION ON CHECK-IN/OUT
-- ================================================

CREATE OR REPLACE FUNCTION create_gate_attendance_notification()
RETURNS TRIGGER AS $$
DECLARE
  student_name TEXT;
  school_name TEXT;
  notify_parents BOOLEAN;
  notify_on_late BOOLEAN;
  parent_record RECORD;
  notification_msg TEXT;
  notif_type TEXT;
BEGIN
  -- Get school notification settings
  SELECT 
    s.name,
    s.gate_notify_parents,
    s.gate_notify_on_late
  INTO 
    school_name,
    notify_parents,
    notify_on_late
  FROM schools s
  WHERE s.id = NEW.school_id;

  -- Get student name
  SELECT full_name INTO student_name
  FROM profiles
  WHERE id = NEW.student_id;

  -- Check if this is a check-in (INSERT or UPDATE with check_in_time)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.check_in_time IS NULL AND NEW.check_in_time IS NOT NULL) THEN
    
    -- Check if late arrival notification needed
    IF NEW.late_arrival AND notify_on_late THEN
      notif_type := 'LateArrival';
      notification_msg := student_name || ' terlambat check-in ' || NEW.late_minutes || ' menit di ' || school_name || ' pada ' || 
                         to_char(NEW.check_in_time, 'HH24:MI');
    ELSIF notify_parents THEN
      notif_type := 'CheckIn';
      notification_msg := student_name || ' telah check-in di ' || school_name || ' pada ' || 
                         to_char(NEW.check_in_time, 'HH24:MI');
    ELSE
      RETURN NEW;
    END IF;

  -- Check if this is a check-out (UPDATE with check_out_time)
  ELSIF TG_OP = 'UPDATE' AND OLD.check_out_time IS NULL AND NEW.check_out_time IS NOT NULL THEN
    
    IF notify_parents THEN
      notif_type := 'CheckOut';
      notification_msg := student_name || ' telah check-out dari ' || school_name || ' pada ' || 
                         to_char(NEW.check_out_time, 'HH24:MI');
    ELSE
      RETURN NEW;
    END IF;
    
  ELSE
    RETURN NEW;
  END IF;

  -- Create notifications for all parents
  FOR parent_record IN 
    SELECT * FROM parent_contacts WHERE student_id = NEW.student_id
  LOOP
    INSERT INTO gate_attendance_notifications (
      gate_attendance_id,
      recipient_type,
      recipient_id,
      notification_type,
      message,
      delivery_status,
      delivery_method
    ) VALUES (
      NEW.id,
      'Parent',
      NEW.student_id, -- We'll use student_id as recipient for now
      notif_type,
      notification_msg,
      'Pending',
      'InApp'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-notification
DROP TRIGGER IF EXISTS trigger_create_gate_notification ON gate_attendance;
CREATE TRIGGER trigger_create_gate_notification
  AFTER INSERT OR UPDATE ON gate_attendance
  FOR EACH ROW
  EXECUTE FUNCTION create_gate_attendance_notification();

-- ================================================
-- 7. FUNCTION: GET GATE ATTENDANCE ANALYTICS
-- ================================================

CREATE OR REPLACE FUNCTION get_gate_attendance_analytics(
  school_id_param UUID,
  start_date_param DATE,
  end_date_param DATE
) RETURNS TABLE (
  date DATE,
  total_students BIGINT,
  present_count BIGINT,
  absent_count BIGINT,
  late_count BIGINT,
  on_time_count BIGINT,
  average_check_in_time TIME,
  average_check_out_time TIME,
  late_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(start_date_param, end_date_param, '1 day'::interval)::DATE AS date
  ),
  daily_stats AS (
    SELECT 
      ga.date,
      COUNT(DISTINCT p.id) AS total_students_on_date,
      COUNT(ga.id) AS present,
      COUNT(CASE WHEN ga.late_arrival THEN 1 END) AS late,
      COUNT(CASE WHEN NOT ga.late_arrival THEN 1 END) AS on_time,
      AVG(EXTRACT(EPOCH FROM ga.check_in_time::TIME)) AS avg_check_in_seconds,
      AVG(EXTRACT(EPOCH FROM ga.check_out_time::TIME)) AS avg_check_out_seconds
    FROM date_series ds
    LEFT JOIN gate_attendance ga ON ga.date = ds.date
      AND (school_id_param IS NULL OR ga.school_id = school_id_param)
    LEFT JOIN profiles p ON p.role = 'Siswa'
      AND (school_id_param IS NULL OR p.school_id = school_id_param)
    GROUP BY ga.date
  )
  SELECT 
    ds.date,
    COALESCE(dst.total_students_on_date, 0) AS total_students,
    COALESCE(dst.present, 0) AS present_count,
    COALESCE(dst.total_students_on_date - dst.present, 0) AS absent_count,
    COALESCE(dst.late, 0) AS late_count,
    COALESCE(dst.on_time, 0) AS on_time_count,
    CASE 
      WHEN dst.avg_check_in_seconds IS NOT NULL THEN
        (INTERVAL '1 second' * dst.avg_check_in_seconds)::TIME
      ELSE NULL
    END AS average_check_in_time,
    CASE 
      WHEN dst.avg_check_out_seconds IS NOT NULL THEN
        (INTERVAL '1 second' * dst.avg_check_out_seconds)::TIME
      ELSE NULL
    END AS average_check_out_time,
    CASE 
      WHEN dst.present > 0 THEN
        ROUND((dst.late::NUMERIC / dst.present::NUMERIC) * 100, 2)
      ELSE 0
    END AS late_percentage
  FROM date_series ds
  LEFT JOIN daily_stats dst ON dst.date = ds.date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 8. FUNCTION: GET LATE ARRIVAL REPORT
-- ================================================

CREATE OR REPLACE FUNCTION get_late_arrival_report(
  school_id_param UUID,
  start_date_param DATE,
  end_date_param DATE
) RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  identity_number TEXT,
  total_days INTEGER,
  late_days INTEGER,
  late_percentage NUMERIC,
  average_late_minutes NUMERIC,
  max_late_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS student_id,
    p.full_name AS student_name,
    p.identity_number,
    COUNT(ga.id)::INTEGER AS total_days,
    COUNT(CASE WHEN ga.late_arrival THEN 1 END)::INTEGER AS late_days,
    CASE 
      WHEN COUNT(ga.id) > 0 THEN
        ROUND((COUNT(CASE WHEN ga.late_arrival THEN 1 END)::NUMERIC / COUNT(ga.id)::NUMERIC) * 100, 2)
      ELSE 0
    END AS late_percentage,
    ROUND(AVG(CASE WHEN ga.late_arrival THEN ga.late_minutes ELSE 0 END), 2) AS average_late_minutes,
    MAX(ga.late_minutes) AS max_late_minutes
  FROM profiles p
  LEFT JOIN gate_attendance ga ON ga.student_id = p.id
    AND ga.date BETWEEN start_date_param AND end_date_param
    AND (school_id_param IS NULL OR ga.school_id = school_id_param)
  WHERE p.role = 'Siswa'
    AND (school_id_param IS NULL OR p.school_id = school_id_param)
  GROUP BY p.id, p.full_name, p.identity_number
  HAVING COUNT(ga.id) > 0
  ORDER BY late_percentage DESC, late_days DESC;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 9. UPDATE GATE ATTENDANCE SUMMARY FUNCTION
-- ================================================

DROP FUNCTION IF EXISTS get_gate_attendance_summary(UUID, DATE);

CREATE OR REPLACE FUNCTION get_gate_attendance_summary(
  school_id_param UUID,
  date_param DATE
) RETURNS TABLE (
  total_students BIGINT,
  checked_in BIGINT,
  inside_now BIGINT,
  checked_out BIGINT,
  not_arrived BIGINT,
  late_arrivals BIGINT,
  on_time_arrivals BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH student_count AS (
    SELECT COUNT(*) AS total
    FROM profiles
    WHERE role = 'Siswa'
    AND (school_id_param IS NULL OR school_id = school_id_param)
  ),
  attendance_stats AS (
    SELECT 
      COUNT(*) AS checked_in_count,
      COUNT(CASE WHEN status = 'inside_school' THEN 1 END) AS inside_count,
      COUNT(CASE WHEN status = 'outside_school' THEN 1 END) AS checked_out_count,
      COUNT(CASE WHEN late_arrival = TRUE THEN 1 END) AS late_count,
      COUNT(CASE WHEN late_arrival = FALSE THEN 1 END) AS on_time_count
    FROM gate_attendance
    WHERE date = date_param
    AND (school_id_param IS NULL OR school_id = school_id_param)
  )
  SELECT 
    sc.total AS total_students,
    COALESCE(ast.checked_in_count, 0) AS checked_in,
    COALESCE(ast.inside_count, 0) AS inside_now,
    COALESCE(ast.checked_out_count, 0) AS checked_out,
    (sc.total - COALESCE(ast.checked_in_count, 0)) AS not_arrived,
    COALESCE(ast.late_count, 0) AS late_arrivals,
    COALESCE(ast.on_time_count, 0) AS on_time_arrivals
  FROM student_count sc, attendance_stats ast;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 10. GRANT PERMISSIONS
-- ================================================

GRANT SELECT, INSERT, UPDATE ON gate_attendance_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON parent_contacts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE gate_attendance_notifications_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE parent_contacts_id_seq TO authenticated;

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION get_gate_attendance_analytics(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_late_arrival_report(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_gate_attendance_summary(UUID, DATE) TO authenticated;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
-- Phase 2 features now available:
-- ✅ Late arrival tracking (auto-calculated)
-- ✅ Time rules per school
-- ✅ Parent contact management
-- ✅ Auto-notifications on check-in/out
-- ✅ Analytics functions
-- ✅ Late arrival reports
-- ================================================

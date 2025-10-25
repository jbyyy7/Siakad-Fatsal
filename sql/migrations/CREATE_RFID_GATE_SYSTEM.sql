-- =====================================================
-- RFID GATE ATTENDANCE SYSTEM - COMPLETE DATABASE SETUP
-- =====================================================
-- This migration creates all database components for RFID-based gate attendance
-- Features:
--   1. RFID Card Management (assign, block, track)
--   2. Gate Device Registry
--   3. Enhanced Gate Attendance with card tracking
--   4. PostgreSQL functions for tap recording
--   5. Real-time monitoring capabilities
-- ============================0=========================

-- ============================
-- 1. CREATE RFID CARDS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS rfid_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_uid VARCHAR(20) UNIQUE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'lost', 'expired')),
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ,
  total_taps INTEGER DEFAULT 0,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast card lookup during tap
CREATE INDEX IF NOT EXISTS idx_rfid_cards_card_uid ON rfid_cards(card_uid);
CREATE INDEX IF NOT EXISTS idx_rfid_cards_student_id ON rfid_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_rfid_cards_school_id ON rfid_cards(school_id);
CREATE INDEX IF NOT EXISTS idx_rfid_cards_status ON rfid_cards(status);

-- ============================
-- 2. CREATE GATE DEVICES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS gate_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id VARCHAR(50) UNIQUE NOT NULL,
  device_name VARCHAR(100) NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  location_description TEXT, -- e.g., "Gerbang Utama", "Gerbang Belakang"
  device_type VARCHAR(20) DEFAULT 'rfid_reader' CHECK (device_type IN ('rfid_reader', 'nfc_phone', 'qr_scanner')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_heartbeat TIMESTAMPTZ,
  firmware_version VARCHAR(20),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gate_devices_school_id ON gate_devices(school_id);
CREATE INDEX IF NOT EXISTS idx_gate_devices_device_id ON gate_devices(device_id);

-- ===============================================
-- 3. CREATE GATE_ATTENDANCES TABLE
-- ===============================================
-- Create table if not exists (for RFID gate attendance tracking)
CREATE TABLE IF NOT EXISTS gate_attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  card_uid VARCHAR(20),
  gate_device_id VARCHAR(50),
  tap_method VARCHAR(20) DEFAULT 'rfid' CHECK (tap_method IN ('rfid', 'nfc', 'qr', 'manual')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date, school_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gate_attendances_student_id ON gate_attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_gate_attendances_school_id ON gate_attendances(school_id);
CREATE INDEX IF NOT EXISTS idx_gate_attendances_date ON gate_attendances(date);
CREATE INDEX IF NOT EXISTS idx_gate_attendances_card_uid ON gate_attendances(card_uid);
CREATE INDEX IF NOT EXISTS idx_gate_attendances_gate_device_id ON gate_attendances(gate_device_id);

-- ============================
-- 4. CREATE TAP HISTORY TABLE
-- ============================
-- Comprehensive logging of all tap events (successful and failed)
CREATE TABLE IF NOT EXISTS gate_tap_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_uid VARCHAR(20) NOT NULL,
  gate_device_id VARCHAR(50) NOT NULL,
  student_id UUID,
  tap_time TIMESTAMPTZ DEFAULT NOW(),
  tap_type VARCHAR(20), -- 'check_in', 'check_out', 'unknown'
  success BOOLEAN DEFAULT false,
  failure_reason TEXT, -- e.g., "Card blocked", "Card not registered", "Already checked in"
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gate_tap_logs_card_uid ON gate_tap_logs(card_uid);
CREATE INDEX IF NOT EXISTS idx_gate_tap_logs_student_id ON gate_tap_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_gate_tap_logs_tap_time ON gate_tap_logs(tap_time);
CREATE INDEX IF NOT EXISTS idx_gate_tap_logs_school_id_tap_time ON gate_tap_logs(school_id, tap_time DESC);

-- ===============================================
-- 5. FUNCTION: Record Gate Tap (Main Entry Point)
-- ===============================================
-- This function is called by ESP32/NFC devices when a card is tapped
CREATE OR REPLACE FUNCTION record_gate_tap(
  p_card_uid VARCHAR(20),
  p_gate_device_id VARCHAR(50),
  p_school_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_card_record RECORD;
  v_student_record RECORD;
  v_today_attendance RECORD;
  v_tap_type VARCHAR(20);
  v_attendance_id UUID;
  v_result JSON;
BEGIN
  -- 1. Check if card exists and is active
  SELECT * INTO v_card_record 
  FROM rfid_cards 
  WHERE card_uid = p_card_uid;

  IF NOT FOUND THEN
    -- Log failed tap
    INSERT INTO gate_tap_logs (card_uid, gate_device_id, success, failure_reason, school_id)
    VALUES (p_card_uid, p_gate_device_id, false, 'Card not registered', p_school_id);
    
    RETURN json_build_object(
      'success', false,
      'message', 'Kartu tidak terdaftar',
      'error_code', 'CARD_NOT_FOUND'
    );
  END IF;

  -- 2. Check card status
  IF v_card_record.status != 'active' THEN
    INSERT INTO gate_tap_logs (card_uid, gate_device_id, student_id, success, failure_reason, school_id)
    VALUES (p_card_uid, p_gate_device_id, v_card_record.student_id, false, 
            'Card status: ' || v_card_record.status, p_school_id);
    
    RETURN json_build_object(
      'success', false,
      'message', 'Kartu ' || v_card_record.status || '. Hubungi admin.',
      'error_code', 'CARD_' || UPPER(v_card_record.status)
    );
  END IF;

  -- 3. Check if student exists
  SELECT * INTO v_student_record 
  FROM profiles 
  WHERE id = v_card_record.student_id;

  IF NOT FOUND THEN
    INSERT INTO gate_tap_logs (card_uid, gate_device_id, success, failure_reason, school_id)
    VALUES (p_card_uid, p_gate_device_id, false, 'Student not found', p_school_id);
    
    RETURN json_build_object(
      'success', false,
      'message', 'Siswa tidak ditemukan',
      'error_code', 'STUDENT_NOT_FOUND'
    );
  END IF;

  -- 4. Check today's attendance record
  SELECT * INTO v_today_attendance 
  FROM gate_attendances 
  WHERE student_id = v_card_record.student_id 
    AND date = CURRENT_DATE
    AND (p_school_id IS NULL OR school_id = p_school_id)
  LIMIT 1;

  -- 5. Determine tap type (check-in or check-out)
  IF NOT FOUND OR v_today_attendance.check_in_time IS NULL THEN
    v_tap_type := 'check_in';
  ELSIF v_today_attendance.check_out_time IS NULL THEN
    v_tap_type := 'check_out';
  ELSE
    -- Already checked in and out today
    INSERT INTO gate_tap_logs (card_uid, gate_device_id, student_id, tap_type, success, failure_reason, school_id)
    VALUES (p_card_uid, p_gate_device_id, v_card_record.student_id, 'duplicate', false, 
            'Already checked in and out today', p_school_id);
    
    RETURN json_build_object(
      'success', false,
      'message', 'Anda sudah check-in dan check-out hari ini',
      'error_code', 'ALREADY_COMPLETED',
      'student_name', v_student_record.full_name,
      'check_in_time', v_today_attendance.check_in_time,
      'check_out_time', v_today_attendance.check_out_time
    );
  END IF;

  -- 6. Record the attendance
  IF v_tap_type = 'check_in' THEN
    -- Create new attendance record or update existing
    INSERT INTO gate_attendances (
      student_id, school_id, date, check_in_time, 
      card_uid, gate_device_id, tap_method
    ) VALUES (
      v_card_record.student_id, 
      COALESCE(p_school_id, v_card_record.school_id),
      CURRENT_DATE,
      NOW(),
      p_card_uid,
      p_gate_device_id,
      'rfid'
    )
    ON CONFLICT (student_id, date, school_id) 
    DO UPDATE SET 
      check_in_time = NOW(),
      card_uid = p_card_uid,
      gate_device_id = p_gate_device_id,
      tap_method = 'rfid'
    RETURNING id INTO v_attendance_id;
  ELSE
    -- Update with check-out time
    UPDATE gate_attendances 
    SET check_out_time = NOW()
    WHERE id = v_today_attendance.id
    RETURNING id INTO v_attendance_id;
  END IF;

  -- 7. Update card statistics
  UPDATE rfid_cards 
  SET last_used = NOW(), 
      total_taps = total_taps + 1,
      updated_at = NOW()
  WHERE card_uid = p_card_uid;

  -- 8. Log successful tap
  INSERT INTO gate_tap_logs (card_uid, gate_device_id, student_id, tap_type, success, school_id)
  VALUES (p_card_uid, p_gate_device_id, v_card_record.student_id, v_tap_type, true, p_school_id);

  -- 9. Return success response
  RETURN json_build_object(
    'success', true,
    'message', CASE 
      WHEN v_tap_type = 'check_in' THEN 'Selamat datang, ' || v_student_record.full_name || '!'
      ELSE 'Sampai jumpa, ' || v_student_record.full_name || '!'
    END,
    'tap_type', v_tap_type,
    'student_name', v_student_record.full_name,
    'student_class', v_student_record.class,
    'time', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO gate_tap_logs (card_uid, gate_device_id, success, failure_reason, school_id)
  VALUES (p_card_uid, p_gate_device_id, false, SQLERRM, p_school_id);
  
  RETURN json_build_object(
    'success', false,
    'message', 'Terjadi kesalahan sistem',
    'error_code', 'SYSTEM_ERROR',
    'error_detail', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 6. FUNCTION: Register New RFID Card
-- ===============================================
CREATE OR REPLACE FUNCTION register_rfid_card(
  p_card_uid VARCHAR(20),
  p_student_id UUID,
  p_school_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_card_id UUID;
BEGIN
  -- Check if card already exists
  IF EXISTS (SELECT 1 FROM rfid_cards WHERE card_uid = p_card_uid) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Kartu sudah terdaftar'
    );
  END IF;

  -- Check if student already has a card
  IF EXISTS (SELECT 1 FROM rfid_cards WHERE student_id = p_student_id AND status = 'active') THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Siswa sudah memiliki kartu aktif'
    );
  END IF;

  -- Insert new card
  INSERT INTO rfid_cards (card_uid, student_id, school_id, notes)
  VALUES (p_card_uid, p_student_id, p_school_id, p_notes)
  RETURNING id INTO v_card_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Kartu berhasil didaftarkan',
    'card_id', v_card_id
  );
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 7. FUNCTION: Block/Unblock RFID Card
-- ===============================================
CREATE OR REPLACE FUNCTION update_card_status(
  p_card_uid VARCHAR(20),
  p_new_status VARCHAR(20),
  p_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
  UPDATE rfid_cards 
  SET status = p_new_status,
      notes = COALESCE(p_notes, notes),
      updated_at = NOW()
  WHERE card_uid = p_card_uid;

  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Status kartu diperbarui ke: ' || p_new_status
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'Kartu tidak ditemukan'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 8. FUNCTION: Get Card History
-- ===============================================
CREATE OR REPLACE FUNCTION get_card_history(
  p_card_uid VARCHAR(20),
  p_days INTEGER DEFAULT 30
) RETURNS TABLE (
  tap_time TIMESTAMPTZ,
  tap_type VARCHAR(20),
  success BOOLEAN,
  failure_reason TEXT,
  gate_device_id VARCHAR(50),
  student_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gtl.tap_time,
    gtl.tap_type,
    gtl.success,
    gtl.failure_reason,
    gtl.gate_device_id,
    p.full_name as student_name
  FROM gate_tap_logs gtl
  LEFT JOIN profiles p ON gtl.student_id = p.id
  WHERE gtl.card_uid = p_card_uid
    AND gtl.tap_time >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY gtl.tap_time DESC;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 9. FUNCTION: Device Heartbeat
-- ===============================================
CREATE OR REPLACE FUNCTION device_heartbeat(
  p_device_id VARCHAR(50),
  p_ip_address VARCHAR(45) DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
  UPDATE gate_devices 
  SET last_heartbeat = NOW(),
      ip_address = COALESCE(p_ip_address, ip_address),
      updated_at = NOW()
  WHERE device_id = p_device_id;

  IF FOUND THEN
    RETURN json_build_object('success', true, 'message', 'Heartbeat received');
  ELSE
    RETURN json_build_object('success', false, 'message', 'Device not found');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 10. ENABLE ROW LEVEL SECURITY
-- ===============================================
ALTER TABLE rfid_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_tap_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can do everything
CREATE POLICY rfid_cards_admin_all ON rfid_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Kepala Sekolah', 'Staff')
    )
  );

CREATE POLICY gate_devices_admin_all ON gate_devices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Kepala Sekolah', 'Staff')
    )
  );

-- Policy: Students can view their own card
CREATE POLICY rfid_cards_student_view ON rfid_cards
  FOR SELECT USING (student_id = auth.uid());

-- Policy: Anyone can view tap logs (for transparency)
CREATE POLICY gate_tap_logs_view_all ON gate_tap_logs
  FOR SELECT USING (true);

-- Policy: Only system can insert tap logs (via function)
CREATE POLICY gate_tap_logs_insert_system ON gate_tap_logs
  FOR INSERT WITH CHECK (true);

-- ===============================================
-- 11. CREATE VIEWS FOR REPORTING
-- ===============================================

-- View: Active cards with student info
CREATE OR REPLACE VIEW v_active_cards AS
SELECT 
  rc.id,
  rc.card_uid,
  rc.status,
  rc.assigned_date,
  rc.last_used,
  rc.total_taps,
  p.full_name as student_name,
  p.class as student_class,
  p.identity_number as nis,
  s.name as school_name
FROM rfid_cards rc
LEFT JOIN profiles p ON rc.student_id = p.id
LEFT JOIN schools s ON rc.school_id = s.id
WHERE rc.status = 'active';

-- View: Today's gate attendance summary
CREATE OR REPLACE VIEW v_today_gate_summary AS
SELECT 
  ga.school_id,
  COUNT(*) FILTER (WHERE ga.check_in_time IS NOT NULL) as total_check_ins,
  COUNT(*) FILTER (WHERE ga.check_out_time IS NOT NULL) as total_check_outs,
  COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM ga.check_in_time) >= 7) as late_arrivals,
  COUNT(*) FILTER (WHERE ga.tap_method = 'rfid') as rfid_taps,
  COUNT(*) FILTER (WHERE ga.tap_method = 'nfc') as nfc_taps
FROM gate_attendances ga
WHERE ga.date = CURRENT_DATE
GROUP BY ga.school_id;

-- ===============================================
-- MIGRATION COMPLETE
-- ===============================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Register gate devices in gate_devices table
-- 3. Register RFID cards for students
-- 4. Deploy ESP32 firmware or NFC app
-- 5. Test tap functionality
-- ===============================================

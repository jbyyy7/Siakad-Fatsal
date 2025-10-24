-- ============================================================================
-- Migration: Add Gate Attendance Columns to Schools Table
-- Date: 2024-10-24
-- Purpose: Add all gate attendance related columns for check-in/out features
-- ============================================================================

-- Add gate attendance columns to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS gate_attendance_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gate_qr_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS gate_face_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gate_manual_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS gate_check_in_start TIME DEFAULT '05:00:00',
ADD COLUMN IF NOT EXISTS gate_check_in_end TIME DEFAULT '23:59:59',
ADD COLUMN IF NOT EXISTS gate_late_threshold TIME DEFAULT '07:30:00',
ADD COLUMN IF NOT EXISTS gate_check_out_start TIME DEFAULT '05:00:00',
ADD COLUMN IF NOT EXISTS gate_check_out_end TIME DEFAULT '23:59:59',
ADD COLUMN IF NOT EXISTS gate_notify_parents BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS gate_notify_on_late BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN schools.gate_attendance_enabled IS 'Toggle untuk mengaktifkan sistem check-in/check-out di gerbang sekolah';
COMMENT ON COLUMN schools.gate_qr_enabled IS 'Izinkan siswa scan QR code untuk check-in/out';
COMMENT ON COLUMN schools.gate_face_enabled IS 'Izinkan face recognition untuk check-in/out (future feature)';
COMMENT ON COLUMN schools.gate_manual_enabled IS 'Izinkan admin/staff input manual untuk check-in/out';
COMMENT ON COLUMN schools.gate_check_in_start IS 'Jam mulai check-in diperbolehkan';
COMMENT ON COLUMN schools.gate_check_in_end IS 'Jam akhir check-in diperbolehkan';
COMMENT ON COLUMN schools.gate_late_threshold IS 'Batas waktu untuk dianggap terlambat';
COMMENT ON COLUMN schools.gate_check_out_start IS 'Jam mulai check-out diperbolehkan';
COMMENT ON COLUMN schools.gate_check_out_end IS 'Jam akhir check-out diperbolehkan';
COMMENT ON COLUMN schools.gate_notify_parents IS 'Kirim notifikasi ke orang tua saat check-in/out';
COMMENT ON COLUMN schools.gate_notify_on_late IS 'Kirim notifikasi khusus ke orang tua saat siswa terlambat';

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'schools' 
AND column_name LIKE 'gate_%'
ORDER BY column_name;

-- Show sample data
SELECT 
    id,
    name,
    gate_attendance_enabled,
    gate_qr_enabled,
    gate_late_threshold
FROM schools
LIMIT 5;

-- ============================================================================
-- MIGRATION SUCCESS MESSAGE
-- ============================================================================
-- All gate attendance columns have been added to the schools table.
-- 
-- Next steps:
-- 1. Verify columns exist in Supabase dashboard
-- 2. Test school form in the application
-- 3. All gate attendance features should now work properly
-- ============================================================================

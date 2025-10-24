-- ================================================
-- FIX USER ROLE ENUM - ADD KEPALA SEKOLAH
-- ================================================
-- Run this BEFORE running Gate Attendance migrations
-- if you get error: invalid input value for enum user_role: "Kepala Sekolah"

-- Add 'Kepala Sekolah' to user_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Kepala Sekolah' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'Kepala Sekolah';
  END IF;
END $$;

-- Verify the enum values
SELECT enumlabel as role 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- Expected output should include:
-- Admin
-- Kepala Yayasan
-- Kepala Sekolah
-- Staff
-- Guru
-- Siswa

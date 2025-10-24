-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================
-- Run this if you already have tables but missing some columns
-- =====================================================

BEGIN;

-- Add missing columns to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS radius INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS location_attendance_enabled BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN schools.latitude IS 'Latitude lokasi sekolah untuk geofencing';
COMMENT ON COLUMN schools.longitude IS 'Longitude lokasi sekolah untuk geofencing';
COMMENT ON COLUMN schools.location_name IS 'Nama lokasi yang mudah dibaca';
COMMENT ON COLUMN schools.radius IS 'Radius yang diizinkan dalam meter untuk absensi (50-500m)';
COMMENT ON COLUMN schools.location_attendance_enabled IS 'Toggle untuk mengaktifkan/menonaktifkan fitur location-based attendance';

-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS identity_number TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS place_of_birth TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_phone_number TEXT;

-- Add gender constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_gender_check'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_gender_check 
        CHECK (gender IN ('Laki-laki', 'Perempuan'));
    END IF;
END $$;

-- Add missing location columns to attendances
ALTER TABLE attendances
ADD COLUMN IF NOT EXISTS teacher_latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS teacher_longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS teacher_location_name TEXT;

COMMENT ON COLUMN attendances.teacher_latitude IS 'Lokasi guru saat mengabsen siswa';
COMMENT ON COLUMN attendances.teacher_longitude IS 'Lokasi guru saat mengabsen siswa';

-- Add missing location columns to teacher_attendance
ALTER TABLE teacher_attendance
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS location_name TEXT;

COMMENT ON COLUMN teacher_attendance.latitude IS 'Lokasi guru saat check-in/out';
COMMENT ON COLUMN teacher_attendance.longitude IS 'Lokasi guru saat check-in/out';

-- Create announcements table if not exists (needed for notifications)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create announcements policies if not exist
DROP POLICY IF EXISTS "Users can view announcements in their school" ON announcements;
CREATE POLICY "Users can view announcements in their school"
    ON announcements FOR SELECT
    TO authenticated
    USING (
        school_id IS NULL OR
        school_id IN (
            SELECT school_id FROM profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins and principals can create announcements" ON announcements;
CREATE POLICY "Admins and principals can create announcements"
    ON announcements FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Kepala Sekolah', 'Staff', 'Kepala Yayasan')
        )
    );

DROP POLICY IF EXISTS "Authors can update their own announcements" ON announcements;
CREATE POLICY "Authors can update their own announcements"
    ON announcements FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete their own announcements" ON announcements;
CREATE POLICY "Authors can delete their own announcements"
    ON announcements FOR DELETE
    TO authenticated
    USING (author_id = auth.uid());

-- Create indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);

-- Create trigger for announcements updated_at
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at 
    BEFORE UPDATE ON announcements
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON announcements TO authenticated;

COMMIT;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✅ Missing columns added successfully!';
    RAISE NOTICE '✅ announcements table created (if not exists)';
    RAISE NOTICE '✅ Location fields added to schools, attendances, teacher_attendance';
    RAISE NOTICE '✅ Personal data fields added to profiles';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next: Run ADD_NOTIFICATIONS_SYSTEM.sql';
END $$;

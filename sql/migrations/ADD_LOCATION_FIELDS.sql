-- Migration: Add Location Fields for Geofencing Attendance
-- Description: Add latitude, longitude, location_name, and radius fields to schools table
--              Add location tracking to attendance tables
--              Add class_schedules table for time-based validation

-- 1. Add location fields to schools table
ALTER TABLE schools
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS radius INTEGER DEFAULT 100, -- radius in meters, default 100m
ADD COLUMN IF NOT EXISTS location_attendance_enabled BOOLEAN DEFAULT false; -- Enable/disable feature

COMMENT ON COLUMN schools.latitude IS 'School latitude for geofencing';
COMMENT ON COLUMN schools.longitude IS 'School longitude for geofencing';
COMMENT ON COLUMN schools.location_name IS 'Human-readable location name';
COMMENT ON COLUMN schools.radius IS 'Allowed radius in meters for attendance validation';
COMMENT ON COLUMN schools.location_attendance_enabled IS 'Enable/disable location-based attendance feature';

-- 2. Add location fields to teacher_attendance table
ALTER TABLE teacher_attendance
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS location_name TEXT;

COMMENT ON COLUMN teacher_attendance.latitude IS 'Teacher location when checking in/out';
COMMENT ON COLUMN teacher_attendance.longitude IS 'Teacher location when checking in/out';
COMMENT ON COLUMN teacher_attendance.location_name IS 'Human-readable location where attendance was marked';

-- 3. Add location fields to attendances table (student attendance)
ALTER TABLE attendances
ADD COLUMN IF NOT EXISTS teacher_latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS teacher_longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS teacher_location_name TEXT;

COMMENT ON COLUMN attendances.teacher_latitude IS 'Teacher location when marking student attendance';
COMMENT ON COLUMN attendances.teacher_longitude IS 'Teacher location when marking student attendance';
COMMENT ON COLUMN attendances.teacher_location_name IS 'Location where teacher marked attendance';

-- 4. Create class_schedules table for time-based validation
CREATE TABLE IF NOT EXISTS class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, subject_id, day_of_week, start_time)
);

COMMENT ON TABLE class_schedules IS 'Class schedules for time-based attendance validation';
COMMENT ON COLUMN class_schedules.day_of_week IS 'Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN class_schedules.start_time IS 'Schedule start time';
COMMENT ON COLUMN class_schedules.end_time IS 'Schedule end time';
COMMENT ON COLUMN class_schedules.room IS 'Classroom or room name';

-- 5. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_class_schedules_class_id ON class_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_teacher_id ON class_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day ON class_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON teacher_attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(date);

-- 6. Enable RLS on class_schedules
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for class_schedules
CREATE POLICY "Allow read access to class_schedules for authenticated users"
ON class_schedules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow teachers to manage their own schedules"
ON class_schedules FOR ALL
TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "Allow admins to manage all schedules"
ON class_schedules FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('Admin', 'Kepala Sekolah', 'Staff', 'Kepala Yayasan')
  )
);

-- 8. Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_class_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_class_schedules_updated_at
BEFORE UPDATE ON class_schedules
FOR EACH ROW
EXECUTE FUNCTION update_class_schedules_updated_at();

-- Sample data (optional - for testing)
-- INSERT INTO class_schedules (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room)
-- VALUES 
-- ('class-uuid', 'subject-uuid', 'teacher-uuid', 1, '08:00', '09:30', 'Room 101'),
-- ('class-uuid', 'subject-uuid', 'teacher-uuid', 3, '10:00', '11:30', 'Room 102');

COMMIT;

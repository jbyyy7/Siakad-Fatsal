-- QR Attendance Tables
-- Run this migration after 002_password_resets.sql

-- Table for QR attendance sessions created by teachers
CREATE TABLE IF NOT EXISTS qr_attendance_sessions (
  id TEXT PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  qr_code TEXT NOT NULL,
  location JSONB, -- { latitude, longitude, radius }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for student check-ins via QR
CREATE TABLE IF NOT EXISTS qr_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES qr_attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  location JSONB, -- { latitude, longitude }
  status TEXT CHECK (status IN ('early', 'on-time', 'late')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id) -- Prevent duplicate check-ins
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_sessions_class ON qr_attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_teacher ON qr_attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_date ON qr_attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_qr_checkins_session ON qr_check_ins(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_checkins_student ON qr_check_ins(student_id);

-- Grant permissions
GRANT ALL ON qr_attendance_sessions TO authenticated;
GRANT ALL ON qr_check_ins TO authenticated;

-- RLS Policies
ALTER TABLE qr_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_check_ins ENABLE ROW LEVEL SECURITY;

-- Teachers can create sessions for their classes
CREATE POLICY "Teachers can create QR sessions"
  ON qr_attendance_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Guru'
    )
  );

-- Teachers can view their own sessions
CREATE POLICY "Teachers can view their sessions"
  ON qr_attendance_sessions FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Students can view active sessions for their classes
CREATE POLICY "Students can view active sessions"
  ON qr_attendance_sessions FOR SELECT
  TO authenticated
  USING (
    end_time > NOW() AND
    EXISTS (
      SELECT 1 FROM class_members
      WHERE class_members.class_id = qr_attendance_sessions.class_id
        AND class_members.profile_id = auth.uid()
    )
  );

-- Students can check in
CREATE POLICY "Students can check in"
  ON qr_check_ins FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Students can view their own check-ins
CREATE POLICY "Students can view their check-ins"
  ON qr_check_ins FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Teachers can view check-ins for their sessions
CREATE POLICY "Teachers can view session check-ins"
  ON qr_check_ins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM qr_attendance_sessions
      WHERE qr_attendance_sessions.id = qr_check_ins.session_id
        AND qr_attendance_sessions.teacher_id = auth.uid()
    )
  );

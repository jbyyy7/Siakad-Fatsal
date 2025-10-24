-- ================================================
-- FIX STUDENT FEATURES - SAFE MIGRATION
-- ================================================
-- This file fixes all errors from ADD_STUDENT_FEATURES.sql
-- Changes auth.users to profiles and handles parent_contacts dependency
-- ================================================

-- ================================================
-- 1. ADD PHOTO & PERSONAL INFO TO PROFILES
-- ================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS place_of_birth TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_type TEXT CHECK (blood_type IN ('A', 'B', 'AB', 'O', 'A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'));


-- ================================================
-- 2. CREATE PARENT_CONTACTS IF NOT EXISTS
-- ================================================

CREATE TABLE IF NOT EXISTS parent_contacts (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_name TEXT NOT NULL,
  relationship TEXT CHECK (relationship IN ('Father', 'Mother', 'Guardian')),
  phone_number TEXT NOT NULL,
  email TEXT,
  whatsapp_number TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  -- New columns for WhatsApp verification
  whatsapp_verified BOOLEAN DEFAULT FALSE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table already exists, just add the new columns
ALTER TABLE parent_contacts ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE parent_contacts ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT TRUE;

-- Index for quick student lookup
CREATE INDEX IF NOT EXISTS idx_parent_contacts_student ON parent_contacts(student_id);

-- RLS Policies for parent_contacts (if not exists from gate attendance)
ALTER TABLE parent_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own parent contacts" ON parent_contacts;
DROP POLICY IF EXISTS "Admin can manage all parent contacts" ON parent_contacts;
DROP POLICY IF EXISTS "Staff can manage parent contacts in their school" ON parent_contacts;

CREATE POLICY "Students can view own parent contacts"
  ON parent_contacts FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admin can manage all parent contacts"
  ON parent_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

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
-- 3. CREATE ACADEMIC YEARS TABLE
-- ================================================

DROP TABLE IF EXISTS academic_years CASCADE;

CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "2024/2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academic_years_school ON academic_years(school_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_active ON academic_years(is_active);

-- Add unique constraint after table is created
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'academic_years_school_id_name_key'
  ) THEN
    ALTER TABLE academic_years ADD CONSTRAINT academic_years_school_id_name_key 
    UNIQUE (school_id, name);
  END IF;
END $$;


-- ================================================
-- 4. CREATE SEMESTERS TABLE
-- ================================================

DROP TABLE IF EXISTS semesters CASCADE;

CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Semester 1", "Semester 2"
  semester_number INTEGER CHECK (semester_number IN (1, 2)),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_semesters_academic_year ON semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_semesters_active ON semesters(is_active);

-- Add unique constraint after table is created
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'semesters_academic_year_id_semester_number_key'
  ) THEN
    ALTER TABLE semesters ADD CONSTRAINT semesters_academic_year_id_semester_number_key 
    UNIQUE (academic_year_id, semester_number);
  END IF;
END $$;


-- ================================================
-- 5. CREATE REPORT CARDS TABLE (FIXED)
-- ================================================

DROP TABLE IF EXISTS report_cards CASCADE;

CREATE TABLE IF NOT EXISTS report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- FIXED: profiles not auth.users
  class_id UUID REFERENCES classes(id),
  semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  
  -- Student info (snapshot at report time)
  student_name TEXT NOT NULL,
  student_nis TEXT NOT NULL,
  class_name TEXT,
  
  -- Attendance summary
  total_days INTEGER DEFAULT 0,
  present_days INTEGER DEFAULT 0,
  sick_days INTEGER DEFAULT 0,
  permission_days INTEGER DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  
  -- Overall performance
  total_score NUMERIC(5, 2),
  average_score NUMERIC(5, 2),
  rank INTEGER,
  total_students INTEGER,
  
  -- Status
  status TEXT CHECK (status IN ('Draft', 'Published', 'Archived')) DEFAULT 'Draft',
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES profiles(id), -- FIXED
  
  -- Principal & Homeroom Teacher
  homeroom_teacher_id UUID REFERENCES profiles(id), -- FIXED
  homeroom_teacher_name TEXT,
  principal_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_cards_student ON report_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_semester ON report_cards(semester_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_class ON report_cards(class_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_school ON report_cards(school_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_status ON report_cards(status);

-- Add unique constraint after table is created
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'report_cards_student_id_semester_id_key'
  ) THEN
    ALTER TABLE report_cards ADD CONSTRAINT report_cards_student_id_semester_id_key 
    UNIQUE (student_id, semester_id);
  END IF;
END $$;


-- ================================================
-- 6. CREATE REPORT CARD SUBJECTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS report_card_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id UUID NOT NULL REFERENCES report_cards(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  subject_name TEXT NOT NULL,
  
  -- Scores
  knowledge_score NUMERIC(5, 2), -- Pengetahuan
  skill_score NUMERIC(5, 2), -- Keterampilan
  final_score NUMERIC(5, 2), -- Nilai Akhir
  grade TEXT, -- A, B, C, D, E or Predicate for Kurikulum Merdeka
  
  -- Description
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_card_subjects_report ON report_card_subjects(report_card_id);
CREATE INDEX IF NOT EXISTS idx_report_card_subjects_subject ON report_card_subjects(subject_id);


-- ================================================
-- 7. CREATE REPORT CARD COMMENTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS report_card_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id UUID NOT NULL REFERENCES report_cards(id) ON DELETE CASCADE,
  comment_type TEXT CHECK (comment_type IN ('Attitude', 'Achievement', 'Homeroom', 'Principal')) NOT NULL,
  comment TEXT NOT NULL,
  commented_by UUID REFERENCES profiles(id), -- FIXED
  commented_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_card_comments_report ON report_card_comments(report_card_id);


-- ================================================
-- 8. CREATE NOTIFICATION LOGS TABLE (FIXED)
-- ================================================

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type TEXT CHECK (recipient_type IN ('Parent', 'Student', 'Teacher', 'Staff', 'Admin')) NOT NULL,
  recipient_id UUID REFERENCES profiles(id), -- FIXED
  recipient_phone TEXT,
  recipient_email TEXT,
  
  notification_type TEXT CHECK (notification_type IN ('GateCheckIn', 'GateCheckOut', 'GateLate', 'ReportCard', 'Payment', 'General')) NOT NULL,
  channel TEXT CHECK (channel IN ('WhatsApp', 'Email', 'InApp', 'SMS')) NOT NULL,
  
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Sent', 'Delivered', 'Failed')) DEFAULT 'Pending',
  
  -- External service response
  external_id TEXT, -- Twilio message SID, etc
  error_message TEXT,
  
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at);


-- ================================================
-- 9. RLS POLICIES
-- ================================================

-- Academic Years
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage academic years" ON academic_years;
DROP POLICY IF EXISTS "Staff can view academic years in their school" ON academic_years;

CREATE POLICY "Admin can manage academic years"
  ON academic_years FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

CREATE POLICY "Staff can view academic years in their school"
  ON academic_years FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Staff', 'Kepala Sekolah', 'Guru')
      AND profiles.school_id = academic_years.school_id
    )
  );

-- Semesters
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage semesters" ON semesters;
DROP POLICY IF EXISTS "Staff can view semesters" ON semesters;

CREATE POLICY "Admin can manage semesters"
  ON semesters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

CREATE POLICY "Staff can view semesters"
  ON semesters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Staff', 'Kepala Sekolah', 'Guru')
    )
  );

-- Report Cards
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own report cards" ON report_cards;
DROP POLICY IF EXISTS "Parents can view their children report cards" ON report_cards;
DROP POLICY IF EXISTS "Teachers can view report cards in their school" ON report_cards;
DROP POLICY IF EXISTS "Teachers can manage report cards" ON report_cards;
DROP POLICY IF EXISTS "Admin can manage all report cards" ON report_cards;

CREATE POLICY "Students can view own report cards"
  ON report_cards FOR SELECT
  USING (auth.uid() = student_id AND status = 'Published');

CREATE POLICY "Parents can view their children report cards"
  ON report_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_contacts pc
      JOIN profiles p ON p.id = auth.uid()
      WHERE pc.student_id = report_cards.student_id
      AND pc.email = p.email
    )
    AND status = 'Published'
  );

CREATE POLICY "Teachers can view report cards in their school"
  ON report_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Guru', 'Staff', 'Kepala Sekolah')
      AND profiles.school_id = report_cards.school_id
    )
  );

CREATE POLICY "Teachers can manage report cards"
  ON report_cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Guru', 'Staff')
      AND profiles.school_id = report_cards.school_id
    )
  );

CREATE POLICY "Admin can manage all report cards"
  ON report_cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Report Card Subjects
ALTER TABLE report_card_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View report card subjects with report card" ON report_card_subjects;
DROP POLICY IF EXISTS "Teachers can manage report card subjects" ON report_card_subjects;
DROP POLICY IF EXISTS "Admin can manage all report card subjects" ON report_card_subjects;

CREATE POLICY "View report card subjects with report card"
  ON report_card_subjects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM report_cards rc
      WHERE rc.id = report_card_subjects.report_card_id
      AND (
        -- Student can view own
        (auth.uid() = rc.student_id AND rc.status = 'Published')
        OR
        -- Parent can view
        EXISTS (
          SELECT 1 FROM parent_contacts pc
          JOIN profiles p ON p.id = auth.uid()
          WHERE pc.student_id = rc.student_id
          AND pc.email = p.email
          AND rc.status = 'Published'
        )
        OR
        -- Staff can view
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('Guru', 'Staff', 'Kepala Sekolah', 'Admin')
        )
      )
    )
  );

CREATE POLICY "Teachers can manage report card subjects"
  ON report_card_subjects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM report_cards rc
      JOIN profiles p ON p.id = auth.uid()
      WHERE rc.id = report_card_subjects.report_card_id
      AND p.role IN ('Guru', 'Staff')
      AND p.school_id = rc.school_id
    )
  );

CREATE POLICY "Admin can manage all report card subjects"
  ON report_card_subjects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Report Card Comments
ALTER TABLE report_card_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View report card comments with report card" ON report_card_comments;
DROP POLICY IF EXISTS "Teachers can manage report card comments" ON report_card_comments;

CREATE POLICY "View report card comments with report card"
  ON report_card_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM report_cards rc
      WHERE rc.id = report_card_comments.report_card_id
      AND (
        -- Same access as report cards
        (auth.uid() = rc.student_id AND rc.status = 'Published')
        OR
        EXISTS (
          SELECT 1 FROM parent_contacts pc
          JOIN profiles p ON p.id = auth.uid()
          WHERE pc.student_id = rc.student_id
          AND pc.email = p.email
          AND rc.status = 'Published'
        )
        OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('Guru', 'Staff', 'Kepala Sekolah', 'Admin')
        )
      )
    )
  );

CREATE POLICY "Teachers can manage report card comments"
  ON report_card_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM report_cards rc
      JOIN profiles p ON p.id = auth.uid()
      WHERE rc.id = report_card_comments.report_card_id
      AND p.role IN ('Guru', 'Staff', 'Kepala Sekolah')
      AND p.school_id = rc.school_id
    )
  );

-- Notification Logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notification_logs;
DROP POLICY IF EXISTS "Admin can view all notifications" ON notification_logs;
DROP POLICY IF EXISTS "System can insert notifications" ON notification_logs;

CREATE POLICY "Users can view own notifications"
  ON notification_logs FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Admin can view all notifications"
  ON notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Admin', 'Staff')
    )
  );

CREATE POLICY "System can insert notifications"
  ON notification_logs FOR INSERT
  WITH CHECK (true);


-- ================================================
-- 10. TRIGGERS FOR UPDATED_AT
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_academic_years_updated_at ON academic_years;
CREATE TRIGGER trigger_academic_years_updated_at
  BEFORE UPDATE ON academic_years
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_semesters_updated_at ON semesters;
CREATE TRIGGER trigger_semesters_updated_at
  BEFORE UPDATE ON semesters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_report_cards_updated_at ON report_cards;
CREATE TRIGGER trigger_report_cards_updated_at
  BEFORE UPDATE ON report_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_report_card_subjects_updated_at ON report_card_subjects;
CREATE TRIGGER trigger_report_card_subjects_updated_at
  BEFORE UPDATE ON report_card_subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ================================================
-- 11. GRANT PERMISSIONS
-- ================================================

GRANT ALL ON academic_years TO authenticated;
GRANT ALL ON semesters TO authenticated;
GRANT ALL ON report_cards TO authenticated;
GRANT ALL ON report_card_subjects TO authenticated;
GRANT ALL ON report_card_comments TO authenticated;
GRANT ALL ON notification_logs TO authenticated;
GRANT ALL ON parent_contacts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE parent_contacts_id_seq TO authenticated;


-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check profiles new columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('photo_url', 'date_of_birth', 'place_of_birth', 'address', 'blood_type')
ORDER BY ordinal_position;

-- Check parent_contacts table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'parent_contacts'
ORDER BY ordinal_position;

-- Check academic_years table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'academic_years'
ORDER BY ordinal_position;

-- Check semesters table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'semesters'
ORDER BY ordinal_position;

-- Check report_cards table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'report_cards'
ORDER BY ordinal_position;

-- Check report_card_subjects table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'report_card_subjects'
ORDER BY ordinal_position;

-- Check report_card_comments table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'report_card_comments'
ORDER BY ordinal_position;

-- Check notification_logs table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Student Features migration completed successfully!';
  RAISE NOTICE '✅ Tables created: parent_contacts, academic_years, semesters, report_cards, report_card_subjects, report_card_comments, notification_logs';
  RAISE NOTICE '✅ Columns added to profiles: photo_url, date_of_birth, place_of_birth, address, blood_type';
  RAISE NOTICE '✅ All RLS policies and triggers created';
  RAISE NOTICE '✅ Ready for Student Cards, Report Cards, and WhatsApp features!';
END $$;

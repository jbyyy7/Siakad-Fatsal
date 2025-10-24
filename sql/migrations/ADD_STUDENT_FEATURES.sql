-- ================================================
-- STUDENT FEATURES MIGRATION
-- Kartu Pelajar, Enhanced Import, WhatsApp, Rapor Digital
-- ================================================

-- 1. ADD PHOTO COLUMN TO PROFILES (for student cards)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS place_of_birth TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_type TEXT CHECK (blood_type IN ('A', 'B', 'AB', 'O', 'A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'));

-- 2. ENHANCE PARENT CONTACTS (add WhatsApp verification)
ALTER TABLE parent_contacts ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE parent_contacts ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT TRUE;

-- 3. CREATE ACADEMIC YEARS TABLE
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "2024/2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_academic_years_school ON academic_years(school_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_active ON academic_years(is_active);

-- 4. CREATE SEMESTERS TABLE
CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Semester 1", "Semester 2"
  semester_number INTEGER CHECK (semester_number IN (1, 2)),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(academic_year_id, semester_number)
);

CREATE INDEX IF NOT EXISTS idx_semesters_academic_year ON semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_semesters_active ON semesters(is_active);

-- 5. CREATE REPORT CARDS TABLE
CREATE TABLE IF NOT EXISTS report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  published_by UUID REFERENCES auth.users(id),
  
  -- Principal & Homeroom Teacher
  homeroom_teacher_id UUID REFERENCES auth.users(id),
  homeroom_teacher_name TEXT,
  principal_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, semester_id)
);

CREATE INDEX IF NOT EXISTS idx_report_cards_student ON report_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_semester ON report_cards(semester_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_class ON report_cards(class_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_school ON report_cards(school_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_status ON report_cards(status);

-- 6. CREATE REPORT CARD SUBJECTS TABLE
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

-- 7. CREATE REPORT CARD COMMENTS TABLE
CREATE TABLE IF NOT EXISTS report_card_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id UUID NOT NULL REFERENCES report_cards(id) ON DELETE CASCADE,
  comment_type TEXT CHECK (comment_type IN ('Attitude', 'Achievement', 'Homeroom', 'Principal')) NOT NULL,
  comment TEXT NOT NULL,
  commented_by UUID REFERENCES auth.users(id),
  commented_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_card_comments_report ON report_card_comments(report_card_id);

-- 8. CREATE NOTIFICATION LOGS TABLE (for WhatsApp tracking)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type TEXT CHECK (recipient_type IN ('Parent', 'Student', 'Teacher', 'Staff', 'Admin')) NOT NULL,
  recipient_id UUID REFERENCES auth.users(id),
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

-- 9. RLS POLICIES

-- Academic Years
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Students can view own report cards"
  ON report_cards FOR SELECT
  USING (auth.uid() = student_id AND status = 'Published');

CREATE POLICY "Parents can view their children report cards"
  ON report_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_contacts
      WHERE parent_contacts.student_id = report_cards.student_id
      AND parent_contacts.email = (SELECT email FROM auth.users WHERE id = auth.uid())
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

CREATE POLICY "View report card subjects with report card"
  ON report_card_subjects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM report_cards
      WHERE report_cards.id = report_card_subjects.report_card_id
      -- Same access as report cards
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

CREATE POLICY "View report card comments with report card"
  ON report_card_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM report_cards
      WHERE report_cards.id = report_card_comments.report_card_id
      -- Same access as report cards
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

-- 10. TRIGGERS FOR UPDATED_AT

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

-- 11. GRANT PERMISSIONS

GRANT ALL ON academic_years TO authenticated;
GRANT ALL ON semesters TO authenticated;
GRANT ALL ON report_cards TO authenticated;
GRANT ALL ON report_card_subjects TO authenticated;
GRANT ALL ON report_card_comments TO authenticated;
GRANT ALL ON notification_logs TO authenticated;

-- MIGRATION COMPLETE!
-- Features: Student Cards, Enhanced Import, WhatsApp Notifications, Digital Report Cards

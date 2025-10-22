-- =====================================================
-- COMPLETE MIGRATION FOR SIAKAD FATHUS SALAFI
-- Date: October 22, 2025
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CREATE MISSING TABLES
-- =====================================================

-- 1.1 Password Resets Table (for secure password reset flow)
CREATE TABLE IF NOT EXISTS public.password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON public.password_resets(user_id);

-- 1.2 Teacher Attendance Table (NEW FEATURE!)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    check_in_time TIME,
    check_out_time TIME,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON public.teacher_attendance(date);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher ON public.teacher_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_school ON public.teacher_attendance(school_id);

-- 1.3 Class Members Table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_class_members_class ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_profile ON public.class_members(profile_id);

-- 1.4 Notifications Table (for real-time notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('announcement', 'grade', 'attendance', 'assignment')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    recipient_ids UUID[] NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON public.notifications(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- =====================================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add school_name to profiles if not exists (for faster queries)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='school_name') THEN
        ALTER TABLE public.profiles ADD COLUMN school_name TEXT;
    END IF;
END $$;

-- Add metadata columns to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='place_of_birth') THEN
        ALTER TABLE public.profiles ADD COLUMN place_of_birth TEXT;
        ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
        ALTER TABLE public.profiles ADD COLUMN gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan'));
        ALTER TABLE public.profiles ADD COLUMN religion TEXT;
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
        ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
        ALTER TABLE public.profiles ADD COLUMN parent_name TEXT;
        ALTER TABLE public.profiles ADD COLUMN parent_phone_number TEXT;
    END IF;
END $$;

-- =====================================================
-- 3. CREATE RPC FUNCTIONS
-- =====================================================

-- 3.1 Function to get email from identity number (for login)
CREATE OR REPLACE FUNCTION public.get_email_from_identity(identity_number_input text)
RETURNS text 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT email FROM public.profiles WHERE identity_number = identity_number_input LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_from_identity(text) TO anon, authenticated;

-- 3.2 Function to delete user (cascade delete from auth and profile)
CREATE OR REPLACE FUNCTION public.delete_user(uid uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- Delete related records first
  DELETE FROM public.class_members WHERE profile_id = uid;
  DELETE FROM public.grades WHERE student_id = uid;
  DELETE FROM public.attendance WHERE student_id = uid;
  DELETE FROM public.teacher_attendance WHERE teacher_id = uid;
  DELETE FROM public.teaching_journals WHERE teacher_id = uid;
  DELETE FROM public.password_resets WHERE user_id = uid;
  DELETE FROM public.profiles WHERE id = uid;
  
  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user(uuid) TO authenticated;

-- 3.3 Update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to teacher_attendance
DROP TRIGGER IF EXISTS teacher_attendance_updated_at ON public.teacher_attendance;
CREATE TRIGGER teacher_attendance_updated_at
    BEFORE UPDATE ON public.teacher_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. RLS POLICIES FOR PASSWORD_RESETS
-- =====================================================

DROP POLICY IF EXISTS "Service role can manage password resets" ON public.password_resets;
CREATE POLICY "Service role can manage password resets"
    ON public.password_resets FOR ALL
    TO service_role
    USING (true);

DROP POLICY IF EXISTS "Users can view own password resets" ON public.password_resets;
CREATE POLICY "Users can view own password resets"
    ON public.password_resets FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- 6. RLS POLICIES FOR TEACHER_ATTENDANCE
-- =====================================================

-- Admin can view all
DROP POLICY IF EXISTS "Admin can view all teacher attendance" ON public.teacher_attendance;
CREATE POLICY "Admin can view all teacher attendance"
    ON public.teacher_attendance FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Admin'
        )
    );

-- Staff can view their school
DROP POLICY IF EXISTS "Staff can view their school teacher attendance" ON public.teacher_attendance;
CREATE POLICY "Staff can view their school teacher attendance"
    ON public.teacher_attendance FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = teacher_attendance.school_id
        )
    );

-- Principal can view their school
DROP POLICY IF EXISTS "Principal can view their school teacher attendance" ON public.teacher_attendance;
CREATE POLICY "Principal can view their school teacher attendance"
    ON public.teacher_attendance FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Kepala Sekolah'
            AND profiles.school_id = teacher_attendance.school_id
        )
    );

-- Teachers can view their own
DROP POLICY IF EXISTS "Teachers can view own attendance" ON public.teacher_attendance;
CREATE POLICY "Teachers can view own attendance"
    ON public.teacher_attendance FOR SELECT
    TO authenticated
    USING (teacher_id = auth.uid());

-- Admin can manage all
DROP POLICY IF EXISTS "Admin can manage all teacher attendance" ON public.teacher_attendance;
CREATE POLICY "Admin can manage all teacher attendance"
    ON public.teacher_attendance FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Admin'
        )
    );

-- Staff can manage their school
DROP POLICY IF EXISTS "Staff can manage their school teacher attendance" ON public.teacher_attendance;
CREATE POLICY "Staff can manage their school teacher attendance"
    ON public.teacher_attendance FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = teacher_attendance.school_id
        )
    );

-- Principal can manage their school
DROP POLICY IF EXISTS "Principal can manage their school teacher attendance" ON public.teacher_attendance;
CREATE POLICY "Principal can manage their school teacher attendance"
    ON public.teacher_attendance FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Kepala Sekolah'
            AND profiles.school_id = teacher_attendance.school_id
        )
    );

-- =====================================================
-- 7. RLS POLICIES FOR STAFF ROLE (SCHOOL-SCOPED ADMIN)
-- =====================================================

-- PROFILES TABLE - Staff can manage users in their school
DROP POLICY IF EXISTS "Staff can view users in their school" ON public.profiles;
CREATE POLICY "Staff can view users in their school"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = profiles.school_id
        )
    );

DROP POLICY IF EXISTS "Staff can insert users in their school" ON public.profiles;
CREATE POLICY "Staff can insert users in their school"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = profiles.school_id
        )
    );

DROP POLICY IF EXISTS "Staff can update users in their school" ON public.profiles;
CREATE POLICY "Staff can update users in their school"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = profiles.school_id
        )
    );

DROP POLICY IF EXISTS "Staff can delete users in their school" ON public.profiles;
CREATE POLICY "Staff can delete users in their school"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = profiles.school_id
        )
    );

-- CLASSES - Staff can manage classes in their school
DROP POLICY IF EXISTS "Staff can view classes in their school" ON public.classes;
CREATE POLICY "Staff can view classes in their school"
    ON public.classes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = classes.school_id
        )
    );

DROP POLICY IF EXISTS "Staff can manage classes in their school" ON public.classes;
CREATE POLICY "Staff can manage classes in their school"
    ON public.classes FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = classes.school_id
        )
    );

-- SUBJECTS - Staff can manage subjects in their school
DROP POLICY IF EXISTS "Staff can view subjects in their school" ON public.subjects;
CREATE POLICY "Staff can view subjects in their school"
    ON public.subjects FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = subjects.school_id
        )
    );

DROP POLICY IF EXISTS "Staff can manage subjects in their school" ON public.subjects;
CREATE POLICY "Staff can manage subjects in their school"
    ON public.subjects FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = subjects.school_id
        )
    );

-- ATTENDANCE - Staff can manage student attendance in their school
DROP POLICY IF EXISTS "Staff can view attendance in their school" ON public.attendance;
CREATE POLICY "Staff can view attendance in their school"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            JOIN public.profiles AS student ON student.id = attendance.student_id
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = student.school_id
        )
    );

DROP POLICY IF EXISTS "Staff can manage attendance in their school" ON public.attendance;
CREATE POLICY "Staff can manage attendance in their school"
    ON public.attendance FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            JOIN public.profiles AS student ON student.id = attendance.student_id
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = student.school_id
        )
    );

-- GRADES - Staff can manage grades in their school
DROP POLICY IF EXISTS "Staff can view grades in their school" ON public.grades;
CREATE POLICY "Staff can view grades in their school"
    ON public.grades FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            JOIN public.profiles AS student ON student.id = grades.student_id
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = student.school_id
        )
    );

DROP POLICY IF EXISTS "Staff can manage grades in their school" ON public.grades;
CREATE POLICY "Staff can manage grades in their school"
    ON public.grades FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            JOIN public.profiles AS student ON student.id = grades.student_id
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = student.school_id
        )
    );

-- ANNOUNCEMENTS - Staff can manage announcements in their school
DROP POLICY IF EXISTS "Staff can view announcements in their school" ON public.announcements;
CREATE POLICY "Staff can view announcements in their school"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = announcements.school_id
        )
        OR announcements.school_id IS NULL
    );

DROP POLICY IF EXISTS "Staff can manage announcements in their school" ON public.announcements;
CREATE POLICY "Staff can manage announcements in their school"
    ON public.announcements FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = announcements.school_id
        )
    );

-- TEACHING JOURNALS - Staff can view journals in their school
DROP POLICY IF EXISTS "Staff can view teaching journals in their school" ON public.teaching_journals;
CREATE POLICY "Staff can view teaching journals in their school"
    ON public.teaching_journals FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            JOIN public.profiles AS teacher ON teacher.id = teaching_journals.teacher_id
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = teacher.school_id
        )
    );

-- =====================================================
-- 8. RLS POLICIES FOR CLASS_MEMBERS
-- =====================================================

DROP POLICY IF EXISTS "Admin can manage class members" ON public.class_members;
CREATE POLICY "Admin can manage class members"
    ON public.class_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Admin'
        )
    );

DROP POLICY IF EXISTS "Staff can manage class members in their school" ON public.class_members;
CREATE POLICY "Staff can manage class members in their school"
    ON public.class_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            JOIN public.classes ON classes.id = class_members.class_id
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = classes.school_id
        )
    );

DROP POLICY IF EXISTS "Teachers can view their class members" ON public.class_members;
CREATE POLICY "Teachers can view their class members"
    ON public.class_members FOR SELECT
    TO authenticated
    USING (
        profile_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE classes.id = class_members.class_id
            AND classes.homeroom_teacher_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students can view their class members" ON public.class_members;
CREATE POLICY "Students can view their class members"
    ON public.class_members FOR SELECT
    TO authenticated
    USING (
        profile_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.class_members AS my_class
            WHERE my_class.profile_id = auth.uid()
            AND my_class.class_id = class_members.class_id
        )
    );

-- =====================================================
-- 9. RLS POLICIES FOR NOTIFICATIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = ANY(recipient_ids));

DROP POLICY IF EXISTS "Admin can create notifications" ON public.notifications;
CREATE POLICY "Admin can create notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Staff', 'Kepala Sekolah', 'Guru')
        )
    );

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = ANY(recipient_ids));

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_resets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE public.teacher_attendance_id_seq TO authenticated;

-- =====================================================
-- 11. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_identity_number ON public.profiles(identity_number);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON public.subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON public.announcements(school_id);

-- =====================================================
-- DONE! 🎉
-- =====================================================

-- Verify tables exist
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Check Table Editor for new tables';
    RAISE NOTICE '2. Create a Staff user to test';
    RAISE NOTICE '3. Test teacher attendance feature';
    RAISE NOTICE '4. Deploy frontend to Vercel';
END $$;

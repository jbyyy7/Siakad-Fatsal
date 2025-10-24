-- =====================================================
-- SIAKAD FATHUS SALAFI - COMPLETE DATABASE SETUP
-- =====================================================
-- Description: Complete database schema untuk sistem informasi akademik
-- dengan fitur location-based attendance menggunakan geofencing
-- 
-- Features:
-- - User management dengan multiple roles
-- - School management dengan multi-tenancy
-- - Class dan subject management
-- - Student dan teacher attendance dengan GPS validation
-- - Grades dan teaching journals
-- - Announcements
-- - Location-based attendance dengan enable/disable toggle
-- 
-- Run this script in Supabase SQL Editor untuk setup database baru
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ENABLE EXTENSIONS
-- =====================================================

-- Enable UUID extension untuk generate UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto untuk password hashing (sudah ada di Supabase Auth)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- 2.1 Schools Table
-- Tabel untuk menyimpan data sekolah
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    level TEXT NOT NULL, -- TK, SD, SMP, SMA, dll
    address TEXT NOT NULL,
    -- Location fields untuk geofencing
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    location_name TEXT,
    radius INTEGER DEFAULT 100, -- radius dalam meter
    location_attendance_enabled BOOLEAN DEFAULT false, -- Toggle enable/disable location attendance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE schools IS 'Tabel master sekolah';
COMMENT ON COLUMN schools.latitude IS 'Latitude lokasi sekolah untuk geofencing';
COMMENT ON COLUMN schools.longitude IS 'Longitude lokasi sekolah untuk geofencing';
COMMENT ON COLUMN schools.location_name IS 'Nama lokasi yang mudah dibaca';
COMMENT ON COLUMN schools.radius IS 'Radius yang diizinkan dalam meter untuk absensi (50-500m)';
COMMENT ON COLUMN schools.location_attendance_enabled IS 'Toggle untuk mengaktifkan/menonaktifkan fitur location-based attendance';

-- 2.2 Profiles Table
-- Extends Supabase Auth users dengan data tambahan
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    identity_number TEXT, -- NIP/NIS/NIK
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Guru', 'Kepala Sekolah', 'Siswa', 'Kepala Yayasan', 'Staff')),
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    avatar_url TEXT,
    -- Data pribadi detail
    place_of_birth TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    religion TEXT,
    address TEXT,
    phone_number TEXT,
    -- Data orang tua/wali (untuk siswa)
    parent_name TEXT,
    parent_phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Data profil pengguna yang extends dari auth.users';
COMMENT ON COLUMN profiles.role IS 'Role pengguna: Admin, Guru, Kepala Sekolah, Siswa, Kepala Yayasan, Staff';

-- 2.3 Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    homeroom_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name)
);

COMMENT ON TABLE classes IS 'Tabel kelas (e.g., 7A, 8B, 10 IPA 1)';

-- 2.4 Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name)
);

COMMENT ON TABLE subjects IS 'Tabel mata pelajaran';

-- 2.5 Class Members Table (Junction table untuk many-to-many)
CREATE TABLE IF NOT EXISTS class_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, profile_id)
);

COMMENT ON TABLE class_members IS 'Junction table untuk relasi many-to-many antara classes dan profiles';

-- 2.6 Class Schedules Table
CREATE TABLE IF NOT EXISTS class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Minggu, 6=Sabtu
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, subject_id, day_of_week, start_time)
);

COMMENT ON TABLE class_schedules IS 'Jadwal pelajaran per kelas';
COMMENT ON COLUMN class_schedules.day_of_week IS 'Hari: 0=Minggu, 1=Senin, ..., 6=Sabtu';

-- 2.7 Attendances Table (Student Attendance)
CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    -- Location tracking untuk guru yang mengabsen
    teacher_latitude NUMERIC(10, 8),
    teacher_longitude NUMERIC(11, 8),
    teacher_location_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, student_id, subject_id)
);

COMMENT ON TABLE attendances IS 'Absensi siswa';
COMMENT ON COLUMN attendances.teacher_latitude IS 'Lokasi guru saat mengabsen siswa';
COMMENT ON COLUMN attendances.teacher_longitude IS 'Lokasi guru saat mengabsen siswa';

-- 2.8 Teacher Attendance Table
CREATE TABLE IF NOT EXISTS teacher_attendance (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    check_in_time TIME,
    check_out_time TIME,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    notes TEXT,
    -- Location tracking
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    location_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, teacher_id)
);

COMMENT ON TABLE teacher_attendance IS 'Absensi guru/staff dengan check-in/check-out';
COMMENT ON COLUMN teacher_attendance.latitude IS 'Lokasi guru saat check-in/out';
COMMENT ON COLUMN teacher_attendance.longitude IS 'Lokasi guru saat check-in/out';

-- 2.9 Grades Table
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
    semester TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE grades IS 'Nilai siswa per mata pelajaran';

-- 2.10 Teaching Journals Table
CREATE TABLE IF NOT EXISTS teaching_journals (
    id SERIAL PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    topic TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE teaching_journals IS 'Jurnal mengajar guru';

-- 2.11 Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE announcements IS 'Pengumuman sekolah';

-- 2.12 Password Resets Table
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE password_resets IS 'Token untuk reset password';

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_homeroom_teacher ON classes(homeroom_teacher_id);

CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);

CREATE INDEX IF NOT EXISTS idx_class_members_class_id ON class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_profile_id ON class_members(profile_id);

CREATE INDEX IF NOT EXISTS idx_class_schedules_class_id ON class_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_teacher_id ON class_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day ON class_schedules(day_of_week);

CREATE INDEX IF NOT EXISTS idx_attendances_student_id ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_class_id ON attendances(class_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(date);

CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher_id ON teacher_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_school_id ON teacher_attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON teacher_attendance(date);

CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_class_id ON grades(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON grades(subject_id);

CREATE INDEX IF NOT EXISTS idx_teaching_journals_teacher_id ON teaching_journals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_journals_date ON teaching_journals(date);

CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);

-- =====================================================
-- 4. CREATE FUNCTIONS & TRIGGERS
-- =====================================================

-- Function untuk auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function untuk validasi nomor induk (NIS/NIP/NIK) - cek apakah sudah digunakan
DROP FUNCTION IF EXISTS get_email_from_identity(TEXT);
CREATE OR REPLACE FUNCTION get_email_from_identity(identity_num TEXT)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Cari email berdasarkan identity_number
    SELECT email INTO user_email
    FROM profiles
    WHERE identity_number = identity_num
    LIMIT 1;
    
    RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_email_from_identity IS 'Mengecek apakah nomor induk sudah digunakan dan mengembalikan email terkait';

-- Function untuk validasi email - cek apakah sudah digunakan
CREATE OR REPLACE FUNCTION check_email_exists(email_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    email_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO email_count
    FROM profiles
    WHERE email = email_input;
    
    RETURN email_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_email_exists IS 'Mengecek apakah email sudah terdaftar dalam sistem';

-- Triggers untuk auto-update updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_schedules_updated_at BEFORE UPDATE ON class_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON attendances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_attendance_updated_at BEFORE UPDATE ON teacher_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teaching_journals_updated_at BEFORE UPDATE ON teaching_journals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- 6.1 Schools Policies
CREATE POLICY "Allow read access to schools for authenticated users"
    ON schools FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admins and foundation heads to manage schools"
    ON schools FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Kepala Yayasan')
        )
    );

-- 6.2 Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their school"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
    ON profiles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Admin'
        )
    );

-- 6.3 Classes Policies
CREATE POLICY "Users can view classes in their school"
    ON classes FOR SELECT
    TO authenticated
    USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins and staff can manage classes"
    ON classes FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Kepala Sekolah', 'Staff', 'Kepala Yayasan')
            AND profiles.school_id = classes.school_id
        )
    );

-- 6.4 Subjects Policies
CREATE POLICY "Users can view subjects in their school"
    ON subjects FOR SELECT
    TO authenticated
    USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins and staff can manage subjects"
    ON subjects FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Kepala Sekolah', 'Staff', 'Kepala Yayasan')
            AND profiles.school_id = subjects.school_id
        )
    );

-- 6.5 Class Members Policies
CREATE POLICY "Users can view class members in their school"
    ON class_members FOR SELECT
    TO authenticated
    USING (
        class_id IN (
            SELECT id FROM classes
            WHERE school_id IN (
                SELECT school_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins and staff can manage class members"
    ON class_members FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN classes c ON c.id = class_members.class_id
            WHERE p.id = auth.uid()
            AND p.role IN ('Admin', 'Kepala Sekolah', 'Staff', 'Guru')
            AND p.school_id = c.school_id
        )
    );

-- 6.6 Class Schedules Policies
CREATE POLICY "Users can view class schedules in their school"
    ON class_schedules FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Teachers can manage their own schedules"
    ON class_schedules FOR ALL
    TO authenticated
    USING (teacher_id = auth.uid());

CREATE POLICY "Admins can manage all schedules"
    ON class_schedules FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Kepala Sekolah', 'Staff')
        )
    );

-- 6.7 Attendances Policies (Student Attendance)
CREATE POLICY "Students can view their own attendance"
    ON attendances FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

CREATE POLICY "Teachers can view and manage attendance in their school"
    ON attendances FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Guru', 'Kepala Sekolah', 'Staff')
        )
    );

-- 6.8 Teacher Attendance Policies
CREATE POLICY "Teachers can view their own attendance"
    ON teacher_attendance FOR SELECT
    TO authenticated
    USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can manage their own attendance"
    ON teacher_attendance FOR INSERT
    TO authenticated
    WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own attendance"
    ON teacher_attendance FOR UPDATE
    TO authenticated
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Admins can view all teacher attendance"
    ON teacher_attendance FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Kepala Sekolah', 'Staff', 'Kepala Yayasan')
        )
    );

-- 6.9 Grades Policies
CREATE POLICY "Students can view their own grades"
    ON grades FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage grades"
    ON grades FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Guru', 'Kepala Sekolah', 'Staff')
        )
    );

-- 6.10 Teaching Journals Policies
CREATE POLICY "Teachers can view their own journals"
    ON teaching_journals FOR SELECT
    TO authenticated
    USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can manage their own journals"
    ON teaching_journals FOR ALL
    TO authenticated
    USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all journals"
    ON teaching_journals FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Kepala Sekolah', 'Kepala Yayasan')
        )
    );

-- 6.11 Announcements Policies
CREATE POLICY "Users can view announcements in their school"
    ON announcements FOR SELECT
    TO authenticated
    USING (
        school_id IS NULL OR
        school_id IN (
            SELECT school_id FROM profiles WHERE id = auth.uid()
        )
    );

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

CREATE POLICY "Authors can update their own announcements"
    ON announcements FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete their own announcements"
    ON announcements FOR DELETE
    TO authenticated
    USING (author_id = auth.uid());

-- 6.12 Password Resets Policies
CREATE POLICY "Users can view their own password reset tokens"
    ON password_resets FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Service role can manage password resets"
    ON password_resets FOR ALL
    TO service_role
    USING (true);

-- =====================================================
-- 7. INSERT SAMPLE DATA (OPTIONAL - for testing)
-- =====================================================

-- Insert sample school
INSERT INTO schools (name, level, address, latitude, longitude, location_name, radius, location_attendance_enabled)
VALUES 
    ('Yayasan Fathus Salafi', 'SMP', 'Jember, Jawa Timur', -7.653938, 114.042504, 'Jember, Jawa Timur', 100, true)
ON CONFLICT DO NOTHING;

-- Note: Untuk insert user, gunakan Supabase Auth API
-- Profiles akan di-create melalui aplikasi setelah user signup

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema public
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant all on tables to postgres and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Grant select on tables to authenticated users (RLS will handle the rest)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- 9. CREATE VIEWS (OPTIONAL - untuk kemudahan query)
-- =====================================================

-- View untuk melihat class members dengan detail
CREATE OR REPLACE VIEW v_class_members_detail AS
SELECT 
    cm.id,
    cm.class_id,
    c.name as class_name,
    cm.profile_id,
    p.full_name as member_name,
    p.role as member_role,
    cm.role as class_role,
    c.school_id,
    s.name as school_name
FROM class_members cm
JOIN classes c ON cm.class_id = c.id
JOIN profiles p ON cm.profile_id = p.id
JOIN schools s ON c.school_id = s.id;

-- View untuk attendance report
CREATE OR REPLACE VIEW v_attendance_report AS
SELECT 
    a.id,
    a.date,
    p_student.full_name as student_name,
    p_student.identity_number as student_number,
    c.name as class_name,
    sub.name as subject_name,
    p_teacher.full_name as teacher_name,
    a.status,
    s.name as school_name,
    a.teacher_latitude,
    a.teacher_longitude,
    a.teacher_location_name
FROM attendances a
JOIN profiles p_student ON a.student_id = p_student.id
JOIN profiles p_teacher ON a.teacher_id = p_teacher.id
JOIN classes c ON a.class_id = c.id
JOIN subjects sub ON a.subject_id = sub.id
JOIN schools s ON c.school_id = s.id;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

COMMIT;

-- Verification queries (run after setup)
SELECT 'Schools count: ' || COUNT(*) FROM schools;
SELECT 'Profiles count: ' || COUNT(*) FROM profiles;
SELECT 'Classes count: ' || COUNT(*) FROM classes;
SELECT 'Subjects count: ' || COUNT(*) FROM subjects;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('schools', 'profiles', 'classes', 'subjects', 'attendances')
ORDER BY tablename;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📋 Tables created: schools, profiles, classes, subjects, class_members, class_schedules, attendances, teacher_attendance, grades, teaching_journals, announcements, password_resets';
    RAISE NOTICE '🔒 Row Level Security (RLS) enabled on all tables';
    RAISE NOTICE '📍 Location-based attendance feature ready (default: disabled per school)';
    RAISE NOTICE '🚀 Next step: Configure Supabase Auth and create admin user through your application';
END $$;

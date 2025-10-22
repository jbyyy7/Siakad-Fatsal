-- =====================================================
-- SAFE MIGRATION - STEP BY STEP WITH CHECKS
-- Jalankan ini SETELAH 00_ADD_STAFF_ENUM.sql
-- =====================================================

-- =====================================================
-- STEP 1: CREATE MISSING TABLES
-- =====================================================

-- Password Resets
CREATE TABLE IF NOT EXISTS public.password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teacher Attendance
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

-- Class Members
CREATE TABLE IF NOT EXISTS public.class_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, profile_id)
);

-- Notifications
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

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Step 1: Tables created';
END $$;

-- =====================================================
-- STEP 2: ADD MISSING COLUMNS
-- =====================================================

DO $$ 
BEGIN
    -- Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        RAISE NOTICE '✅ Added email column';
    END IF;

    -- Populate email from auth.users
    UPDATE public.profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.id = u.id 
    AND (p.email IS NULL OR p.email = '');
    
    RAISE NOTICE '✅ Step 2: Columns added and populated';
END $$;

-- =====================================================
-- STEP 3: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON public.password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON public.teacher_attendance(date);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher ON public.teacher_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_school ON public.teacher_attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_profile ON public.class_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON public.notifications(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_identity_number ON public.profiles(identity_number);

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Step 3: Indexes created';
END $$;

-- =====================================================
-- STEP 4: CREATE FUNCTIONS
-- =====================================================

-- Function: get email from identity number
CREATE OR REPLACE FUNCTION public.get_email_from_identity(identity_number_input text)
RETURNS text 
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
    user_email text;
BEGIN
    SELECT email INTO user_email
    FROM public.profiles 
    WHERE identity_number = identity_number_input 
    LIMIT 1;
    
    IF user_email IS NULL OR user_email = '' THEN
        SELECT u.email INTO user_email
        FROM public.profiles p
        JOIN auth.users u ON u.id = p.id
        WHERE p.identity_number = identity_number_input
        LIMIT 1;
    END IF;
    
    RETURN user_email;
END;
$$;

-- Function: delete user
CREATE OR REPLACE FUNCTION public.delete_user(uid uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  DELETE FROM public.class_members WHERE profile_id = uid;
  DELETE FROM public.teacher_attendance WHERE teacher_id = uid;
  DELETE FROM public.password_resets WHERE user_id = uid;
  DELETE FROM public.profiles WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- Function: update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_email_from_identity(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user(uuid) TO authenticated;

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Step 4: Functions created';
END $$;

-- =====================================================
-- STEP 5: CREATE TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS teacher_attendance_updated_at ON public.teacher_attendance;
CREATE TRIGGER teacher_attendance_updated_at
    BEFORE UPDATE ON public.teacher_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Step 5: Triggers created';
END $$;

-- =====================================================
-- STEP 6: ENABLE RLS
-- =====================================================

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Step 6: RLS enabled';
END $$;

-- =====================================================
-- STEP 7: RLS POLICIES - PASSWORD RESETS
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

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Step 7: Password reset policies created';
END $$;

-- =====================================================
-- STEP 8: RLS POLICIES - TEACHER ATTENDANCE
-- =====================================================

-- Admin
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

-- Staff
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

-- Principal
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

-- Teachers can view own
DROP POLICY IF EXISTS "Teachers can view own attendance" ON public.teacher_attendance;
CREATE POLICY "Teachers can view own attendance"
    ON public.teacher_attendance FOR SELECT
    TO authenticated
    USING (teacher_id = auth.uid());

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Step 8: Teacher attendance policies created';
END $$;

-- =====================================================
-- STEP 9: RLS POLICIES - STAFF ROLE (PROFILES)
-- =====================================================

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

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Step 9: Staff policies for profiles created';
END $$;

-- =====================================================
-- STEP 10: RLS POLICIES - STAFF ROLE (OTHER TABLES)
-- HANYA untuk tabel yang PASTI ADA
-- =====================================================

DO $$
DECLARE
    table_exists boolean;
BEGIN
    -- Check classes table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'classes'
    ) INTO table_exists;
    
    IF table_exists THEN
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
        
        RAISE NOTICE '✅ Classes policies created';
    ELSE
        RAISE NOTICE '⚠️  Table classes not found, skipping';
    END IF;

    -- Check subjects table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'subjects'
    ) INTO table_exists;
    
    IF table_exists THEN
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
        
        RAISE NOTICE '✅ Subjects policies created';
    ELSE
        RAISE NOTICE '⚠️  Table subjects not found, skipping';
    END IF;

    -- Check announcements table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'announcements'
    ) INTO table_exists;
    
    IF table_exists THEN
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
        
        RAISE NOTICE '✅ Announcements policies created';
    ELSE
        RAISE NOTICE '⚠️  Table announcements not found, skipping';
    END IF;
END $$;

-- =====================================================
-- STEP 11: RLS POLICIES - CLASS MEMBERS
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

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Step 11: Class members policies created';
END $$;

-- =====================================================
-- STEP 12: RLS POLICIES - NOTIFICATIONS
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

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Step 12: Notifications policies created';
END $$;

-- =====================================================
-- STEP 13: GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_resets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.teacher_attendance_id_seq TO authenticated;

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Step 13: Permissions granted';
END $$;

-- =====================================================
-- DONE! 🎉
-- =====================================================

DO $$ 
BEGIN 
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next Steps:';
    RAISE NOTICE '1. Check Table Editor untuk tabel baru';
    RAISE NOTICE '2. Buat user Staff untuk testing';
    RAISE NOTICE '3. Test fitur teacher attendance';
    RAISE NOTICE '4. Deploy ke Vercel';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

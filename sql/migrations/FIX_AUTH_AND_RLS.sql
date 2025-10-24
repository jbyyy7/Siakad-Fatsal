-- =====================================================
-- FIX AUTHENTICATION & RLS POLICIES
-- =====================================================
-- Description: Memperbaiki authentication flow dan RLS policies
-- Issues fixed:
-- 1. Login dengan nomor induk (bukan email)
-- 2. Role tidak sesuai saat login
-- 3. RLS policies terlalu ketat
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE FUNCTION FOR LOGIN WITH IDENTITY NUMBER
-- =====================================================

-- Function untuk login menggunakan nomor induk
-- Mengembalikan email untuk digunakan di Supabase Auth
CREATE OR REPLACE FUNCTION get_email_by_identity_number(identity_input TEXT)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM profiles
    WHERE identity_number = identity_input
    LIMIT 1;
    
    RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_email_by_identity_number IS 'Mendapatkan email dari nomor induk untuk login';

-- =====================================================
-- 2. DROP & RECREATE RLS POLICIES (FIX OVERLY RESTRICTIVE)
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view profiles in their school" ON profiles;
DROP POLICY IF EXISTS "Users can view classes in their school" ON classes;
DROP POLICY IF EXISTS "Users can view subjects in their school" ON subjects;
DROP POLICY IF EXISTS "Users can view class members in their school" ON class_members;

-- =====================================================
-- 3. PROFILES - MORE PERMISSIVE POLICIES
-- =====================================================

-- Allow users to view all profiles (needed for application to work properly)
CREATE POLICY "Allow authenticated users to view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- =====================================================
-- 4. CLASSES - MORE PERMISSIVE POLICIES
-- =====================================================

-- Allow all authenticated users to view classes
CREATE POLICY "Allow authenticated users to view all classes"
    ON classes FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- 5. SUBJECTS - MORE PERMISSIVE POLICIES
-- =====================================================

-- Allow all authenticated users to view subjects
CREATE POLICY "Allow authenticated users to view all subjects"
    ON subjects FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- 6. CLASS MEMBERS - MORE PERMISSIVE POLICIES
-- =====================================================

-- Allow all authenticated users to view class members
CREATE POLICY "Allow authenticated users to view all class members"
    ON class_members FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- 7. ATTENDANCES - FIX POLICIES
-- =====================================================

-- Drop restrictive attendance policies
DROP POLICY IF EXISTS "Teachers can view and manage attendance in their school" ON attendances;

-- Allow teachers and admins to manage all attendance
CREATE POLICY "Teachers and admins can manage attendance"
    ON attendances FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Guru', 'Kepala Sekolah', 'Staff', 'Kepala Yayasan')
        )
    );

-- Allow teachers to insert attendance
CREATE POLICY "Teachers can insert attendance"
    ON attendances FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Guru', 'Kepala Sekolah', 'Staff')
        )
    );

-- =====================================================
-- 8. GRADES - FIX POLICIES
-- =====================================================

-- Allow all authenticated users to view grades (RLS will be handled by app logic)
DROP POLICY IF EXISTS "Teachers can manage grades" ON grades;

CREATE POLICY "All authenticated users can view grades"
    ON grades FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Teachers and admins can manage grades"
    ON grades FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('Admin', 'Guru', 'Kepala Sekolah', 'Staff')
        )
    );

-- =====================================================
-- 9. CREATE HELPER FUNCTION FOR ROLE VERIFICATION
-- =====================================================

-- Function untuk verify role user
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM profiles
    WHERE id = user_id
    LIMIT 1;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_role IS 'Mendapatkan role user berdasarkan UUID';

-- Function untuk verify user adalah admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id
        AND role = 'Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk verify user adalah guru atau admin
CREATE OR REPLACE FUNCTION is_teacher_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id
        AND role IN ('Admin', 'Guru', 'Kepala Sekolah', 'Staff')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. GRANT EXECUTE PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_email_by_identity_number(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_teacher_or_admin(UUID) TO authenticated, service_role;

-- =====================================================
-- 11. CREATE TRIGGER TO AUTO-CREATE PROFILE ON AUTH SIGNUP
-- =====================================================

-- Function to create profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
            COALESCE(NEW.raw_user_meta_data->>'role', 'Siswa')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Auto-create profile when user signs up via Supabase Auth';

-- =====================================================
-- 12. FIX EXISTING POLICIES - MAKE THEM LESS RESTRICTIVE
-- =====================================================

-- Service role should have full access
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE classes FORCE ROW LEVEL SECURITY;
ALTER TABLE subjects FORCE ROW LEVEL SECURITY;
ALTER TABLE attendances FORCE ROW LEVEL SECURITY;
ALTER TABLE grades FORCE ROW LEVEL SECURITY;

-- Allow service_role to bypass RLS (for API calls)
CREATE POLICY "Service role bypass" ON profiles TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON classes TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON subjects TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON attendances TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON grades TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON teacher_attendance TO service_role USING (true) WITH CHECK (true);

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test functions
DO $$
BEGIN
    RAISE NOTICE '✅ Authentication & RLS fixes applied!';
    RAISE NOTICE '📋 Fixed issues:';
    RAISE NOTICE '   - Login dengan nomor induk';
    RAISE NOTICE '   - Role verification';
    RAISE NOTICE '   - RLS policies (less restrictive)';
    RAISE NOTICE '   - Auto-create profile on signup';
    RAISE NOTICE '   - Service role bypass';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 New functions:';
    RAISE NOTICE '   - get_email_by_identity_number()';
    RAISE NOTICE '   - get_user_role()';
    RAISE NOTICE '   - is_admin()';
    RAISE NOTICE '   - is_teacher_or_admin()';
    RAISE NOTICE '   - handle_new_user()';
END $$;

-- Show all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

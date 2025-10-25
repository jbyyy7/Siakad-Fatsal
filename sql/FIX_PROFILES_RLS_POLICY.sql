    -- ========================================
    -- FIX: RLS Policy untuk profiles
    -- ========================================
    -- Supaya semua role bisa read profiles yang diperlukan

    -- 1. DROP semua existing policies yang mungkin restrictive
    -- DROP OLD policies
    DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
    DROP POLICY IF EXISTS "Admin can manage profiles" ON profiles;
    DROP POLICY IF EXISTS "Staff can manage profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Public profiles readable by authenticated users" ON profiles;
    DROP POLICY IF EXISTS "Admin and Staff can manage all profiles" ON profiles;

    -- DROP NEW policies (case sensitive!)
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    DROP POLICY IF EXISTS "Admin can manage all profiles" ON profiles;
    DROP POLICY IF EXISTS "Staff can manage their school profiles" ON profiles;
    DROP POLICY IF EXISTS "Teachers can view their students" ON profiles;
    DROP POLICY IF EXISTS "Principals can view their school profiles" ON profiles;
    DROP POLICY IF EXISTS "Foundation heads can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Students can view classmates and teachers" ON profiles;

    -- 2. ENABLE RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- 3. CREATE COMPREHENSIVE POLICIES

    -- Policy 1: Semua authenticated users bisa lihat profile sendiri
    CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

    -- Policy 2: Admin - Full Access ke SEMUA profiles
    CREATE POLICY "Admin can manage all profiles"
    ON profiles
    FOR ALL
    TO authenticated
    USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'Admin'
    )
    )
    WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'Admin'
    )
    );

    -- Policy 3: Staff - Full Access ONLY ke profiles di sekolahnya
    CREATE POLICY "Staff can manage their school profiles"
    ON profiles
    FOR ALL
    TO authenticated
    USING (
    EXISTS (
        SELECT 1 FROM profiles staff
        WHERE staff.id = auth.uid()
        AND staff.role = 'Staff'
        AND (
        profiles.school_id = staff.school_id
        OR profiles.id = staff.id  -- Bisa edit profile sendiri
        )
    )
    )
    WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles staff
        WHERE staff.id = auth.uid()
        AND staff.role = 'Staff'
        AND (
        profiles.school_id = staff.school_id
        OR profiles.id = staff.id
        )
    )
    );

    -- Policy 4: Guru bisa lihat siswa di kelasnya
    CREATE POLICY "Teachers can view their students"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
    -- Lihat profile sendiri
    id = auth.uid()
    OR
    -- Lihat siswa di kelas yang diajar
    (
        profiles.id IN (
        SELECT cm.profile_id FROM class_members cm
        WHERE cm.role = 'student'
        AND cm.class_id IN (
            -- Kelas yang diajar (via class_schedules)
            SELECT DISTINCT class_id FROM class_schedules WHERE teacher_id = auth.uid()
            UNION
            -- Kelas sebagai wali kelas
            SELECT id FROM classes WHERE homeroom_teacher_id = auth.uid()
        )
        )
    )
    OR
    -- Lihat guru/staff di sekolah yang sama (tanpa query profiles untuk cek role)
    (
        profiles.school_id IN (
        SELECT school_id FROM class_schedules cs
        JOIN classes c ON c.id = cs.class_id
        WHERE cs.teacher_id = auth.uid()
        UNION
        SELECT school_id FROM classes WHERE homeroom_teacher_id = auth.uid()
        )
        AND profiles.role IN ('Guru', 'Kepala Sekolah', 'Staff')
    )
    );

-- Policy 5: Kepala Sekolah bisa lihat semua di sekolahnya
-- Catatan: Tidak ada relasi khusus untuk Kepala Sekolah di database
-- Solusi: Kombinasikan dengan policy Admin/Staff yang sudah cover school_id scoping
-- Policy ini di-skip untuk menghindari rekursi
-- Kepala Sekolah bisa menggunakan policy "Users can view their own profile"
-- dan bergantung pada Staff policy jika mereka juga punya role Staff    -- Policy 6: Kepala Yayasan bisa lihat SEMUA
    -- Catatan: Kita asumsikan tidak ada field khusus untuk Kepala Yayasan
    -- Jadi kita skip policy ini untuk menghindari rekursi
    -- Jika ada field khusus (misal foundation_id), bisa ditambahkan nanti

    -- Policy 7: Siswa bisa lihat teman sekelas dan guru mereka
    CREATE POLICY "Students can view classmates and teachers"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
    -- Lihat profile sendiri
    id = auth.uid()
    OR
    -- Lihat teman sekelas (tanpa cek role di profiles)
    (
        profiles.id IN (
        SELECT cm.profile_id FROM class_members cm
        WHERE cm.class_id IN (
            SELECT class_id FROM class_members WHERE profile_id = auth.uid()
        )
        )
    )
    OR
    -- Lihat guru yang mengajar di kelasnya
    (
        profiles.id IN (
        SELECT DISTINCT teacher_id FROM class_schedules
        WHERE class_id IN (
            SELECT class_id FROM class_members WHERE profile_id = auth.uid()
        )
        )
    )
    OR
    -- Lihat wali kelas
    (
        profiles.id IN (
        SELECT homeroom_teacher_id FROM classes
        WHERE id IN (
            SELECT class_id FROM class_members WHERE profile_id = auth.uid()
        )
        )
    )
    );

    -- ========================================
    -- VERIFICATION
    -- ========================================

    SELECT 
        policyname,
        cmd,
        roles,
        qual
    FROM pg_policies 
    WHERE tablename = 'profiles'
    ORDER BY policyname;

    -- ========================================
    -- ROLLBACK (jika ada masalah)
    -- ========================================

    -- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

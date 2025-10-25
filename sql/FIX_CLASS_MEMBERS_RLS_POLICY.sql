-- ========================================
-- FIX: RLS Policy untuk class_members
-- ========================================
-- Issue: Hanya Admin & Staff yang bisa read class_members
-- Fix: Tambahkan policy untuk Guru, Kepala Sekolah, Kepala Yayasan

-- 1. DROP semua existing policies
DROP POLICY IF EXISTS "Admin dan Staff dapat manage class_members" ON class_members;
DROP POLICY IF EXISTS "Users can view class_members" ON class_members;
DROP POLICY IF EXISTS "Admin can manage class_members" ON class_members;
DROP POLICY IF EXISTS "Staff can manage class_members" ON class_members;
DROP POLICY IF EXISTS "Teachers can view their class members" ON class_members;
DROP POLICY IF EXISTS "Principals can view their school class members" ON class_members;
DROP POLICY IF EXISTS "Foundation heads can view all class members" ON class_members;
DROP POLICY IF EXISTS "Students can view their own class members" ON class_members;

-- 2. ENABLE RLS (pastikan RLS aktif)
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

-- 3. CREATE COMPREHENSIVE POLICIES

-- Policy 1: Admin - Full Access to ALL (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin can manage all class members"
ON class_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'Admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'Admin'
  )
);

-- Policy 2: Staff - Full Access ONLY to their school (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Staff can manage their school class members"
ON class_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles staff
    WHERE staff.id = auth.uid()
    AND staff.role = 'Staff'
    AND class_members.class_id IN (
      SELECT c.id FROM classes c
      WHERE c.school_id = staff.school_id
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles staff
    WHERE staff.id = auth.uid()
    AND staff.role = 'Staff'
    AND class_members.class_id IN (
      SELECT c.id FROM classes c
      WHERE c.school_id = staff.school_id
    )
  )
);

-- Policy 3: Guru - Bisa lihat siswa di kelas yang diajar (SELECT only)
CREATE POLICY "Teachers can view their class members"
ON class_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'Guru'
    AND (
      -- Guru adalah wali kelas
      class_members.class_id IN (
        SELECT id FROM classes WHERE homeroom_teacher_id = auth.uid()
      )
      OR
      -- Guru mengajar di kelas tersebut (via class_schedules)
      class_members.class_id IN (
        SELECT DISTINCT class_id FROM class_schedules WHERE teacher_id = auth.uid()
      )
    )
  )
);

-- Policy 4: Kepala Sekolah - Bisa lihat semua class members di sekolahnya (SELECT only)
CREATE POLICY "Principals can view their school class members"
ON class_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'Kepala Sekolah'
    AND class_members.class_id IN (
      SELECT c.id FROM classes c
      WHERE c.school_id = p.school_id
    )
  )
);

-- Policy 5: Kepala Yayasan - Bisa lihat SEMUA class members (SELECT only)
CREATE POLICY "Foundation heads can view all class members"
ON class_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'Kepala Yayasan'
  )
);

-- Policy 6: Siswa - Bisa lihat teman sekelas (SELECT only)
CREATE POLICY "Students can view their classmates"
ON class_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'Siswa'
    AND class_members.class_id IN (
      SELECT class_id FROM class_members 
      WHERE profile_id = auth.uid() AND role = 'student'
    )
  )
);

-- ========================================
-- VERIFICATION
-- ========================================

-- Cek semua policies yang baru dibuat
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'class_members'
ORDER BY policyname;

-- Expected policies:
-- 1. Admin can manage all class members (ALL) - semua sekolah
-- 2. Staff can manage their school class members (ALL) - sekolahnya saja
-- 3. Teachers can view their class members (SELECT)
-- 4. Principals can view their school class members (SELECT)
-- 5. Foundation heads can view all class members (SELECT)
-- 6. Students can view their classmates (SELECT)

-- ========================================
-- TEST QUERIES
-- ========================================

-- Test 1: Cek apakah guru bisa lihat class_members sekarang
-- (Jalankan setelah login sebagai guru)
SELECT * FROM class_members
WHERE class_id IN (
  SELECT id FROM classes WHERE homeroom_teacher_id = auth.uid()
);

-- Test 2: Count students per class (harus bisa diakses semua role)
SELECT 
    c.name as class_name,
    COUNT(cm.id) as student_count
FROM classes c
LEFT JOIN class_members cm ON cm.class_id = c.id AND cm.role = 'student'
GROUP BY c.id, c.name
ORDER BY c.name;

-- ========================================
-- ROLLBACK (jika ada masalah)
-- ========================================

-- Jika policy baru bermasalah, disable RLS sementara:
-- ALTER TABLE class_members DISABLE ROW LEVEL SECURITY;

-- Atau hapus semua policies dan mulai dari awal:
-- DROP POLICY IF EXISTS "Admin and Staff can manage all class members" ON class_members;
-- DROP POLICY IF EXISTS "Teachers can view their class members" ON class_members;
-- DROP POLICY IF EXISTS "Principals can view their school class members" ON class_members;
-- DROP POLICY IF EXISTS "Foundation heads can view all class members" ON class_members;
-- DROP POLICY IF EXISTS "Students can view their classmates" ON class_members;

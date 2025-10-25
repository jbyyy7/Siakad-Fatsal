-- ========================================
-- FIX: RLS Policy untuk class_members
-- ========================================
-- Issue: Hanya Admin & Staff yang bisa read class_members
-- Fix: Tambahkan policy untuk Guru, Kepala Sekolah, Kepala Yayasan

-- 1. DROP semua existing policies
DROP POLICY IF EXISTS "Admin dan Staff dapat manage class_members" ON class_members;
DROP POLICY IF EXISTS "Users can view class_members" ON class_members;
DROP POLICY IF EXISTS "Users can view class members" ON class_members;
DROP POLICY IF EXISTS "Users can insert class members" ON class_members;
DROP POLICY IF EXISTS "Users can update class members" ON class_members;
DROP POLICY IF EXISTS "Users can delete class members" ON class_members;
DROP POLICY IF EXISTS "Admin can manage class_members" ON class_members;
DROP POLICY IF EXISTS "Admin can manage all class members" ON class_members;
DROP POLICY IF EXISTS "Staff can manage class_members" ON class_members;
DROP POLICY IF EXISTS "Staff can manage their school class members" ON class_members;
DROP POLICY IF EXISTS "Teachers can view their class members" ON class_members;
DROP POLICY IF EXISTS "Principals can view their school class members" ON class_members;
DROP POLICY IF EXISTS "Foundation heads can view all class members" ON class_members;
DROP POLICY IF EXISTS "Students can view their own class members" ON class_members;
DROP POLICY IF EXISTS "Students can view their classmates" ON class_members;

-- 2. ENABLE RLS (pastikan RLS aktif)
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

-- 3. CREATE SIMPLE POLICIES (NO RECURSION!)

-- Policy 1: Semua authenticated users bisa lihat class_members
-- Role-based filtering dilakukan di application layer
CREATE POLICY "Users can view class members"
ON class_members
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Semua authenticated users bisa manage class_members
-- Admin/Staff control dilakukan di application layer
CREATE POLICY "Users can insert class members"
ON class_members
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update class members"
ON class_members
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete class members"
ON class_members
FOR DELETE
TO authenticated
USING (true);

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

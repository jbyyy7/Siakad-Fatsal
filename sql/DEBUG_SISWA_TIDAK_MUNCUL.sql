-- ========================================
-- DEBUG: Siswa Tidak Muncul di Role Guru
-- ========================================
-- Issue: Admin lihat 1 siswa di Kelas A, tapi Guru lihat 0 siswa
-- Troubleshooting queries

-- 1. CEK DATA DI TABLE CLASS_MEMBERS
-- Lihat semua data di table class_members untuk Kelas A
SELECT 
    cm.id,
    cm.class_id,
    cm.profile_id,
    cm.role,
    c.name as class_name,
    p.full_name as member_name,
    p.role as profile_role
FROM class_members cm
LEFT JOIN classes c ON c.id = cm.class_id
LEFT JOIN profiles p ON p.id = cm.profile_id
WHERE c.name = 'Kelas A'
ORDER BY cm.role, p.full_name;

-- Expected: Harus ada row dengan role='student'


-- 2. CEK STUDENTS SAJA
-- Filter hanya siswa di Kelas A
SELECT 
    cm.id,
    cm.class_id,
    cm.profile_id,
    p.full_name as student_name,
    p.email,
    p.identity_number,
    p.school_id,
    s.name as school_name
FROM class_members cm
JOIN profiles p ON p.id = cm.profile_id
LEFT JOIN schools s ON s.id = p.school_id
WHERE cm.class_id = (SELECT id FROM classes WHERE name = 'Kelas A' LIMIT 1)
  AND cm.role = 'student';

-- Expected: Harus return minimal 1 row (siswa yang ditambahkan admin)


-- 3. CEK KELAS YANG DIAJAR GURU
-- Cari kelas yang diajar oleh Malikatul Mahbubah
SELECT 
    c.id,
    c.name,
    c.homeroom_teacher_id,
    ht.full_name as homeroom_teacher_name,
    (SELECT COUNT(*) FROM class_members WHERE class_id = c.id AND role = 'student') as student_count
FROM classes c
LEFT JOIN profiles ht ON ht.id = c.homeroom_teacher_id
WHERE c.homeroom_teacher_id = (SELECT id FROM profiles WHERE full_name = 'Malikatul Mahbubah' LIMIT 1)
   OR c.id IN (
       SELECT DISTINCT class_id 
       FROM class_schedules 
       WHERE teacher_id = (SELECT id FROM profiles WHERE full_name = 'Malikatul Mahbubah' LIMIT 1)
   );

-- Expected: Harus return Kelas A dengan student_count > 0


-- 4. CEK RLS POLICIES DI TABLE PROFILES
-- Lihat apakah ada RLS policy yang block read
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check: Apakah ada policy yang restrict SELECT untuk role tertentu?


-- 5. CEK RLS POLICIES DI TABLE CLASS_MEMBERS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'class_members'
ORDER BY policyname;

-- Check: Apakah guru bisa read class_members?


-- 6. TEST QUERY EXACT SEPERTI CODE
-- Simulasi query yang dijalankan oleh getStudentsInClass()
-- Ganti 'CLASS_ID_KELAS_A' dengan ID class Kelas A
SELECT 
    p.*,
    s.name as school_name
FROM class_members cm
JOIN profiles p ON p.id = cm.profile_id
LEFT JOIN schools s ON s.id = p.school_id
WHERE cm.class_id = 'CLASS_ID_KELAS_A'  -- GANTI DENGAN ID ASLI
  AND cm.role = 'student';


-- 7. CEK APAKAH PROFILE_ID NULL
-- Kadang ada bug dimana profile_id tidak ter-set
SELECT 
    cm.id,
    cm.class_id,
    cm.profile_id,
    cm.role,
    CASE 
        WHEN cm.profile_id IS NULL THEN '❌ NULL'
        ELSE '✅ OK'
    END as status
FROM class_members cm
WHERE cm.class_id = (SELECT id FROM classes WHERE name = 'Kelas A' LIMIT 1);


-- 8. FULL DIAGNOSTIC
-- Gabungan semua info
WITH kelas_a AS (
    SELECT id FROM classes WHERE name = 'Kelas A' LIMIT 1
),
members AS (
    SELECT 
        cm.id,
        cm.profile_id,
        cm.role,
        p.full_name,
        p.role as profile_role
    FROM class_members cm
    LEFT JOIN profiles p ON p.id = cm.profile_id
    WHERE cm.class_id = (SELECT id FROM kelas_a)
)
SELECT 
    'Total Members' as metric,
    COUNT(*)::text as value
FROM members
UNION ALL
SELECT 
    'Students (role=student)' as metric,
    COUNT(*)::text as value
FROM members
WHERE role = 'student'
UNION ALL
SELECT 
    'NULL profile_id' as metric,
    COUNT(*)::text as value
FROM members
WHERE profile_id IS NULL
UNION ALL
SELECT 
    'Students with profile' as metric,
    COUNT(*)::text as value
FROM members
WHERE role = 'student' AND profile_id IS NOT NULL;


-- ========================================
-- SOLUSI JIKA DITEMUKAN MASALAH
-- ========================================

-- JIKA: profile_id NULL di class_members
-- FIX: Update dengan ID siswa yang benar
-- UPDATE class_members 
-- SET profile_id = 'STUDENT_ID'
-- WHERE id = 'CLASS_MEMBER_ID';

-- JIKA: role tidak 'student' (typo: 'siswa', 'Student', etc)
-- FIX: Standardisasi ke 'student'
-- UPDATE class_members 
-- SET role = 'student'
-- WHERE role ILIKE '%student%' OR role ILIKE '%siswa%';

-- JIKA: RLS policy block
-- FIX: Disable RLS sementara untuk testing
-- ALTER TABLE class_members DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- (Test dulu, kalau work berarti RLS policy yang salah)

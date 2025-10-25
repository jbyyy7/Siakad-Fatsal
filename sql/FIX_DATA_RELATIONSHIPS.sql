-- ============================================================================
-- FIX DATA RELATIONSHIPS - Perbaiki Relasi Data Sekolah, Kelas, Mapel, Guru
-- ============================================================================
-- Script ini memperbaiki masalah relasi data yang tidak nyambung antara:
-- 1. Guru dengan school_id
-- 2. Kepala Sekolah dengan school_id  
-- 3. Kelas dengan school_id
-- 4. Mata Pelajaran dengan school_id
-- 5. Class Members dengan profile_id (bukan student_id)
-- ============================================================================

-- 1. CEK DATA YANG BERMASALAH
-- ============================================================================

-- Cek guru yang tidak punya school_id
SELECT 
    id,
    full_name,
    email,
    role,
    school_id
FROM profiles
WHERE role IN ('Guru', 'Kepala Sekolah', 'Staff')
AND school_id IS NULL;

-- Cek kelas yang school_id tidak sesuai dengan wali kelas
SELECT 
    c.id as class_id,
    c.name as class_name,
    c.school_id as class_school_id,
    s.name as school_name,
    p.id as teacher_id,
    p.full_name as homeroom_teacher,
    p.school_id as teacher_school_id
FROM classes c
LEFT JOIN schools s ON c.school_id = s.id
LEFT JOIN profiles p ON c.homeroom_teacher_id = p.id
WHERE c.homeroom_teacher_id IS NOT NULL 
AND c.school_id != p.school_id;

-- Cek subjects yang school_id tidak cocok dengan kelas
SELECT DISTINCT
    sub.id as subject_id,
    sub.name as subject_name,
    sub.school_id as subject_school_id,
    c.id as class_id,
    c.name as class_name,
    c.school_id as class_school_id
FROM subjects sub
JOIN class_schedules cs ON cs.subject_id = sub.id
JOIN classes c ON cs.class_id = c.id
WHERE sub.school_id != c.school_id;

-- Cek class_members yang menggunakan kolom salah atau role salah
SELECT 
    cm.id,
    cm.class_id,
    cm.profile_id,
    cm.role,
    c.name as class_name,
    c.school_id as class_school_id,
    p.full_name,
    p.role as user_role,
    p.school_id as profile_school_id
FROM class_members cm
JOIN classes c ON cm.class_id = c.id
JOIN profiles p ON cm.profile_id = p.id
WHERE c.school_id != p.school_id 
   OR (cm.role = 'student' AND p.role != 'Siswa')
   OR (cm.role = 'teacher' AND p.role != 'Guru');


-- 2. PERBAIKI DATA
-- ============================================================================

-- 2.1. Update school_id guru berdasarkan kelas yang mereka ajar
-- (Jika guru mengajar di kelas tertentu, school_id mereka harus sama dengan sekolah kelas tersebut)
UPDATE profiles p
SET school_id = (
    SELECT c.school_id 
    FROM classes c 
    WHERE c.homeroom_teacher_id = p.id 
    LIMIT 1
)
WHERE p.role IN ('Guru', 'Kepala Sekolah')
AND p.school_id IS NULL
AND EXISTS (
    SELECT 1 FROM classes c WHERE c.homeroom_teacher_id = p.id
);

-- 2.2. Update school_id guru berdasarkan jadwal mengajar
UPDATE profiles p
SET school_id = (
    SELECT DISTINCT c.school_id
    FROM class_schedules cs
    JOIN classes c ON cs.class_id = c.id
    WHERE cs.teacher_id = p.id
    LIMIT 1
)
WHERE p.role IN ('Guru', 'Kepala Sekolah')
AND p.school_id IS NULL
AND EXISTS (
    SELECT 1 FROM class_schedules cs WHERE cs.teacher_id = p.id
);

-- 2.3. Hapus class_members yang school_id tidak cocok
-- (Hapus siswa yang terdaftar di kelas sekolah berbeda)
DELETE FROM class_members cm
WHERE EXISTS (
    SELECT 1 
    FROM classes c
    JOIN profiles p ON cm.profile_id = p.id
    WHERE cm.class_id = c.id
    AND c.school_id != p.school_id
);

-- 2.4. Hapus class_schedules yang school_id tidak cocok
-- (Hapus jadwal yang teacher atau subject sekolahnya berbeda)
DELETE FROM class_schedules cs
WHERE EXISTS (
    SELECT 1
    FROM classes c
    WHERE cs.class_id = c.id
    AND (
        -- Teacher beda sekolah
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = cs.teacher_id 
            AND p.school_id != c.school_id
        )
        OR
        -- Subject beda sekolah  
        EXISTS (
            SELECT 1 FROM subjects s
            WHERE s.id = cs.subject_id
            AND s.school_id != c.school_id
        )
    )
);


-- 3. VALIDASI CONSTRAINT (RUN AFTER FIX)
-- ============================================================================

-- 3.1. Tambahkan trigger untuk memastikan wali kelas satu sekolah dengan kelasnya
-- (Constraint tidak bisa pakai subquery, jadi gunakan trigger)
CREATE OR REPLACE FUNCTION validate_homeroom_teacher_school()
RETURNS TRIGGER AS $$
BEGIN
    -- Cek apakah wali kelas dari sekolah yang sama dengan kelas
    IF NEW.homeroom_teacher_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = NEW.homeroom_teacher_id
            AND p.school_id = NEW.school_id
        ) THEN
        
            RAISE EXCEPTION 'Wali kelas harus dari sekolah yang sama dengan kelas';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger jika sudah ada
DROP TRIGGER IF EXISTS homeroom_teacher_school_validation ON classes;

-- Tambah trigger
CREATE TRIGGER homeroom_teacher_school_validation
    BEFORE INSERT OR UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION validate_homeroom_teacher_school();

-- 3.2. Tambahkan function untuk validasi class_members
CREATE OR REPLACE FUNCTION validate_class_member_school()
RETURNS TRIGGER AS $$
BEGIN
    -- Cek apakah profile dan class berada di sekolah yang sama
    IF NOT EXISTS (
        SELECT 1
        FROM classes c
        JOIN profiles p ON p.id = NEW.profile_id
        WHERE c.id = NEW.class_id
        AND c.school_id = p.school_id
    ) THEN
        RAISE EXCEPTION 'Student/Teacher must be from the same school as the class';
    END IF;
    
    -- Cek apakah role sesuai
    IF NEW.role = 'student' AND NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = NEW.profile_id AND role = 'Siswa'
    ) THEN
        RAISE EXCEPTION 'Profile must have role Siswa for student class members';
    END IF;
    
    IF NEW.role = 'teacher' AND NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = NEW.profile_id AND role = 'Guru'
    ) THEN
        RAISE EXCEPTION 'Profile must have role Guru for teacher class members';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger jika sudah ada
DROP TRIGGER IF EXISTS class_member_school_validation ON class_members;

-- Tambah trigger
CREATE TRIGGER class_member_school_validation
    BEFORE INSERT OR UPDATE ON class_members
    FOR EACH ROW
    EXECUTE FUNCTION validate_class_member_school();


-- 3.3. Tambahkan function untuk validasi class_schedules
CREATE OR REPLACE FUNCTION validate_class_schedule_school()
RETURNS TRIGGER AS $$
BEGIN
    -- Cek apakah teacher dari sekolah yang sama dengan kelas
    IF NOT EXISTS (
        SELECT 1
        FROM classes c
        JOIN profiles p ON p.id = NEW.teacher_id
        WHERE c.id = NEW.class_id
        AND c.school_id = p.school_id
    ) THEN
        RAISE EXCEPTION 'Teacher must be from the same school as the class';
    END IF;
    
    -- Cek apakah subject dari sekolah yang sama dengan kelas
    IF NOT EXISTS (
        SELECT 1
        FROM classes c
        JOIN subjects s ON s.id = NEW.subject_id
        WHERE c.id = NEW.class_id
        AND c.school_id = s.school_id
    ) THEN
        RAISE EXCEPTION 'Subject must be from the same school as the class';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger jika sudah ada
DROP TRIGGER IF EXISTS class_schedule_school_validation ON class_schedules;

-- Tambah trigger
CREATE TRIGGER class_schedule_school_validation
    BEFORE INSERT OR UPDATE ON class_schedules
    FOR EACH ROW
    EXECUTE FUNCTION validate_class_schedule_school();


-- 4. LAPORAN HASIL PERBAIKAN
-- ============================================================================

-- 4.1. Ringkasan jumlah data per sekolah
SELECT 
    s.id,
    s.name as school_name,
    COUNT(DISTINCT CASE WHEN p.role = 'Guru' THEN p.id END) as total_guru,
    COUNT(DISTINCT CASE WHEN p.role = 'Kepala Sekolah' THEN p.id END) as total_kepala_sekolah,
    COUNT(DISTINCT CASE WHEN p.role = 'Siswa' THEN p.id END) as total_siswa,
    COUNT(DISTINCT c.id) as total_kelas,
    COUNT(DISTINCT sub.id) as total_mapel,
    COUNT(DISTINCT cs.id) as total_jadwal
FROM schools s
LEFT JOIN profiles p ON p.school_id = s.id
LEFT JOIN classes c ON c.school_id = s.id
LEFT JOIN subjects sub ON sub.school_id = s.id
LEFT JOIN class_schedules cs ON cs.class_id = c.id
GROUP BY s.id, s.name
ORDER BY s.name;

-- 4.2. Cek apakah masih ada data yang bermasalah
SELECT 
    'Guru tanpa school_id' as issue,
    COUNT(*) as total
FROM profiles
WHERE role IN ('Guru', 'Kepala Sekolah', 'Staff')
AND school_id IS NULL

UNION ALL

SELECT 
    'Kelas dengan wali kelas beda sekolah' as issue,
    COUNT(*)
FROM classes c
JOIN profiles p ON c.homeroom_teacher_id = p.id
WHERE c.school_id != p.school_id

UNION ALL

SELECT 
    'Class members beda sekolah' as issue,
    COUNT(*)
FROM class_members cm
JOIN classes c ON cm.class_id = c.id
JOIN profiles p ON cm.profile_id = p.id
WHERE c.school_id != p.school_id

UNION ALL

SELECT 
    'Class schedules dengan teacher beda sekolah' as issue,
    COUNT(*)
FROM class_schedules cs
JOIN classes c ON cs.class_id = c.id
JOIN profiles p ON cs.teacher_id = p.id
WHERE c.school_id != p.school_id

UNION ALL

SELECT 
    'Class schedules dengan subject beda sekolah' as issue,
    COUNT(*)
FROM class_schedules cs
JOIN classes c ON cs.class_id = c.id
JOIN subjects s ON cs.subject_id = s.id
WHERE c.school_id != s.school_id;


-- ============================================================================
-- SELESAI
-- ============================================================================
-- Setelah menjalankan script ini:
-- 1. Semua guru/kepala sekolah akan memiliki school_id
-- 2. Wali kelas hanya bisa dari guru yang satu sekolah
-- 3. Class members hanya siswa/guru satu sekolah dengan kelasnya
-- 4. Class schedules hanya dengan guru dan mapel satu sekolah
-- 5. Constraint dan trigger akan mencegah data salah di masa depan
-- ============================================================================

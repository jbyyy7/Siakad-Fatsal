-- ============================================================================
-- FIX MISSING SCHOOL_ID - Assign school_id untuk Guru dan Siswa
-- ============================================================================
-- Masalah: Guru dan Siswa tidak punya school_id
-- Dampak: Dropdown kosong saat pilih sekolah di form kelas
-- Solusi: Assign school_id otomatis atau manual
-- ============================================================================

-- 1. CEK DATA YANG BERMASALAH
-- ============================================================================

-- Cek guru tanpa school_id
SELECT 
    id,
    full_name,
    email,
    role,
    school_id
FROM profiles
WHERE role = 'Guru'
AND school_id IS NULL;

-- Cek siswa tanpa school_id
SELECT 
    id,
    full_name,
    email,
    role,
    school_id
FROM profiles
WHERE role = 'Siswa'
AND school_id IS NULL;

-- Total guru dan siswa per sekolah
SELECT 
    COALESCE(s.name, '❌ TANPA SEKOLAH') as school_name,
    COUNT(CASE WHEN p.role = 'Guru' THEN 1 END) as total_guru,
    COUNT(CASE WHEN p.role = 'Siswa' THEN 1 END) as total_siswa
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.id
WHERE p.role IN ('Guru', 'Siswa')
GROUP BY s.name, p.school_id
ORDER BY s.name NULLS FIRST;


-- 2. SOLUSI AUTO - Assign ke Sekolah Pertama
-- ============================================================================
-- PERINGATAN: Ini akan assign SEMUA guru/siswa tanpa sekolah ke sekolah pertama
-- Gunakan hanya jika Anda hanya punya 1 sekolah atau untuk testing

-- Get ID sekolah pertama
DO $$
DECLARE
    first_school_id UUID;
BEGIN
    -- Get first school
    SELECT id INTO first_school_id FROM schools ORDER BY name LIMIT 1;
    
    IF first_school_id IS NOT NULL THEN
        -- Update guru tanpa school_id
        UPDATE profiles 
        SET school_id = first_school_id 
        WHERE role = 'Guru' 
        AND school_id IS NULL;
        
        RAISE NOTICE 'Updated % guru to school_id: %', 
            (SELECT COUNT(*) FROM profiles WHERE role = 'Guru' AND school_id = first_school_id),
            first_school_id;
        
        -- Update siswa tanpa school_id
        UPDATE profiles 
        SET school_id = first_school_id 
        WHERE role = 'Siswa' 
        AND school_id IS NULL;
        
        RAISE NOTICE 'Updated % siswa to school_id: %', 
            (SELECT COUNT(*) FROM profiles WHERE role = 'Siswa' AND school_id = first_school_id),
            first_school_id;
    ELSE
        RAISE EXCEPTION 'No schools found in database!';
    END IF;
END $$;


-- 3. SOLUSI MANUAL - Assign Spesifik per User
-- ============================================================================
-- Lebih aman: Assign manual berdasarkan nama atau email

-- Contoh: Assign berdasarkan nama sekolah di email
-- Misal: guru1@sma-jakarta.com → SMA Jakarta
UPDATE profiles p
SET school_id = s.id
FROM schools s
WHERE p.role IN ('Guru', 'Siswa')
AND p.school_id IS NULL
AND p.email LIKE '%' || LOWER(REPLACE(s.name, ' ', '-')) || '%';

-- Contoh: Assign manual satu per satu
-- UPDATE profiles 
-- SET school_id = '392d972b-6d4b-4b79-9d6a-0d08160c270f' -- Ganti dengan ID sekolah yang benar
-- WHERE id = 'user-id-here';


-- 4. SOLUSI INTERACTIVE - List semua user tanpa sekolah untuk review
-- ============================================================================
-- Copy hasil query ini untuk manual assignment di UI

SELECT 
    id,
    full_name,
    email,
    role,
    '-- UPDATE profiles SET school_id = ''PASTE-SCHOOL-ID-HERE'' WHERE id = ''' || id || ''';' as update_query
FROM profiles
WHERE role IN ('Guru', 'Siswa')
AND school_id IS NULL
ORDER BY role, full_name;


-- 5. VALIDASI SETELAH FIX
-- ============================================================================

-- Cek apakah masih ada yang NULL
SELECT 
    'Guru tanpa school_id' as issue,
    COUNT(*) as total
FROM profiles
WHERE role = 'Guru'
AND school_id IS NULL

UNION ALL

SELECT 
    'Siswa tanpa school_id' as issue,
    COUNT(*) as total
FROM profiles
WHERE role = 'Siswa'
AND school_id IS NULL;

-- Summary per sekolah (seharusnya tidak ada NULL)
SELECT 
    COALESCE(s.name, '⚠️ ERROR: MASIH ADA YANG NULL!') as school_name,
    s.id as school_id,
    COUNT(CASE WHEN p.role = 'Guru' THEN 1 END) as guru,
    COUNT(CASE WHEN p.role = 'Siswa' THEN 1 END) as siswa,
    COUNT(CASE WHEN p.role = 'Kepala Sekolah' THEN 1 END) as kepala_sekolah,
    COUNT(CASE WHEN p.role = 'Staff' THEN 1 END) as staff
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.id
WHERE p.role IN ('Guru', 'Siswa', 'Kepala Sekolah', 'Staff')
GROUP BY s.name, s.id
ORDER BY s.name NULLS FIRST;


-- ============================================================================
-- REKOMENDASI
-- ============================================================================
-- 1. Gunakan SOLUSI AUTO jika hanya ada 1 sekolah
-- 2. Gunakan SOLUSI MANUAL jika multi-sekolah
-- 3. Jalankan VALIDASI untuk memastikan tidak ada yang NULL
-- 4. Refresh halaman web setelah update database
-- ============================================================================

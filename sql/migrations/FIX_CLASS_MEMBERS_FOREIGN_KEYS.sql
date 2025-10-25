-- ============================================================================
-- FIX CLASS_MEMBERS FOREIGN KEYS - Perbaiki Foreign Key Relationship
-- ============================================================================
-- Masalah: Supabase tidak bisa detect relationship antara class_members dan profiles
-- Error: "Could not find a relationship between 'class_members' and 'profiles'"
-- Solusi: Drop dan recreate foreign key dengan nama yang jelas
-- ============================================================================

-- 1. CEK FOREIGN KEY YANG ADA
-- ============================================================================
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'class_members';


-- 2. DROP FOREIGN KEY LAMA (Jika Ada)
-- ============================================================================
-- Drop constraint lama yang mungkin tidak terdeteksi dengan baik
DO $$ 
DECLARE 
    constraint_name TEXT;
BEGIN
    -- Get constraint name for profile_id
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'class_members' 
    AND kcu.column_name = 'profile_id'
    AND tc.constraint_type = 'FOREIGN KEY';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE class_members DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
    
    -- Get constraint name for class_id
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'class_members' 
    AND kcu.column_name = 'class_id'
    AND tc.constraint_type = 'FOREIGN KEY';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE class_members DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END $$;


-- 3. RECREATE FOREIGN KEY DENGAN NAMA JELAS
-- ============================================================================
-- Tambah foreign key dengan nama yang jelas agar Supabase detect dengan baik
ALTER TABLE class_members
ADD CONSTRAINT class_members_profile_id_fkey 
FOREIGN KEY (profile_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

ALTER TABLE class_members
ADD CONSTRAINT class_members_class_id_fkey 
FOREIGN KEY (class_id) 
REFERENCES classes(id) 
ON DELETE CASCADE;


-- 4. VALIDASI FOREIGN KEY
-- ============================================================================
-- Cek apakah foreign key sudah benar
SELECT 
    tc.constraint_name,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'class_members'
ORDER BY kcu.column_name;


-- 5. REFRESH SUPABASE SCHEMA CACHE
-- ============================================================================
-- Setelah menjalankan script ini, lakukan di Supabase Dashboard:
-- 1. Settings → API → Reload schema cache
-- 2. Atau tunggu beberapa menit untuk auto-refresh
-- 3. Test query: SELECT * FROM class_members LIMIT 1

-- ============================================================================
-- SELESAI
-- ============================================================================
-- Setelah script ini:
-- ✅ Foreign key terdeteksi dengan benar
-- ✅ Query dengan JOIN akan bekerja
-- ✅ PostgREST bisa resolve relationship
-- ============================================================================

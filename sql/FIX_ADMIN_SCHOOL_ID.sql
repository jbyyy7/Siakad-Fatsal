-- ============================================
-- FIX ADMIN & KEPALA YAYASAN SCHOOL_ID
-- ============================================
-- Admin dan Kepala Yayasan TIDAK boleh terikat ke 1 sekolah
-- Karena mereka manage SEMUA sekolah
-- ============================================

-- Set school_id = NULL untuk Admin dan Kepala Yayasan
UPDATE public.profiles
SET school_id = NULL
WHERE role IN ('Admin', 'Kepala Yayasan')
AND school_id IS NOT NULL;

-- Cek hasilnya
SELECT 
  id,
  full_name,
  role,
  school_id,
  CASE 
    WHEN role IN ('Admin', 'Kepala Yayasan') AND school_id IS NULL THEN '✅ Benar'
    WHEN role IN ('Admin', 'Kepala Yayasan') AND school_id IS NOT NULL THEN '❌ Salah - Harusnya NULL'
    WHEN role IN ('Guru', 'Staff', 'Kepala Sekolah', 'Siswa') AND school_id IS NOT NULL THEN '✅ Benar'
    WHEN role IN ('Guru', 'Staff', 'Kepala Sekolah', 'Siswa') AND school_id IS NULL THEN '❌ Salah - Harusnya ada school_id'
    ELSE '❓ Unknown'
  END as status
FROM public.profiles
ORDER BY role, full_name;

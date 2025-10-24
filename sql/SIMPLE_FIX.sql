-- ============================================
-- SIMPLE FIX - DIJAMIN WORK!
-- ============================================
-- Jalankan script ini di Supabase SQL Editor
-- Aman dijalankan berkali-kali
-- ============================================

-- 1. TAMBAH FUNCTION YANG HILANG
-- ============================================

-- DROP function lama dulu (kalau ada)
DROP FUNCTION IF EXISTS public.get_email_from_identity(text);
DROP FUNCTION IF EXISTS public.check_email_exists(text);

-- Function untuk mengambil email dari identity_number
CREATE FUNCTION public.get_email_from_identity(identity_num text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM profiles
  WHERE identity_number = identity_num
  LIMIT 1;
  
  RETURN user_email;
END;
$$;

-- Function untuk cek email exists
CREATE FUNCTION public.check_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE email = email_to_check
  ) INTO email_exists;
  
  RETURN email_exists;
END;
$$;


-- 2. TAMBAH KOLOM LOKASI KE TABLE SCHOOLS
-- ============================================

-- Cek dan tambah kolom latitude
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN latitude numeric(10, 8);
    RAISE NOTICE 'Kolom latitude ditambahkan ke schools';
  ELSE
    RAISE NOTICE 'Kolom latitude sudah ada di schools';
  END IF;
END $$;

-- Cek dan tambah kolom longitude
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN longitude numeric(11, 8);
    RAISE NOTICE 'Kolom longitude ditambahkan ke schools';
  ELSE
    RAISE NOTICE 'Kolom longitude sudah ada di schools';
  END IF;
END $$;

-- Cek dan tambah kolom location_radius
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'location_radius'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN location_radius integer DEFAULT 100;
    RAISE NOTICE 'Kolom location_radius ditambahkan ke schools';
  ELSE
    RAISE NOTICE 'Kolom location_radius sudah ada di schools';
  END IF;
END $$;

-- Cek dan tambah kolom location_attendance_enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'schools' 
    AND column_name = 'location_attendance_enabled'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN location_attendance_enabled boolean DEFAULT false;
    RAISE NOTICE 'Kolom location_attendance_enabled ditambahkan ke schools';
  ELSE
    RAISE NOTICE 'Kolom location_attendance_enabled sudah ada di schools';
  END IF;
END $$;


-- 3. TAMBAH KOLOM LOKASI KE TABLE ATTENDANCES (untuk tracking lokasi guru)
-- ============================================

-- Cek dan tambah kolom teacher_latitude
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendances' 
    AND column_name = 'teacher_latitude'
  ) THEN
    ALTER TABLE public.attendances ADD COLUMN teacher_latitude numeric(10, 8);
    RAISE NOTICE 'Kolom teacher_latitude ditambahkan ke attendances';
  ELSE
    RAISE NOTICE 'Kolom teacher_latitude sudah ada di attendances';
  END IF;
END $$;

-- Cek dan tambah kolom teacher_longitude
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'attendances' 
    AND column_name = 'teacher_longitude'
  ) THEN
    ALTER TABLE public.attendances ADD COLUMN teacher_longitude numeric(11, 8);
    RAISE NOTICE 'Kolom teacher_longitude ditambahkan ke attendances';
  ELSE
    RAISE NOTICE 'Kolom teacher_longitude sudah ada di attendances';
  END IF;
END $$;


-- 4. TAMBAH KOLOM LOKASI KE TABLE TEACHER_ATTENDANCE
-- ============================================

-- Cek dan tambah kolom latitude
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teacher_attendance' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.teacher_attendance ADD COLUMN latitude numeric(10, 8);
    RAISE NOTICE 'Kolom latitude ditambahkan ke teacher_attendance';
  ELSE
    RAISE NOTICE 'Kolom latitude sudah ada di teacher_attendance';
  END IF;
END $$;

-- Cek dan tambah kolom longitude
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teacher_attendance' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.teacher_attendance ADD COLUMN longitude numeric(11, 8);
    RAISE NOTICE 'Kolom longitude ditambahkan ke teacher_attendance';
  ELSE
    RAISE NOTICE 'Kolom longitude sudah ada di teacher_attendance';
  END IF;
END $$;


-- 5. BUAT TABLE CLASS_SCHEDULES (jika belum ada)
-- ============================================

CREATE TABLE IF NOT EXISTS public.class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_class_schedules_class_id ON public.class_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_teacher_id ON public.class_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day ON public.class_schedules(day_of_week);

-- RLS Policy untuk class_schedules
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

-- Drop policy jika sudah ada (untuk avoid duplikat)
DROP POLICY IF EXISTS "Authenticated users can view class schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Teachers can manage their class schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Staff can manage class schedules in their school" ON public.class_schedules;

-- Buat policy baru
CREATE POLICY "Authenticated users can view class schedules"
  ON public.class_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage their class schedules"
  ON public.class_schedules FOR ALL
  TO authenticated
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('Admin', 'Kepala Sekolah', 'Staff', 'Kepala Yayasan')
    )
  );


-- 6. FIX SCHOOL_ID NULL PADA PROFILES
-- ============================================
-- Update semua profiles yang belum punya school_id
-- Ambil school_id pertama yang ada di database

DO $$ 
DECLARE
  default_school_id uuid;
BEGIN
  -- Ambil school_id pertama
  SELECT id INTO default_school_id FROM public.schools LIMIT 1;
  
  IF default_school_id IS NOT NULL THEN
    -- Update profiles yang school_id-nya NULL
    UPDATE public.profiles
    SET school_id = default_school_id
    WHERE school_id IS NULL 
    AND role IN ('Guru', 'Staff', 'Kepala Sekolah', 'Admin', 'Siswa');
    
    RAISE NOTICE 'School ID updated untuk profiles yang NULL';
  ELSE
    RAISE NOTICE 'Tidak ada school di database, buat sekolah dulu!';
  END IF;
END $$;


-- ============================================
-- SELESAI! 
-- ============================================
-- Cek hasilnya dengan:
-- SELECT * FROM schools LIMIT 1;
-- SELECT * FROM class_schedules LIMIT 1;
-- SELECT id, full_name, role, school_id FROM profiles;
-- 
-- Test function dengan:
-- SELECT get_email_from_identity('NIS123');
-- ============================================

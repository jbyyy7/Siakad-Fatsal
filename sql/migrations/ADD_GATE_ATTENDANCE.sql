-- ============================================
-- GATE ATTENDANCE SYSTEM
-- ============================================
-- Track student check-in/check-out at school gate
-- Supports QR scan, Face recognition, and Manual input
-- ============================================

-- 1. ADD GATE SETTINGS TO SCHOOLS TABLE
-- ============================================

-- Enable/disable gate attendance feature
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS gate_attendance_enabled boolean DEFAULT false;

-- Enable QR scan at gate
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS gate_qr_enabled boolean DEFAULT true;

-- Enable face recognition at gate (for future implementation)
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS gate_face_enabled boolean DEFAULT false;

-- Enable manual input by admin/staff
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS gate_manual_enabled boolean DEFAULT true;

COMMENT ON COLUMN public.schools.gate_attendance_enabled IS 'Enable gate check-in/check-out system';
COMMENT ON COLUMN public.schools.gate_qr_enabled IS 'Allow QR code scanning at gate';
COMMENT ON COLUMN public.schools.gate_face_enabled IS 'Allow face recognition at gate';
COMMENT ON COLUMN public.schools.gate_manual_enabled IS 'Allow manual check-in/out by admin/staff';


-- 2. CREATE GATE_ATTENDANCE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.gate_attendance (
  id bigserial PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Check-in information
  check_in_time timestamp with time zone,
  check_in_method text CHECK (check_in_method IN ('QR', 'Face', 'Manual')),
  check_in_by uuid REFERENCES public.profiles(id), -- Admin/Staff who did manual check-in
  
  -- Check-out information
  check_out_time timestamp with time zone,
  check_out_method text CHECK (check_out_method IN ('QR', 'Face', 'Manual')),
  check_out_by uuid REFERENCES public.profiles(id), -- Admin/Staff who did manual check-out
  
  -- Status tracking
  status text NOT NULL DEFAULT 'outside_school' CHECK (status IN ('inside_school', 'outside_school')),
  notes text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Unique constraint: one record per student per school per day
  UNIQUE(student_id, school_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gate_attendance_student_id ON public.gate_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_gate_attendance_school_id ON public.gate_attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_gate_attendance_date ON public.gate_attendance(date);
CREATE INDEX IF NOT EXISTS idx_gate_attendance_status ON public.gate_attendance(status);
CREATE INDEX IF NOT EXISTS idx_gate_attendance_school_date ON public.gate_attendance(school_id, date);

-- Comments
COMMENT ON TABLE public.gate_attendance IS 'Student check-in/check-out records at school gate';
COMMENT ON COLUMN public.gate_attendance.check_in_time IS 'When student entered school premises';
COMMENT ON COLUMN public.gate_attendance.check_out_time IS 'When student left school premises';
COMMENT ON COLUMN public.gate_attendance.status IS 'Current location: inside_school or outside_school';


-- 3. CREATE TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_gate_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gate_attendance_updated_at ON public.gate_attendance;
CREATE TRIGGER trigger_gate_attendance_updated_at
  BEFORE UPDATE ON public.gate_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_gate_attendance_updated_at();


-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.gate_attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students can view own gate attendance" ON public.gate_attendance;
DROP POLICY IF EXISTS "Admin can manage all gate attendance" ON public.gate_attendance;
DROP POLICY IF EXISTS "Staff can manage gate attendance in their school" ON public.gate_attendance;
DROP POLICY IF EXISTS "Kepala Sekolah can view gate attendance in their school" ON public.gate_attendance;

-- Students can view their own gate attendance
CREATE POLICY "Students can view own gate attendance"
  ON public.gate_attendance FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Admin can manage all gate attendance (all schools)
CREATE POLICY "Admin can manage all gate attendance"
  ON public.gate_attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Staff can manage gate attendance in their school
CREATE POLICY "Staff can manage gate attendance in their school"
  ON public.gate_attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('Staff', 'Kepala Sekolah')
      AND school_id = gate_attendance.school_id
    )
  );

-- Kepala Sekolah can view gate attendance in their school
CREATE POLICY "Kepala Sekolah can view gate attendance in their school"
  ON public.gate_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role = 'Kepala Sekolah'
      AND school_id = gate_attendance.school_id
    )
  );

-- Kepala Yayasan can view all gate attendance
CREATE POLICY "Kepala Yayasan can view all gate attendance"
  ON public.gate_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Kepala Yayasan'
    )
  );


-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get today's gate attendance summary for a school
CREATE OR REPLACE FUNCTION get_gate_attendance_summary(p_school_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_students bigint,
  checked_in bigint,
  inside_now bigint,
  checked_out bigint,
  not_arrived bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH student_count AS (
    SELECT COUNT(*) as total
    FROM profiles
    WHERE school_id = p_school_id AND role = 'Siswa'
  ),
  attendance_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE check_in_time IS NOT NULL) as checked_in_count,
      COUNT(*) FILTER (WHERE status = 'inside_school') as inside_count,
      COUNT(*) FILTER (WHERE check_out_time IS NOT NULL) as checked_out_count
    FROM gate_attendance
    WHERE school_id = p_school_id AND date = p_date
  )
  SELECT
    sc.total,
    COALESCE(ast.checked_in_count, 0),
    COALESCE(ast.inside_count, 0),
    COALESCE(ast.checked_out_count, 0),
    sc.total - COALESCE(ast.checked_in_count, 0)
  FROM student_count sc
  CROSS JOIN attendance_stats ast;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_gate_attendance_summary IS 'Get daily gate attendance statistics for a school';


-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON public.gate_attendance TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gate_attendance TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE gate_attendance_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_gate_attendance_summary(uuid, date) TO authenticated;


-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if columns were added successfully
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'schools' 
-- AND column_name LIKE 'gate_%';

-- Check if table was created
-- SELECT * FROM gate_attendance LIMIT 1;

-- Test the summary function
-- SELECT * FROM get_gate_attendance_summary('your-school-id', CURRENT_DATE);

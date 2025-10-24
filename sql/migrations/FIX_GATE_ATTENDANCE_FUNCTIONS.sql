-- ============================================
-- FIX GATE ATTENDANCE FUNCTIONS
-- ============================================
-- This file safely updates the gate attendance functions
-- by dropping old versions first
-- ============================================

-- 1. DROP EXISTING FUNCTIONS SAFELY
-- ============================================

-- Drop old version if exists
DROP FUNCTION IF EXISTS get_gate_attendance_summary(uuid, date);
DROP FUNCTION IF EXISTS get_gate_attendance_summary(uuid);

-- Drop any other variations
DROP FUNCTION IF EXISTS public.get_gate_attendance_summary(uuid, date);
DROP FUNCTION IF EXISTS public.get_gate_attendance_summary(uuid);


-- 2. CREATE NEW VERSION OF FUNCTION
-- ============================================

-- Function to get today's gate attendance summary for a school
CREATE OR REPLACE FUNCTION get_gate_attendance_summary(
  p_school_id uuid, 
  p_date date DEFAULT CURRENT_DATE
)
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


-- 3. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_gate_attendance_summary(uuid, date) TO authenticated;


-- ============================================
-- VERIFICATION
-- ============================================

-- Check if function exists
SELECT 
  routine_name, 
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name = 'get_gate_attendance_summary'
AND routine_schema = 'public';

-- Show function parameters
SELECT 
  parameter_name,
  data_type,
  parameter_mode
FROM information_schema.parameters
WHERE specific_name IN (
  SELECT specific_name 
  FROM information_schema.routines 
  WHERE routine_name = 'get_gate_attendance_summary'
  AND routine_schema = 'public'
)
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Gate attendance functions have been fixed successfully!';
END $$;

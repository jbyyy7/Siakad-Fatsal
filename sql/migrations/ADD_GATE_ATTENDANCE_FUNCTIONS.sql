-- ============================================================================
-- FIX: Missing PostgreSQL Functions
-- Date: 2024-10-24
-- Purpose: Fix errors for teacher attendance and gate attendance functions
-- ============================================================================

-- ERROR 1: Teacher Attendance Query with null school_id
-- The query is trying to filter teachers with school_id=null which causes 400 error
-- FIX: This is actually a code issue, not database issue
-- The query should filter by a valid school_id or remove the filter

-- ERROR 2: Missing gate attendance functions
-- These functions are referenced in code but don't exist in database yet

-- ============================================================================
-- Drop existing functions first (if they exist)
-- Drop ALL overloads using CASCADE
-- ============================================================================
DROP FUNCTION IF EXISTS get_gate_attendance_summary CASCADE;
DROP FUNCTION IF EXISTS get_gate_attendance_analytics CASCADE;

-- ============================================================================
-- FUNCTION 1: get_gate_attendance_summary
-- Returns summary of gate check-ins for a specific date and school
-- ============================================================================
CREATE OR REPLACE FUNCTION get_gate_attendance_summary(
    p_date DATE,
    p_school_id UUID
)
RETURNS TABLE (
    total_students BIGINT,
    checked_in BIGINT,
    checked_out BIGINT,
    late_arrivals BIGINT,
    on_time BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- For now, return dummy data until gate_attendances table is created
    -- TODO: Replace with real query when gate_attendances table exists
    RETURN QUERY
    SELECT 
        0::BIGINT as total_students,
        0::BIGINT as checked_in,
        0::BIGINT as checked_out,
        0::BIGINT as late_arrivals,
        0::BIGINT as on_time;
END;
$$;

COMMENT ON FUNCTION get_gate_attendance_summary IS 'Returns daily gate attendance summary for a school (stub implementation)';

-- ============================================================================
-- FUNCTION 2: get_gate_attendance_analytics  
-- Returns analytics data for gate attendance over a date range
-- ============================================================================
CREATE OR REPLACE FUNCTION get_gate_attendance_analytics(
    school_id_param UUID,
    start_date_param DATE,
    end_date_param DATE DEFAULT NULL
)
RETURNS TABLE (
    date DATE,
    total_check_ins BIGINT,
    total_check_outs BIGINT,
    late_count BIGINT,
    on_time_count BIGINT,
    avg_check_in_time TIME
)
LANGUAGE plpgsql
SECURITY DEFINER  
AS $$
BEGIN
    -- For now, return empty result until gate_attendances table is created
    -- TODO: Replace with real query when gate_attendances table exists
    RETURN QUERY
    SELECT 
        NULL::DATE,
        0::BIGINT,
        0::BIGINT,
        0::BIGINT,
        0::BIGINT,
        NULL::TIME
    LIMIT 0; -- Return empty result set
END;
$$;

COMMENT ON FUNCTION get_gate_attendance_analytics IS 'Returns gate attendance analytics over date range (stub implementation)';

-- ============================================================================
-- Grant permissions to anon and authenticated roles
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_gate_attendance_summary(DATE, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_gate_attendance_analytics(UUID, DATE, DATE) TO anon, authenticated;

-- Note: Parameter names changed to match frontend calls
-- Function signature: get_gate_attendance_analytics(school_id_param, start_date_param, end_date_param)

-- ============================================================================
-- Verify functions were created
-- ============================================================================
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'get_gate_%'
ORDER BY routine_name;

-- ============================================================================
-- MIGRATION SUCCESS
-- ============================================================================
-- ✅ Functions created (stub implementations)
-- ⚠️  These return dummy/empty data until gate_attendances table is created
-- 
-- Next steps to fully implement:
-- 1. Create gate_attendances table
-- 2. Update function implementations to query real data
-- 3. Add proper indexing for performance
-- ============================================================================

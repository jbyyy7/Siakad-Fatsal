-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS TO teacher_attendance TABLE
-- Date: 2024-10-24
-- Purpose: Add proper foreign key relationships for data integrity and auto-joins
-- ============================================================================

-- ============================================================================
-- WHY ADD FOREIGN KEYS?
-- ============================================================================
-- 1. DATA INTEGRITY: Database ensures teacher_id exists in profiles table
-- 2. AUTO-JOIN: Supabase can auto-detect relationships for simpler queries
-- 3. CASCADING: Can auto-delete attendance when teacher is deleted
-- 4. PERFORMANCE: Database can optimize queries better with FK indexes
-- 5. DOCUMENTATION: Schema clearly shows table relationships

-- ============================================================================
-- Add Foreign Key: teacher_id → profiles(id)
-- ============================================================================
ALTER TABLE teacher_attendance
DROP CONSTRAINT IF EXISTS teacher_attendance_teacher_id_fkey;

ALTER TABLE teacher_attendance
ADD CONSTRAINT teacher_attendance_teacher_id_fkey
FOREIGN KEY (teacher_id)
REFERENCES profiles(id)
ON DELETE CASCADE  -- Auto-delete attendance when teacher is deleted
ON UPDATE CASCADE; -- Auto-update if teacher ID changes (rare)

COMMENT ON CONSTRAINT teacher_attendance_teacher_id_fkey 
ON teacher_attendance 
IS 'Links attendance records to teacher profiles. Cascades deletes to maintain data integrity.';

-- ============================================================================
-- Add Foreign Key: school_id → schools(id)
-- ============================================================================
ALTER TABLE teacher_attendance
DROP CONSTRAINT IF EXISTS teacher_attendance_school_id_fkey;

ALTER TABLE teacher_attendance
ADD CONSTRAINT teacher_attendance_school_id_fkey
FOREIGN KEY (school_id)
REFERENCES schools(id)
ON DELETE CASCADE  -- Auto-delete attendance when school is deleted
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT teacher_attendance_school_id_fkey 
ON teacher_attendance 
IS 'Links attendance records to schools. Cascades deletes to maintain data integrity.';

-- ============================================================================
-- Create Indexes for Performance
-- Foreign keys should have indexes for faster lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher_id 
ON teacher_attendance(teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_attendance_school_id 
ON teacher_attendance(school_id);

CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date 
ON teacher_attendance(date);

-- Composite index for common query pattern (date + school)
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date_school 
ON teacher_attendance(date, school_id);

COMMENT ON INDEX idx_teacher_attendance_teacher_id IS 'Speeds up lookups by teacher';
COMMENT ON INDEX idx_teacher_attendance_school_id IS 'Speeds up lookups by school';
COMMENT ON INDEX idx_teacher_attendance_date IS 'Speeds up lookups by date';
COMMENT ON INDEX idx_teacher_attendance_date_school IS 'Optimizes filtered queries by date and school';

-- ============================================================================
-- Verify Foreign Keys Were Created
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
AND tc.table_name = 'teacher_attendance'
ORDER BY kcu.column_name;

-- ============================================================================
-- Verify Indexes Were Created
-- ============================================================================
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'teacher_attendance'
AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================================
-- MIGRATION SUCCESS
-- ============================================================================
-- ✅ Foreign key constraints added
-- ✅ Performance indexes created
-- ✅ Data integrity enforced
-- 
-- BENEFITS:
-- 1. Supabase can now auto-join: .select('*, profiles(full_name)')
-- 2. Database prevents invalid teacher_id from being inserted
-- 3. Queries are faster with proper indexes
-- 4. Cascade deletes maintain data consistency
-- 
-- AFTER MIGRATION:
-- You can simplify code from manual join to:
--   .select('*, profiles!teacher_id(full_name, email)')
-- ============================================================================

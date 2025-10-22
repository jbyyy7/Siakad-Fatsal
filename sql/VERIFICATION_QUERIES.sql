-- =====================================================
-- VERIFICATION & TESTING QUERIES
-- Run these after COMPLETE_MIGRATION.sql
-- =====================================================

-- =====================================================
-- 1. VERIFY ALL TABLES EXIST
-- =====================================================

SELECT 
    'Tables Check' as check_type,
    COUNT(*) as total_tables,
    STRING_AGG(tablename, ', ' ORDER BY tablename) as table_names
FROM pg_tables 
WHERE schemaname = 'public';

-- Should have these tables:
-- announcements, attendance, class_members, classes, grades, 
-- notifications, password_resets, profiles, schools, subjects, 
-- teacher_attendance, teaching_journals

-- =====================================================
-- 2. VERIFY RLS IS ENABLED
-- =====================================================

SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- All tables should have rls_enabled = true

-- =====================================================
-- 3. COUNT RLS POLICIES PER TABLE
-- =====================================================

SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- teacher_attendance should have ~7 policies
-- profiles should have many policies including Staff ones

-- =====================================================
-- 4. VERIFY RPC FUNCTIONS EXIST
-- =====================================================

SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_email_from_identity', 'delete_user', 'update_updated_at')
ORDER BY routine_name;

-- Should return 3 functions

-- =====================================================
-- 5. CHECK TEACHER_ATTENDANCE TABLE STRUCTURE
-- =====================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'teacher_attendance'
ORDER BY ordinal_position;

-- Should have: id, date, teacher_id, school_id, check_in_time, 
-- check_out_time, status, notes, created_at, updated_at

-- =====================================================
-- 6. CHECK INDEXES
-- =====================================================

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('teacher_attendance', 'class_members', 'notifications', 'password_resets')
ORDER BY tablename, indexname;

-- Should have indexes on frequently queried columns

-- =====================================================
-- 7. TEST DATA QUERIES
-- =====================================================

-- Count profiles by role
SELECT 
    role,
    COUNT(*) as total
FROM public.profiles
GROUP BY role
ORDER BY total DESC;

-- Count schools
SELECT COUNT(*) as total_schools FROM public.schools;

-- Count classes
SELECT COUNT(*) as total_classes FROM public.classes;

-- =====================================================
-- 8. VERIFY STAFF ROLE POLICIES
-- =====================================================

-- Check if Staff role policies exist
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE policyname LIKE '%Staff%'
ORDER BY tablename, policyname;

-- Should see policies for: profiles, classes, subjects, 
-- attendance, grades, announcements, teaching_journals, teacher_attendance

-- =====================================================
-- 9. TEST TEACHER_ATTENDANCE CONSTRAINTS
-- =====================================================

-- This should work (if school and teacher exist):
-- INSERT INTO public.teacher_attendance (date, teacher_id, school_id, status)
-- VALUES (CURRENT_DATE, 'teacher-uuid-here', 'school-uuid-here', 'Hadir');

-- This should FAIL (invalid status):
-- INSERT INTO public.teacher_attendance (date, teacher_id, school_id, status)
-- VALUES (CURRENT_DATE, 'teacher-uuid-here', 'school-uuid-here', 'Invalid');

-- =====================================================
-- 10. CHECK FOR MISSING COLUMNS IN PROFILES
-- =====================================================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='profiles' AND column_name='place_of_birth'
        ) THEN '✅ place_of_birth exists'
        ELSE '❌ place_of_birth missing'
    END as check_1,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='profiles' AND column_name='date_of_birth'
        ) THEN '✅ date_of_birth exists'
        ELSE '❌ date_of_birth missing'
    END as check_2,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='profiles' AND column_name='parent_name'
        ) THEN '✅ parent_name exists'
        ELSE '❌ parent_name missing'
    END as check_3;

-- =====================================================
-- 11. SAMPLE DATA - CREATE TEST STAFF USER (OPTIONAL)
-- =====================================================

-- IMPORTANT: Replace UUIDs with actual values from your database!

-- First, check existing schools
SELECT id, name FROM public.schools LIMIT 5;

-- Create a test staff user (run this manually with correct UUIDs)
/*
-- Step 1: Create auth user
-- Do this via Supabase Auth UI or:
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
-- VALUES ('staff.test@school.edu', crypt('password123', gen_salt('bf')), NOW())
-- RETURNING id;

-- Step 2: Create profile (replace user_id and school_id)
INSERT INTO public.profiles (
    id, 
    email, 
    identity_number, 
    full_name, 
    role, 
    school_id
)
VALUES (
    'replace-with-auth-user-id',  -- from step 1
    'staff.test@school.edu',
    'STAFF001',
    'Staff Test User',
    'Staff',
    'replace-with-school-id'      -- from schools table
);
*/

-- =====================================================
-- 12. TEST TEACHER ATTENDANCE INSERT
-- =====================================================

-- Get a teacher and school to test with
SELECT 
    p.id as teacher_id,
    p.full_name,
    p.school_id,
    s.name as school_name
FROM public.profiles p
JOIN public.schools s ON s.id = p.school_id
WHERE p.role IN ('Guru', 'Kepala Sekolah')
LIMIT 1;

-- Test insert (replace UUIDs with values from above query)
/*
INSERT INTO public.teacher_attendance (
    date, 
    teacher_id, 
    school_id, 
    status,
    check_in_time
)
VALUES (
    CURRENT_DATE,
    'replace-with-teacher-id',
    'replace-with-school-id',
    'Hadir',
    '07:30:00'
);
*/

-- Verify insert worked
SELECT * FROM public.teacher_attendance ORDER BY created_at DESC LIMIT 5;

-- =====================================================
-- 13. FINAL CHECKLIST
-- =====================================================

DO $$ 
DECLARE
    table_count INT;
    policy_count INT;
    function_count INT;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count 
    FROM pg_tables 
    WHERE schemaname = 'public';
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN ('get_email_from_identity', 'delete_user');
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables: % (should be 12+)', table_count;
    RAISE NOTICE 'RLS Policies: % (should be 50+)', policy_count;
    RAISE NOTICE 'RPC Functions: % (should be 2+)', function_count;
    RAISE NOTICE '========================================';
    
    IF table_count >= 12 AND policy_count >= 50 AND function_count >= 2 THEN
        RAISE NOTICE '✅ ALL CHECKS PASSED!';
        RAISE NOTICE '🚀 Your database is ready for production';
    ELSE
        RAISE NOTICE '⚠️ Some checks failed. Review above.';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Create a Staff user via Supabase Auth UI';
    RAISE NOTICE '2. Test login with different roles';
    RAISE NOTICE '3. Test teacher attendance feature';
    RAISE NOTICE '4. Deploy frontend to Vercel';
    RAISE NOTICE '========================================';
END $$;

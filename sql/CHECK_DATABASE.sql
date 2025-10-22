-- =====================================================
-- DATABASE HEALTH CHECK
-- Jalankan ini untuk cek status database
-- =====================================================

-- 1. Cek tabel yang ada
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 CHECKING EXISTING TABLES';
    RAISE NOTICE '========================================';
END $$;

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS Enabled'
        ELSE '⚠️  RLS Disabled'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Cek kolom di tabel profiles
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '👤 CHECKING PROFILES TABLE COLUMNS';
    RAISE NOTICE '========================================';
END $$;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Cek enum user_role
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎭 CHECKING USER_ROLE ENUM VALUES';
    RAISE NOTICE '========================================';
END $$;

SELECT 
    enumlabel as role_value,
    enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- 4. Cek RLS policies
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔐 CHECKING RLS POLICIES COUNT';
    RAISE NOTICE '========================================';
END $$;

SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 5. Cek functions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚙️  CHECKING FUNCTIONS';
    RAISE NOTICE '========================================';
END $$;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_email_from_identity', 'delete_user', 'update_updated_at')
ORDER BY routine_name;

-- 6. Test query yang error (profiles)
DO $$
DECLARE
    test_result RECORD;
    error_msg TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧪 TESTING PROFILES QUERY';
    RAISE NOTICE '========================================';
    
    BEGIN
        SELECT 
            id, 
            identity_number, 
            full_name, 
            role
        INTO test_result
        FROM public.profiles 
        LIMIT 1;
        
        IF FOUND THEN
            RAISE NOTICE '✅ Profiles query works! Sample role: %', test_result.role;
        ELSE
            RAISE NOTICE '⚠️  No data in profiles table';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Profiles query failed: %', error_msg;
    END;
END $$;

-- 7. Cek tabel yang missing (error 404/500)
DO $$
DECLARE
    tables_to_check TEXT[] := ARRAY['attendance', 'grades', 'subjects', 'classes', 'schools', 'teacher_attendance'];
    tbl TEXT;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 CHECKING FOR MISSING TABLES';
    RAISE NOTICE '========================================';
    
    FOREACH tbl IN ARRAY tables_to_check
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '✅ Table % exists', tbl;
        ELSE
            RAISE NOTICE '❌ Table % MISSING!', tbl;
        END IF;
    END LOOP;
END $$;

-- 8. Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DATABASE CHECK COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. If tables missing → Run SAFE_MIGRATION.sql';
    RAISE NOTICE '2. If Staff enum missing → Run 00_ADD_STAFF_ENUM.sql';
    RAISE NOTICE '3. Check results above for specific issues';
    RAISE NOTICE '';
END $$;

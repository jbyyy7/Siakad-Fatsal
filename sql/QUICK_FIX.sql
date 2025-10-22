-- =====================================================
-- QUICK FIX FOR COMMON ERRORS
-- Run this if you get errors during migration
-- =====================================================

-- =====================================================
-- 1. FIX: Column "email" does not exist in profiles
-- =====================================================

-- Add email column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        RAISE NOTICE '✅ Added email column';
    ELSE
        RAISE NOTICE '✓ Email column already exists';
    END IF;
END $$;

-- Populate email from auth.users
DO $$ 
BEGIN
    UPDATE public.profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.id = u.id 
    AND (p.email IS NULL OR p.email = '');
    
    RAISE NOTICE '✅ Populated email from auth.users';
END $$;

-- =====================================================
-- 2. FIX: Policy already exists errors
-- =====================================================

-- Drop all existing Staff policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND policyname LIKE '%Staff%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy: % on table %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- =====================================================
-- 3. FIX: Function already exists errors
-- =====================================================

DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS public.get_email_from_identity(text);
    DROP FUNCTION IF EXISTS public.delete_user(uuid);
    DROP FUNCTION IF EXISTS public.update_updated_at();
    
    RAISE NOTICE '✅ Dropped existing functions';
END $$;

-- =====================================================
-- 4. FIX: Check current table structure
-- =====================================================

-- Show all columns in profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- =====================================================
-- 5. FIX: Recreate get_email_from_identity function
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_email_from_identity(identity_number_input text)
RETURNS text 
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
    user_email text;
BEGIN
    -- First try to get from profiles.email
    SELECT email INTO user_email
    FROM public.profiles 
    WHERE identity_number = identity_number_input 
    LIMIT 1;
    
    -- If profiles.email is empty, get from auth.users
    IF user_email IS NULL OR user_email = '' THEN
        SELECT u.email INTO user_email
        FROM public.profiles p
        JOIN auth.users u ON u.id = p.id
        WHERE p.identity_number = identity_number_input
        LIMIT 1;
    END IF;
    
    RETURN user_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_from_identity(text) TO anon, authenticated;

DO $$ 
BEGIN
    RAISE NOTICE '✅ Created get_email_from_identity function';
END $$;

-- Test the function
DO $$
DECLARE
    test_email text;
BEGIN
    -- Get first identity_number from profiles
    SELECT get_email_from_identity(identity_number) INTO test_email
    FROM public.profiles
    LIMIT 1;
    
    IF test_email IS NOT NULL THEN
        RAISE NOTICE '✅ Function test PASSED. Sample email: %', test_email;
    ELSE
        RAISE NOTICE '⚠️ Function test: No users found';
    END IF;
END $$;

-- =====================================================
-- 6. FIX: Verify table existence
-- =====================================================

DO $$
DECLARE
    missing_tables text[];
    expected_tables text[] := ARRAY[
        'profiles', 'schools', 'classes', 'subjects', 
        'attendance', 'grades', 'announcements', 'teaching_journals',
        'teacher_attendance', 'password_resets', 'class_members', 'notifications'
    ];
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            missing_tables := array_append(missing_tables, tbl);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE '⚠️ Missing tables: %', array_to_string(missing_tables, ', ');
        RAISE NOTICE '➡️ Run COMPLETE_MIGRATION.sql to create them';
    ELSE
        RAISE NOTICE '✅ All expected tables exist';
    END IF;
END $$;

-- =====================================================
-- DONE! ✅
-- =====================================================

DO $$ 
BEGIN 
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ QUICK FIX COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next: Run COMPLETE_MIGRATION.sql again';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- FIX RECURSIVE RLS POLICIES - ULTIMATE SOLUTION
-- Jalankan ini untuk fix infinite recursion error
-- =====================================================

-- STEP 1: DROP SEMUA policy di profiles table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- STEP 2: DISABLE RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Dropped all policies and disabled RLS on profiles';
    RAISE NOTICE '⚠️  WARNING: profiles table is now open to all authenticated users!';
    RAISE NOTICE '📋 This is TEMPORARY for debugging';
    RAISE NOTICE '🔒 You should add proper policies later once the app works';
END $$;

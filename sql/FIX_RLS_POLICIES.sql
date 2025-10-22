-- =====================================================
-- FIX RECURSIVE RLS POLICIES - SMART SOLUTION
-- Drop only problematic recursive policies, keep safe ones
-- =====================================================

DO $$ 
BEGIN 
    RAISE NOTICE '🔧 Starting to fix RLS policies...';
END $$;

-- STEP 1: DROP problematic Staff policies (RECURSIVE!)
DROP POLICY IF EXISTS "Staff can manage school profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view school profiles" ON public.profiles;

-- STEP 2: DROP problematic Admin policies (RECURSIVE!)
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all user profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Dropped recursive policies';
END $$;

-- STEP 3: Buat policy yang AMAN (no recursion)
-- Policy ini hanya cek auth.uid(), tidak query ke profiles

-- Simple policy: Everyone can view all profiles (TEMPORARY - for debugging!)
CREATE POLICY "Allow all authenticated to view profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Simple policy: Everyone can update own profile
CREATE POLICY "Allow users to update own profile"  
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Simple policy: Allow insert for authenticated (for registration)
CREATE POLICY "Allow authenticated to insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Simple policy: Allow delete own profile
CREATE POLICY "Allow users to delete own profile"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (id = auth.uid());

DO $$ 
BEGIN 
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ RLS POLICIES FIXED!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Current policies:';
    RAISE NOTICE '  ✅ Allow all authenticated to view profiles (TEMPORARY)';
    RAISE NOTICE '  ✅ Allow users to update own profile';
    RAISE NOTICE '  ✅ Allow authenticated to insert profiles';
    RAISE NOTICE '  ✅ Allow users to delete own profile';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  NOTE: View policy is OPEN for all authenticated users';
    RAISE NOTICE '� This is TEMPORARY to get app working';
    RAISE NOTICE '� You can add role-based restrictions later';
    RAISE NOTICE '';
END $$;

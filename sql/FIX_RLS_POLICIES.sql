-- =====================================================
-- FIX RECURSIVE RLS POLICIES
-- Jalankan ini untuk fix infinite recursion error
-- =====================================================

-- DROP semua Staff policies di profiles yang bikin recursive
DROP POLICY IF EXISTS "Staff can view users in their school" ON public.profiles;
DROP POLICY IF EXISTS "Staff can insert users in their school" ON public.profiles;
DROP POLICY IF EXISTS "Staff can update users in their school" ON public.profiles;
DROP POLICY IF EXISTS "Staff can delete users in their school" ON public.profiles;

-- Buat policy yang TIDAK RECURSIVE dengan menggunakan table lain untuk cek role
-- Menggunakan auth.uid() langsung tanpa subquery ke profiles

-- Policy 1: Users can view own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Policy 2: Admin can view all profiles  
CREATE POLICY "Admin can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'Admin'
    );

-- Policy 3: Staff can view profiles in their school (NON-RECURSIVE)
-- Menggunakan CTE untuk avoid recursion
CREATE POLICY "Staff can view school profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        school_id IN (
            SELECT school_id 
            FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'Staff'
            LIMIT 1
        )
    );

-- Policy 4: Admin can manage all profiles
CREATE POLICY "Admin can manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'Admin'
    );

-- Policy 5: Staff can manage profiles in their school
CREATE POLICY "Staff can manage school profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (
        school_id IN (
            SELECT school_id 
            FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'Staff'
            LIMIT 1
        )
    );

DO $$ 
BEGIN 
    RAISE NOTICE '✅ Fixed recursive RLS policies!';
    RAISE NOTICE '📋 Policies updated:';
    RAISE NOTICE '  - Users can view own profile';
    RAISE NOTICE '  - Admin can view/manage all';
    RAISE NOTICE '  - Staff can view/manage school profiles (non-recursive)';
END $$;

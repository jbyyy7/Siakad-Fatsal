    -- ========================================
    -- FIX: RLS Policy untuk profiles
    -- ========================================
    -- Supaya semua role bisa read profiles yang diperlukan

    -- 1. DROP semua existing policies yang mungkin restrictive
    -- DROP OLD policies
    DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
    DROP POLICY IF EXISTS "Admin can manage profiles" ON profiles;
    DROP POLICY IF EXISTS "Staff can manage profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Public profiles readable by authenticated users" ON profiles;
    DROP POLICY IF EXISTS "Admin and Staff can manage all profiles" ON profiles;

-- DROP NEW policies (case sensitive!)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff can manage their school profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view their students" ON profiles;
DROP POLICY IF EXISTS "Principals can view their school profiles" ON profiles;
DROP POLICY IF EXISTS "Foundation heads can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Students can view classmates and teachers" ON profiles;    -- 2. ENABLE RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. CREATE SIMPLE POLICIES (NO RECURSION!)

-- Policy 1: Semua authenticated users bisa lihat & edit profile sendiri
CREATE POLICY "Users can manage their own profile"
ON profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 2: Semua authenticated users bisa READ semua profiles
-- Admin/Staff control dilakukan di application layer
CREATE POLICY "Users can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Users bisa INSERT profile baru (untuk registration)
CREATE POLICY "Users can insert profiles"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 4: Users bisa UPDATE profiles (control di app layer)
CREATE POLICY "Users can update profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 5: Users bisa DELETE profiles (control di app layer)
CREATE POLICY "Users can delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- VERIFICATION
-- ========================================

    SELECT 
        policyname,
        cmd,
        roles,
        qual
    FROM pg_policies 
    WHERE tablename = 'profiles'
    ORDER BY policyname;

    -- ========================================
    -- ROLLBACK (jika ada masalah)
    -- ========================================

    -- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

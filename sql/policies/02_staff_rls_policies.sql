-- Additional RLS policies for Staff role
-- Date: 2025-10-22
-- 
-- Staff role has school-scoped access (can manage their school only)
-- Similar to Admin but limited to their school_id

-- ============================================
-- PROFILES TABLE - Staff can manage users in their school
-- ============================================

CREATE POLICY "Staff can view users in their school"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = profiles.school_id
        )
    );

CREATE POLICY "Staff can insert users in their school"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = profiles.school_id
        )
    );

CREATE POLICY "Staff can update users in their school"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = profiles.school_id
        )
    );

CREATE POLICY "Staff can delete users in their school"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = profiles.school_id
        )
    );

-- ============================================
-- CLASSES TABLE - Staff can manage classes in their school
-- ============================================

CREATE POLICY "Staff can view classes in their school"
    ON public.classes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = classes.school_id
        )
    );

CREATE POLICY "Staff can manage classes in their school"
    ON public.classes FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = classes.school_id
        )
    );

-- ============================================
-- SUBJECTS TABLE - Staff can manage subjects in their school
-- ============================================

CREATE POLICY "Staff can view subjects in their school"
    ON public.subjects FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = subjects.school_id
        )
    );

CREATE POLICY "Staff can manage subjects in their school"
    ON public.subjects FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = subjects.school_id
        )
    );

-- ============================================
-- ATTENDANCE TABLE - Staff can manage student attendance in their school
-- ============================================

CREATE POLICY "Staff can view attendance in their school"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            JOIN public.profiles AS student ON student.id = attendance.student_id
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = student.school_id
        )
    );

CREATE POLICY "Staff can manage attendance in their school"
    ON public.attendance FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            JOIN public.profiles AS student ON student.id = attendance.student_id
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = student.school_id
        )
    );

-- ============================================
-- GRADES TABLE - Staff can manage grades in their school
-- ============================================

CREATE POLICY "Staff can view grades in their school"
    ON public.grades FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            JOIN public.profiles AS student ON student.id = grades.student_id
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = student.school_id
        )
    );

CREATE POLICY "Staff can manage grades in their school"
    ON public.grades FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            JOIN public.profiles AS student ON student.id = grades.student_id
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = student.school_id
        )
    );

-- ============================================
-- ANNOUNCEMENTS TABLE - Staff can manage announcements in their school
-- ============================================

CREATE POLICY "Staff can view announcements in their school"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = announcements.school_id
        )
        OR announcements.school_id IS NULL -- Global announcements
    );

CREATE POLICY "Staff can manage announcements in their school"
    ON public.announcements FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = announcements.school_id
        )
    );

-- ============================================
-- TEACHING_JOURNALS TABLE - Staff can view journals in their school
-- ============================================

CREATE POLICY "Staff can view teaching journals in their school"
    ON public.teaching_journals FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles AS staff
            JOIN public.profiles AS teacher ON teacher.id = teaching_journals.teacher_id
            WHERE staff.id = auth.uid()
            AND staff.role = 'Staff'
            AND staff.school_id = teacher.school_id
        )
    );

-- Note: Staff typically doesn't write journals (teachers do)
-- But they can view them for monitoring purposes

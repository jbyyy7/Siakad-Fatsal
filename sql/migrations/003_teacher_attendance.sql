-- Migration: Add teacher/staff attendance tracking
-- Date: 2025-10-22

-- Create teacher_attendance table
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    check_in_time TIME,
    check_out_time TIME,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, teacher_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON public.teacher_attendance(date);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher ON public.teacher_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_school ON public.teacher_attendance(school_id);

-- RLS Policies for teacher_attendance
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

-- Admin can see all
CREATE POLICY "Admin can view all teacher attendance"
    ON public.teacher_attendance FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Admin'
        )
    );

-- Staff can see their school's attendance
CREATE POLICY "Staff can view their school teacher attendance"
    ON public.teacher_attendance FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = teacher_attendance.school_id
        )
    );

-- Principal can see their school's attendance
CREATE POLICY "Principal can view their school teacher attendance"
    ON public.teacher_attendance FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Kepala Sekolah'
            AND profiles.school_id = teacher_attendance.school_id
        )
    );

-- Teachers can view their own attendance
CREATE POLICY "Teachers can view own attendance"
    ON public.teacher_attendance FOR SELECT
    TO authenticated
    USING (teacher_id = auth.uid());

-- Staff can insert/update their school's teacher attendance
CREATE POLICY "Staff can manage their school teacher attendance"
    ON public.teacher_attendance FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Staff'
            AND profiles.school_id = teacher_attendance.school_id
        )
    );

-- Admin can insert/update all
CREATE POLICY "Admin can manage all teacher attendance"
    ON public.teacher_attendance FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Admin'
        )
    );

-- Principal can manage their school's teacher attendance
CREATE POLICY "Principal can manage their school teacher attendance"
    ON public.teacher_attendance FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Kepala Sekolah'
            AND profiles.school_id = teacher_attendance.school_id
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_teacher_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS teacher_attendance_updated_at ON public.teacher_attendance;
CREATE TRIGGER teacher_attendance_updated_at
    BEFORE UPDATE ON public.teacher_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_teacher_attendance_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_attendance TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.teacher_attendance_id_seq TO authenticated;

import { supabase } from './supabaseClient';
import { User, UserRole, School, Announcement, GamificationProfile, Subject, Class } from '../types';
import { PostgrestError } from '@supabase/supabase-js';

// Centralized error handler
const handleSupabaseError = (error: PostgrestError | null, functionName: string) => {
    if (error) {
        console.error(`Supabase error in ${functionName}:`, error);
        throw new Error(`Gagal mengambil data dari server (${functionName}).`);
    }
};

const getGradeFromScore = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    return 'D';
}

export const dataService = {
    // User Management
    async getUsers(filters?: { role?: UserRole; schoolId?: string }): Promise<User[]> {
        // More robust query: Fetch schools first, then profiles
        const { data: schoolsData, error: schoolsError } = await supabase.from('schools').select('id, name');
        handleSupabaseError(schoolsError, 'getUsers (schools)');
        const schoolMap = new Map<string, string>(schoolsData?.map(s => [s.id, s.name]) || []);

        let query = supabase.from('profiles').select('id, identity_number, full_name, role, avatar_url, school_id');
        if (filters?.role) {
            query = query.eq('role', filters.role);
        }
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }

        const { data, error } = await query;
        handleSupabaseError(error, 'getUsers');

        return data?.map(profile => ({
            id: profile.id,
            email: '', // Email is sensitive and should not be exposed in user lists
            identityNumber: profile.identity_number,
            name: profile.full_name,
            role: profile.role as UserRole,
            avatarUrl: profile.avatar_url,
            schoolId: profile.school_id,
            schoolName: schoolMap.get(profile.school_id) || undefined,
        })) || [];
    },

    async updateUser(userId: string, formData: any): Promise<void> {
        const { error } = await supabase.from('profiles').update({
            full_name: formData.name,
            identity_number: formData.identityNumber,
            role: formData.role,
            school_id: formData.schoolId || null,
            avatar_url: formData.avatarUrl,
        }).eq('id', userId);
        handleSupabaseError(error, 'updateUser');
    },

    async createUser(formData: any): Promise<void> {
        // This is a sensitive operation. For full security, this should be a trusted server-side call.
        // As per request, implementing client-side. The user created will need to verify their email.
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
        });

        if (authError) {
            console.error('Supabase Auth Error in createUser:', authError);
            throw new Error(`Gagal membuat autentikasi pengguna: ${authError.message}`);
        }
        if (!authData.user) {
            throw new Error("Gagal membuat pengguna, tidak ada data user yang dikembalikan.");
        }

        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            full_name: formData.name,
            identity_number: formData.identityNumber,
            role: formData.role,
            school_id: formData.schoolId || null,
            avatar_url: formData.avatarUrl,
        });
        
        if (profileError) {
             console.error('Supabase Profile Error in createUser:', profileError);
             // Attempt to clean up the auth user if profile creation fails
             // This needs an admin client, which is not secure on the client-side.
             // Manual cleanup in Supabase dashboard might be needed on failure.
             throw new Error(`Autentikasi berhasil dibuat, tetapi gagal menyimpan profil: ${profileError.message}`);
        }
    },

    async deleteUser(userId: string): Promise<void> {
        // Client-side can only safely delete the profile, not the auth user.
        // This effectively 'deactivates' the user as they won't have a profile on login.
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        handleSupabaseError(error, 'deleteUser');
    },
    
    async getUserCount(filters: { role: UserRole; schoolId: string }): Promise<number> {
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', filters.role)
            .eq('school_id', filters.schoolId);
        handleSupabaseError(error, 'getUserCount');
        return count || 0;
    },

    // School Management
    async getSchools(): Promise<School[]> {
        const { data, error } = await supabase.from('schools').select('*');
        handleSupabaseError(error, 'getSchools');
        return data || [];
    },

    async getSchoolCount(): Promise<number> {
        const { count, error } = await supabase.from('schools').select('*', { count: 'exact', head: true });
        handleSupabaseError(error, 'getSchoolCount');
        return count || 0;
    },
    
    async createSchool(formData: Omit<School, 'id'>): Promise<void> {
        const { error } = await supabase.from('schools').insert(formData);
        handleSupabaseError(error, 'createSchool');
    },

    async updateSchool(schoolId: string, formData: Omit<School, 'id'>): Promise<void> {
        const { error } = await supabase.from('schools').update(formData).eq('id', schoolId);
        handleSupabaseError(error, 'updateSchool');
    },

    async deleteSchool(schoolId: string): Promise<void> {
        const { error } = await supabase.from('schools').delete().eq('id', schoolId);
        handleSupabaseError(error, 'deleteSchool');
    },
    
    // Announcements
    async getAnnouncements(): Promise<Announcement[]> {
        const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        handleSupabaseError(error, 'getAnnouncements');
        return (data || []).map(a => ({
            ...a,
            date: new Date(a.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
        }));
    },
    
    // Student Data
    async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
        const { data, error } = await supabase
            .from('grades')
            .select('score, subjects ( name )')
            .eq('student_id', studentId);

        handleSupabaseError(error, 'getGradesForStudent');

        return data?.map((g: any) => ({
            subject: g.subjects.name,
            score: g.score,
            grade: getGradeFromScore(g.score),
        })) || [];
    },
    
    async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> {
        const { data, error } = await supabase
            .from('attendances')
            .select('date, status')
            .eq('student_id', studentId);
        handleSupabaseError(error, 'getAttendanceForStudent');
        return data || [];
    },

    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string, teacherName: string }> {
        // Assuming a table `teacher_notes` exists
        const { data, error } = await supabase
            .from('teacher_notes')
            .select('note, profiles ( full_name )')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error if no notes exist
             handleSupabaseError(error, 'getTeacherNoteForStudent');
        }
       
        if (!data) {
            return { note: 'Belum ada catatan dari wali kelas.', teacherName: '' };
        }
        
        return {
            // @ts-ignore
            note: data.note,
            // @ts-ignore
            teacherName: data.profiles.full_name,
        }
    },
    
     // Teacher Data
    async getJournalForTeacher(teacherId: string, date: string): Promise<{ subject: string; classId: string; topic: string; }[]> {
         // Assuming a table `teacher_journals` exists
        const { data, error } = await supabase
            .from('teacher_journals')
            .select('topic, subjects(name), classes(name)')
            .eq('teacher_id', teacherId)
            .eq('date', date);
        
        handleSupabaseError(error, 'getJournalForTeacher');
        // @ts-ignore
        return data?.map(j => ({ subject: j.subjects.name, classId: j.classes.name, topic: j.topic })) || [];
    },

    // Gamification
    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        // This requires multiple queries as the relationships can be complex
        const { data: profile, error: profileError } = await supabase.from('gamification_profiles').select('points, level').eq('student_id', studentId).single();
        handleSupabaseError(profileError, 'getGamificationProfile (profile)');

        const { data: progress, error: progressError } = await supabase.from('student_progress').select('progress, subjects(name)').eq('student_id', studentId);
        handleSupabaseError(progressError, 'getGamificationProfile (progress)');
        
        const { data: badges, error: badgesError } = await supabase.from('student_badges').select('badges(id, name, description, icon)').eq('student_id', studentId);
        handleSupabaseError(badgesError, 'getGamificationProfile (badges)');

        return {
            // @ts-ignore
            progress: progress?.reduce((acc, p) => ({ ...acc, [p.subjects.name]: p.progress }), {}) || {},
            // @ts-ignore
            badges: badges?.map(b => ({ ...b.badges })) || []
        };
    },

    // Academic Reports (requires RPC calls for aggregation)
    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
        const { data, error } = await supabase.rpc('get_school_average_scores');
        handleSupabaseError(error, 'getSchoolPerformance');
        return data || [];
    },
    
     async getClassSchedule(classId: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
        const { data, error } = await supabase
            .from('class_schedules')
            .select('day_of_week, start_time, end_time, subjects(name)')
            .eq('class_id', classId);
        handleSupabaseError(error, 'getClassSchedule');

        const schedule: Record<string, any[]> = { "Senin": [], "Selasa": [], "Rabu": [], "Kamis": [], "Jumat": [] };
        // @ts-ignore
        data?.forEach(item => {
            schedule[item.day_of_week].push({
                // @ts-ignore
                time: `${item.start_time.substring(0,5)} - ${item.end_time.substring(0,5)}`,
                // @ts-ignore
                subject: item.subjects.name,
            });
        });

        return schedule;
    },

    async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number; }[]> {
        const { data, error } = await supabase.rpc('get_average_grades_by_subject', { school_id_input: schoolId });
        handleSupabaseError(error, 'getAverageGradesBySubject');
        return data || [];
    },

    async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number; }[]> {
        const { data, error } = await supabase.rpc('get_attendance_trend', { school_id_input: schoolId });
        handleSupabaseError(error, 'getAttendanceTrend');
        return data || [];
    },

    // Subject Management
    async getSubjects(): Promise<Subject[]> {
        const { data, error } = await supabase.from('subjects').select('*');
        handleSupabaseError(error, 'getSubjects');
        return data || [];
    },
    async createSubject(formData: Omit<Subject, 'id'>): Promise<void> {
        const { error } = await supabase.from('subjects').insert(formData);
        handleSupabaseError(error, 'createSubject');
    },
    async updateSubject(id: string, formData: Omit<Subject, 'id'>): Promise<void> {
        const { error } = await supabase.from('subjects').update(formData).eq('id', id);
        handleSupabaseError(error, 'updateSubject');
    },
    async deleteSubject(id: string): Promise<void> {
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        handleSupabaseError(error, 'deleteSubject');
    },

    // Class Management
    async getClasses(): Promise<Class[]> {
        const { data, error } = await supabase.from('classes').select(`
            id, name, school_id, teacher_id,
            schools (name),
            profiles (full_name)
        `);
        handleSupabaseError(error, 'getClasses');
        // @ts-ignore
        return data?.map(c => ({
            id: c.id,
            name: c.name,
            schoolId: c.school_id,
            teacherId: c.teacher_id,
            // @ts-ignore
            schoolName: c.schools.name,
            // @ts-ignore
            teacherName: c.profiles.full_name,
        })) || [];
    },
    async createClass(formData: any): Promise<void> {
        const { error } = await supabase.from('classes').insert({
            name: formData.name,
            school_id: formData.schoolId,
            teacher_id: formData.teacherId,
        });
        handleSupabaseError(error, 'createClass');
    },
    async updateClass(id: string, formData: any): Promise<void> {
        const { error } = await supabase.from('classes').update({
             name: formData.name,
             school_id: formData.schoolId,
             teacher_id: formData.teacherId,
        }).eq('id', id);
        handleSupabaseError(error, 'updateClass');
    },
    async deleteClass(id: string): Promise<void> {
        const { error } = await supabase.from('classes').delete().eq('id', id);
        handleSupabaseError(error, 'deleteClass');
    },
};

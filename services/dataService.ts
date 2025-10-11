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
             throw new Error(`Autentikasi berhasil dibuat, tetapi gagal menyimpan profil: ${profileError.message}`);
        }
    },

    async deleteUser(userId: string): Promise<void> {
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
        const { data: gradesData, error: gradesError } = await supabase
            .from('grades')
            .select('score, subject_id')
            .eq('student_id', studentId);
        handleSupabaseError(gradesError, 'getGradesForStudent (grades)');

        if (!gradesData || gradesData.length === 0) return [];

        const subjectIds = gradesData.map(g => g.subject_id);
        const { data: subjectsData, error: subjectsError } = await supabase.from('subjects').select('id, name').in('id', subjectIds);
        handleSupabaseError(subjectsError, 'getGradesForStudent (subjects)');

        const subjectMap = new Map<string, string>(subjectsData?.map(s => [s.id, s.name]) || []);

        return gradesData.map(g => ({
            subject: subjectMap.get(g.subject_id) || 'Unknown Subject',
            score: g.score,
            grade: getGradeFromScore(g.score),
        }));
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
        const { data, error } = await supabase
            .from('teacher_notes')
            .select('note, teacher_id')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error
             handleSupabaseError(error, 'getTeacherNoteForStudent');
        }
       
        if (!data) {
            return { note: 'Belum ada catatan dari wali kelas.', teacherName: '' };
        }
        
        const { data: teacher, error: teacherError } = await supabase.from('profiles').select('full_name').eq('id', data.teacher_id).single();
        handleSupabaseError(teacherError, 'getTeacherNoteForStudent (teacher)');

        return {
            note: data.note,
            teacherName: teacher?.full_name || 'Unknown Teacher',
        }
    },
    
    async getJournalForTeacher(teacherId: string, date: string): Promise<{ subject: string; classId: string; topic: string; }[]> {
        const { data, error } = await supabase
            .from('teacher_journals')
            .select('topic, subject_id, class_id')
            .eq('teacher_id', teacherId)
            .eq('date', date);
        handleSupabaseError(error, 'getJournalForTeacher');
        if (!data || data.length === 0) return [];
        
        const subjectIds = [...new Set(data.map(d => d.subject_id))];
        const classIds = [...new Set(data.map(d => d.class_id))];

        const { data: subjects, error: sError } = await supabase.from('subjects').select('id, name').in('id', subjectIds);
        const { data: classes, error: cError } = await supabase.from('classes').select('id, name').in('id', classIds);
        handleSupabaseError(sError, 'getJournalForTeacher (subjects)');
        handleSupabaseError(cError, 'getJournalForTeacher (classes)');

        const subjectMap = new Map(subjects?.map(s => [s.id, s.name]));
        const classMap = new Map(classes?.map(c => [c.id, c.name]));
        
        return data.map(j => ({
            subject: subjectMap.get(j.subject_id) || 'Unknown',
            classId: classMap.get(j.class_id) || 'Unknown',
            topic: j.topic
        }));
    },

    // Gamification
    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
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

    // Academic Reports
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
    async getSubjects(filters?: { schoolId?: string }): Promise<Subject[]> {
        const { data: schools, error: schoolsError } = await supabase.from('schools').select('id, name');
        handleSupabaseError(schoolsError, 'getSubjects (schools)');
        const schoolMap = new Map(schools?.map(s => [s.id, s.name]));

        let query = supabase.from('subjects').select('*');
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { data, error } = await query;
        handleSupabaseError(error, 'getSubjects');
        
        return data?.map(s => ({
            id: s.id,
            name: s.name,
            schoolId: s.school_id,
            schoolName: schoolMap.get(s.school_id) || 'N/A',
        })) || [];
    },
    async getSubjectCount(): Promise<number> {
        const { count, error } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
        handleSupabaseError(error, 'getSubjectCount');
        return count || 0;
    },
    async createSubject(formData: { name: string, schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').insert({ name: formData.name, school_id: formData.schoolId });
        handleSupabaseError(error, 'createSubject');
    },
    async updateSubject(id: string, formData: { name: string, schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').update({ name: formData.name, school_id: formData.schoolId }).eq('id', id);
        handleSupabaseError(error, 'updateSubject');
    },
    async deleteSubject(id: string): Promise<void> {
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        handleSupabaseError(error, 'deleteSubject');
    },

    // Class Management
    async getClasses(filters?: { teacherId?: string }): Promise<Class[]> {
        // Step 1: Fetch all related data into maps for efficient lookup
        const { data: schools, error: sError } = await supabase.from('schools').select('id, name');
        handleSupabaseError(sError, 'getClasses (schools)');
        const schoolMap = new Map(schools?.map(s => [s.id, s.name]));

        const { data: teachers, error: tError } = await supabase.from('profiles').select('id, full_name').eq('role', 'Teacher');
        handleSupabaseError(tError, 'getClasses (teachers)');
        const teacherMap = new Map(teachers?.map(t => [t.id, t.full_name]));

        // Step 2: Fetch the main classes data
        let query = supabase.from('classes').select('id, name, school_id, teacher_id');
        if (filters?.teacherId) {
            query = query.eq('teacher_id', filters.teacherId);
        }
        const { data, error } = await query;
        handleSupabaseError(error, 'getClasses');

        // Step 3: Map and combine the data
        return data?.map(c => ({
            id: c.id,
            name: c.name,
            schoolId: c.school_id,
            teacherId: c.teacher_id,
            schoolName: schoolMap.get(c.school_id) || 'N/A',
            teacherName: teacherMap.get(c.teacher_id) || 'N/A',
        })) || [];
    },
    async getStudentsInClass(classId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('class_members')
            .select('profiles(id, identity_number, full_name, role, avatar_url, school_id)')
            .eq('class_id', classId);

        handleSupabaseError(error, 'getStudentsInClass');

        // The join might return a complex object, so we normalize it
        // @ts-ignore
        return data?.map(m => m.profiles).filter(Boolean).map(p => ({
            id: p.id,
            email: '',
            identityNumber: p.identity_number,
            name: p.full_name,
            role: p.role as UserRole,
            avatarUrl: p.avatar_url,
            schoolId: p.school_id,
        })) || [];
    },
    async createClass(formData: any): Promise<void> {
        const { data, error } = await supabase.from('classes').insert({
            name: formData.name,
            school_id: formData.schoolId,
            teacher_id: formData.teacherId,
        }).select().single();
        handleSupabaseError(error, 'createClass (insert)');

        if (formData.studentIds && formData.studentIds.length > 0) {
            const members = formData.studentIds.map((student_id: string) => ({
                class_id: data.id,
                student_id,
            }));
            const { error: memberError } = await supabase.from('class_members').insert(members);
            handleSupabaseError(memberError, 'createClass (add members)');
        }
    },
    async updateClass(id: string, formData: any): Promise<void> {
        const { error } = await supabase.from('classes').update({
             name: formData.name,
             school_id: formData.schoolId,
             teacher_id: formData.teacherId,
        }).eq('id', id);
        handleSupabaseError(error, 'updateClass');
        
        // Replace all members with the new list
        const { error: deleteError } = await supabase.from('class_members').delete().eq('class_id', id);
        handleSupabaseError(deleteError, 'updateClass (delete members)');

        if (formData.studentIds && formData.studentIds.length > 0) {
             const members = formData.studentIds.map((student_id: string) => ({
                class_id: id,
                student_id,
            }));
            const { error: insertError } = await supabase.from('class_members').insert(members);
            handleSupabaseError(insertError, 'updateClass (insert members)');
        }
    },
    async deleteClass(id: string): Promise<void> {
        // RLS might require deleting members first
        await supabase.from('class_members').delete().eq('class_id', id);
        const { error } = await supabase.from('classes').delete().eq('id', id);
        handleSupabaseError(error, 'deleteClass');
    },
};
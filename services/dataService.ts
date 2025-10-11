

import { supabase } from './supabaseClient';
// FIX: Imported JournalEntry type to resolve reference error.
import { User, UserRole, School, Announcement, GamificationProfile, Subject, Class, Badge, JournalEntry, TeachingJournal } from '../types';
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
            // FIX: Convert role to lowercase to match database enum format.
            query = query.eq('role', filters.role.toLowerCase());
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
            // FIX: Convert role to lowercase before sending to the database.
            role: formData.role.toLowerCase(),
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
            // FIX: Convert role to lowercase before sending to the database.
            role: formData.role.toLowerCase(),
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
            // FIX: Convert role to lowercase to match database enum format.
            .eq('role', filters.role.toLowerCase())
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

    async getClassForStudent(studentId: string): Promise<string | null> {
         const { data, error } = await supabase
            .from('enrollments')
            .select('classes(name)')
            .eq('student_id', studentId)
            .limit(1)
            .single();
        
        if(error && error.code !== 'PGRST116') {
             handleSupabaseError(error, 'getClassForStudent');
        }
        // @ts-ignore
        return data?.classes?.name || null;
    },

    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string, teacherName: string }> {
        // This is a complex query. Assuming the teacher note comes from the homeroom teacher of the student's class
        return { note: 'Fitur catatan guru sedang dalam pengembangan.', teacherName: '' };
    },
    
    // Teacher Data & Journals
    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        const { data, error } = await supabase
            .from('teaching_journals')
            .select('id, date, topic_taught, subject_id, class_id, classes(name), subjects(name)')
            .eq('teacher_id', teacherId)
            .order('date', { ascending: false });

        handleSupabaseError(error, 'getTeachingJournals');
        
        return data?.map(j => ({
            id: j.id,
            teacherId: teacherId,
            classId: j.class_id,
            subjectId: j.subject_id,
            date: j.date,
            topic: j.topic_taught,
            // @ts-ignore
            className: j.classes?.name || 'Unknown',
            // @ts-ignore
            subjectName: j.subjects?.name || 'Unknown',
        })) || [];
    },

    async createTeachingJournal(journalData: Omit<TeachingJournal, 'id' | 'className' | 'subjectName'>): Promise<void> {
        const { error } = await supabase.from('teaching_journals').insert({
            teacher_id: journalData.teacherId,
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            date: journalData.date,
            topic_taught: journalData.topic,
        });
        handleSupabaseError(error, 'createTeachingJournal');
    },

    async updateTeachingJournal(journalId: number, journalData: Partial<Omit<TeachingJournal, 'id'>>): Promise<void> {
        const { error } = await supabase.from('teaching_journals').update({
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            date: journalData.date,
            topic_taught: journalData.topic,
        }).eq('id', journalId);
        handleSupabaseError(error, 'updateTeachingJournal');
    },

    async deleteTeachingJournal(journalId: number): Promise<void> {
        const { error } = await supabase.from('teaching_journals').delete().eq('id', journalId);
        handleSupabaseError(error, 'deleteTeachingJournal');
    },

    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        const { data, error } = await supabase
            .from('teaching_journals')
            .select('topic_taught, subject_id, class_id')
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
            class: classMap.get(j.class_id) || 'Unknown',
            topic: j.topic_taught
        }));
    },

    // Gamification
    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        const { data: badges, error: badgesError } = await supabase
            .from('student_badges')
            .select('badges(id, name, description, icon_emoji)')
            .eq('student_id', studentId);
        handleSupabaseError(badgesError, 'getGamificationProfile (badges)');

        return {
            progress: { "Matematika": 80, "Fisika": 65 }, // Mocked until student_progress table exists
            // @ts-ignore
            badges: badges?.map(b => ({ ...b.badges, icon: b.badges.icon_emoji })) || []
        };
    },

    // Academic Reports
    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
        const { data, error } = await supabase.rpc('get_school_average_scores');
        handleSupabaseError(error, 'getSchoolPerformance');
        return data?.map(d => ({...d, 'Rata-rata Nilai': d.average_score })) || [];
    },
    
     async getClassSchedule(classId: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
        // This is a complex query and requires a proper class_schedules table
        return {
            "Senin": [{ time: "07:30 - 09:00", subject: "Matematika" }],
            "Selasa": [{ time: "07:30 - 09:00", subject: "Bahasa Indonesia" }],
        }
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
        const { data: schools, error: sError } = await supabase.from('schools').select('id, name');
        handleSupabaseError(sError, 'getSubjects (schools)');
        const schoolMap = new Map(schools?.map(s => [s.id, s.name]));
    
        let query = supabase.from('subjects').select('*');
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        
        const { data, error } = await query;
        handleSupabaseError(error, 'getSubjects');

        return data?.map(s => ({
            ...s,
            schoolName: schoolMap.get(s.school_id) || 'N/A'
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
        const { data: schools, error: sError } = await supabase.from('schools').select('id, name');
        handleSupabaseError(sError, 'getClasses (schools)');
        const schoolMap = new Map(schools?.map(s => [s.id, s.name]));

        // FIX: Replaced the failing separate teacher query with a more efficient relational query.
        // This fetches the homeroom teacher's name directly with the class data, avoiding the 400 Bad Request error.
        let query = supabase
            .from('classes')
            .select('id, name, school_id, homeroom_teacher_id, profiles(full_name)');
            
        if (filters?.teacherId) {
            query = query.eq('homeroom_teacher_id', filters.teacherId);
        }
        const { data, error } = await query;
        handleSupabaseError(error, 'getClasses');

        return data?.map(c => ({
            id: c.id,
            name: c.name,
            schoolId: c.school_id,
            homeroomTeacherId: c.homeroom_teacher_id,
            schoolName: schoolMap.get(c.school_id) || 'N/A',
            // @ts-ignore - Accessing the joined profile data.
            homeroomTeacherName: c.profiles?.full_name || 'N/A',
        })) || [];
    },
    async getStudentsInClass(classId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('enrollments')
            .select('profiles(id, identity_number, full_name, role, avatar_url, school_id)')
            .eq('class_id', classId);

        handleSupabaseError(error, 'getStudentsInClass');

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
            homeroom_teacher_id: formData.homeroomTeacherId,
            academic_year: new Date().getFullYear().toString(), // Add academic year
        }).select().single();
        handleSupabaseError(error, 'createClass (insert)');

        if (formData.studentIds && formData.studentIds.length > 0) {
            const members = formData.studentIds.map((student_id: string) => ({
                class_id: data.id,
                student_id,
                academic_year: new Date().getFullYear().toString(),
            }));
            const { error: memberError } = await supabase.from('enrollments').insert(members);
            handleSupabaseError(memberError, 'createClass (add members)');
        }
    },
    async updateClass(id: string, formData: any): Promise<void> {
        const { error } = await supabase.from('classes').update({
             name: formData.name,
             school_id: formData.schoolId,
             homeroom_teacher_id: formData.homeroomTeacherId,
        }).eq('id', id);
        handleSupabaseError(error, 'updateClass');
        
        const { error: deleteError } = await supabase.from('enrollments').delete().eq('class_id', id);
        handleSupabaseError(deleteError, 'updateClass (delete members)');

        if (formData.studentIds && formData.studentIds.length > 0) {
             const members = formData.studentIds.map((student_id: string) => ({
                class_id: id,
                student_id,
                academic_year: new Date().getFullYear().toString(),
            }));
            const { error: insertError } = await supabase.from('enrollments').insert(members);
            handleSupabaseError(insertError, 'updateClass (insert members)');
        }
    },
    async deleteClass(id: string): Promise<void> {
        await supabase.from('enrollments').delete().eq('class_id', id);
        const { error } = await supabase.from('classes').delete().eq('id', id);
        handleSupabaseError(error, 'deleteClass');
    },
};
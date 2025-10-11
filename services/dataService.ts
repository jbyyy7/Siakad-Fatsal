import { supabase } from './supabaseClient';
import {
    User,
    UserRole,
    School,
    Announcement,
    JournalEntry,
    TeachingJournal,
    GamificationProfile,
    Subject,
    Class
} from '../types';


// Main service object
export const dataService = {
    // === User Management ===
    async getUsers(filters: { role?: UserRole, schoolId?: string } = {}): Promise<User[]> {
        // FIX: Added explicit type annotation for the query to ensure type safety.
        let query: any = supabase.from('profiles').select(`
            id,
            identity_number,
            full_name,
            role,
            avatar_url,
            school_id,
            schools ( name )
        `);
        if (filters.role) {
            query = query.eq('role', filters.role.toLowerCase());
        }
        if (filters.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { data, error } = await query;
        if (error) throw error;
        
        // FIX: Used Object.values(UserRole) to find the correct cased enum value instead of simple capitalization.
        const roleMap = new Map(Object.values(UserRole).map(role => [role.toLowerCase(), role]));

        return data.map((profile: any) => ({
            id: profile.id,
            identityNumber: profile.identity_number,
            name: profile.full_name,
            role: roleMap.get(profile.role.toLowerCase()) || profile.role,
            avatarUrl: profile.avatar_url,
            schoolId: profile.school_id,
            schoolName: profile.schools?.name,
            email: '' // Not fetched here for security/privacy
        }));
    },
    
    async getUserCount(filters: { role?: UserRole, schoolId?: string }): Promise<number> {
        let query = supabase.from('profiles').select('id', { count: 'exact', head: true });
        if (filters.role) {
            query = query.eq('role', filters.role.toLowerCase());
        }
        if (filters.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
    },
    
    async createUser(userData: any): Promise<void> {
        // This is complex because it involves auth.users and profiles table.
        // Assuming an RPC function `create_new_user` exists for simplicity.
        // This is a common pattern with Supabase to handle user creation with profiles securely.
        const { error } = await supabase.rpc('create_new_user', {
            p_email: userData.email,
            p_password: userData.password,
            p_full_name: userData.name,
            p_identity_number: userData.identityNumber,
            p_role: userData.role.toLowerCase(),
            p_school_id: userData.schoolId || null,
            p_avatar_url: userData.avatarUrl,
        });
        if (error) {
            if (error.message.includes('duplicate key value violates unique constraint "profiles_identity_number_key"')) {
                throw new Error('Nomor Induk sudah terdaftar.');
            }
            if (error.message.includes('duplicate key value violates unique constraint "profiles_email_key"')) {
                throw new Error('Email sudah terdaftar.');
            }
             if (error.message.includes('new row violates row-level security policy')) {
                throw new Error('Aksi tidak diizinkan. Periksa kebijakan RLS untuk tabel profiles.');
            }
            throw error;
        }
    },

    async updateUser(userId: string, userData: any): Promise<void> {
        const { error } = await supabase.from('profiles').update({
            full_name: userData.name,
            identity_number: userData.identityNumber,
            role: userData.role.toLowerCase(),
            school_id: userData.schoolId || null,
            avatar_url: userData.avatarUrl
        }).eq('id', userId);
        if (error) throw error;
    },

    async deleteUser(userId: string): Promise<void> {
         // Deleting a user should be a cascading operation handled by DB or an RPC function
         // e.g. calling an admin-privileged edge function or RPC.
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
    },

    // === School Management ===
    async getSchools(): Promise<School[]> {
        const { data, error } = await supabase.from('schools').select('*');
        if (error) throw error;
        return data;
    },

    async getSchoolCount(): Promise<number> {
        const { count, error } = await supabase.from('schools').select('id', { count: 'exact', head: true });
        if (error) throw error;
        return count || 0;
    },
    
    async createSchool(schoolData: Omit<School, 'id'>): Promise<void> {
        const { error } = await supabase.from('schools').insert([schoolData]);
        if (error) throw error;
    },
    
    async updateSchool(schoolId: string, schoolData: Omit<School, 'id'>): Promise<void> {
        const { error } = await supabase.from('schools').update(schoolData).eq('id', schoolId);
        if (error) throw error;
    },
    
    async deleteSchool(schoolId: string): Promise<void> {
        const { error } = await supabase.from('schools').delete().eq('id', schoolId);
        if (error) throw error;
    },

    // === Subject Management ===
    async getSubjects(filters: { schoolId?: string } = {}): Promise<Subject[]> {
        let query = supabase.from('subjects').select('*, schools(name)');
        if(filters.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map((s: any) => ({
            id: s.id,
            name: s.name,
            schoolId: s.school_id,
            schoolName: s.schools.name
        }));
    },
    
    async createSubject(subjectData: { name: string, schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').insert([{ name: subjectData.name, school_id: subjectData.schoolId }]);
        if (error) throw error;
    },

    async updateSubject(subjectId: string, subjectData: { name: string, schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').update({ name: subjectData.name, school_id: subjectData.schoolId }).eq('id', subjectId);
        if (error) throw error;
    },
    
    async deleteSubject(subjectId: string): Promise<void> {
        const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
        if (error) throw error;
    },

    // === Class Management ===
    async getClasses(filters: { teacherId?: string } = {}): Promise<Class[]> {
        let query = supabase.from('classes').select('*, homeroom:profiles!homeroom_teacher_id(full_name)');
        if (filters.teacherId) {
            query = query.or(`homeroom_teacher_id.eq.${filters.teacherId}`); // Simplified logic for demo
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            schoolId: c.school_id,
            homeroomTeacherId: c.homeroom_teacher_id,
            homeroomTeacherName: c.homeroom?.full_name,
        }));
    },
    
    async getStudentsInClass(classId: string): Promise<User[]> {
        const { data, error } = await supabase.from('profiles').select('*').eq('class_id', classId);
        if (error) throw error;
        return data.map((profile: any) => ({
            id: profile.id,
            identityNumber: profile.identity_number,
            name: profile.full_name,
            role: UserRole.STUDENT,
            avatarUrl: profile.avatar_url,
            schoolId: profile.school_id,
            email: '' // Not fetching email
        }));
    },

    async createClass(classData: any): Promise<void> {
        const { data: newClass, error: classError } = await supabase.from('classes').insert({
            name: classData.name,
            school_id: classData.schoolId,
            homeroom_teacher_id: classData.homeroomTeacherId || null,
        }).select().single();
        if (classError) throw classError;

        if (classData.studentIds && classData.studentIds.length > 0) {
            const { error: studentError } = await supabase.from('profiles')
                .update({ class_id: newClass.id })
                .in('id', classData.studentIds);
            if (studentError) throw studentError;
        }
    },
    
    async updateClass(classId: string, classData: any): Promise<void> {
        const { error: classError } = await supabase.from('classes').update({
            name: classData.name,
            school_id: classData.schoolId,
            homeroom_teacher_id: classData.homeroomTeacherId || null,
        }).eq('id', classId);
        if (classError) throw classError;
        await supabase.from('profiles').update({ class_id: null }).eq('class_id', classId);
        if (classData.studentIds && classData.studentIds.length > 0) {
            await supabase.from('profiles').update({ class_id: classId }).in('id', classData.studentIds);
        }
    },
    
    async deleteClass(classId: string): Promise<void> {
        await supabase.from('profiles').update({ class_id: null }).eq('class_id', classId);
        const { error } = await supabase.from('classes').delete().eq('id', classId);
        if (error) throw error;
    },

    // === Student-specific Data (Mocked) ===
    getGradesForStudent: async (studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> => Promise.resolve([
        { subject: 'Matematika', score: 85, grade: 'A-' },
        { subject: 'Bahasa Indonesia', score: 92, grade: 'A' },
        { subject: 'Fisika', score: 78, grade: 'B+' },
        { subject: 'Kimia', score: 88, grade: 'A-' },
        { subject: 'Bahasa Inggris', score: 95, grade: 'A' },
    ]),
    
    getAttendanceForStudent: async (studentId: string): Promise<{ date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> => Promise.resolve([
        { date: '2024-07-01', status: 'Hadir' }, { date: '2024-07-02', status: 'Hadir' },
        { date: '2024-07-03', status: 'Sakit' }, { date: '2024-07-04', status: 'Hadir' },
        { date: '2024-07-05', status: 'Izin' }, { date: '2024-07-08', status: 'Hadir' }
    ]),
    
    async getClassForStudent(studentId: string): Promise<string | null> {
        const { data, error } = await supabase.from('profiles').select('classes(name)').eq('id', studentId).single();
        return (!error && data?.classes?.name) || null;
    },

    getTeacherNoteForStudent: async (studentId: string): Promise<{ note: string, teacherName: string }> => Promise.resolve({ note: 'Sangat aktif di kelas dan menunjukkan perkembangan yang baik. Pertahankan!', teacherName: 'Budi Hartono, S.Pd.' }),
    
    // === Teacher-specific Data ===
    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        const { data, error } = await supabase
            .from('teaching_journals')
            .select('topic, classes(name), subjects(name)')
            .eq('teacher_id', teacherId).eq('date', date);
        if(error) throw error;
        return data.map((j: any) => ({ topic: j.topic, class: j.classes.name, subject: j.subjects.name }));
    },

    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        const { data, error } = await supabase.from('teaching_journals').select('*, className:classes(name), subjectName:subjects(name)').eq('teacher_id', teacherId);
        if (error) throw error;
        return data.map((j: any) => ({
            id: j.id, teacherId: j.teacher_id, classId: j.class_id, subjectId: j.subject_id,
            date: j.date, topic: j.topic, className: j.className.name, subjectName: j.subjectName.name,
        }));
    },

    async createTeachingJournal(journalData: any): Promise<void> {
        const { error } = await supabase.from('teaching_journals').insert({
            teacher_id: journalData.teacherId,
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            date: journalData.date,
            topic: journalData.topic,
        });
        if (error) throw error;
    },

    async updateTeachingJournal(journalId: number, journalData: any): Promise<void> {
        const { error } = await supabase.from('teaching_journals').update({
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            date: journalData.date,
            topic: journalData.topic,
        }).eq('id', journalId);
        if (error) throw error;
    },

    async deleteTeachingJournal(journalId: number): Promise<void> {
        const { error } = await supabase.from('teaching_journals').delete().eq('id', journalId);
        if (error) throw error;
    },
    
    // === Foundation/Principal Reports (Mocked) ===
    getSchoolPerformance: async (): Promise<{ school: string, 'Rata-rata Nilai': number }[]> => Promise.resolve([
        { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.2 },
        { school: 'MTS Fathus Salafi', 'Rata-rata Nilai': 82.1 },
        { school: 'SD Fathus Salafi', 'Rata-rata Nilai': 88.5 },
    ]),
    
    getAverageGradesBySubject: async (schoolId: string): Promise<{ subject: string; avg: number }[]> => Promise.resolve([
        { subject: 'Matematika', avg: 82 }, { subject: 'Fisika', avg: 78 },
        { subject: 'Kimia', avg: 85 }, { subject: 'Biologi', avg: 88 },
        { subject: 'B. Indo', avg: 90 }, { subject: 'B. Ing', avg: 91 },
    ]),
    
    getAttendanceTrend: async (schoolId: string): Promise<{ month: string; percentage: number }[]> => Promise.resolve([
        { month: 'Jan', percentage: 98 }, { month: 'Feb', percentage: 97 },
        { month: 'Mar', percentage: 97.5 }, { month: 'Apr', percentage: 96 },
        { month: 'Mei', percentage: 98.2 }, { month: 'Jun', percentage: 99 },
    ]),
    
    // === Announcements ===
    async getAnnouncements(): Promise<Announcement[]> {
        const { data, error } = await supabase.from('announcements').select('*').order('date', { ascending: false });
        if (error) throw error;
        return data;
    },
    
    async createAnnouncement(announcementData: { title: string, content: string, author: string }): Promise<void> {
        const { error } = await supabase.from('announcements').insert([{ ...announcementData, date: new Date().toISOString().split('T')[0] }]);
        if (error) throw error;
    },
    
    async deleteAnnouncement(announcementId: string): Promise<void> {
        const { error } = await supabase.from('announcements').delete().eq('id', announcementId);
        if (error) throw error;
    },
    
    // === Other (Mocked) ===
    getClassSchedule: async (className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> => Promise.resolve({
        "Senin": [{ time: '07:30 - 09:00', subject: 'Upacara & Matematika' }, { time: '10:00 - 11:30', subject: 'Bahasa Indonesia' }],
        "Selasa": [{ time: '07:30 - 09:00', subject: 'Fisika' }, { time: '10:00 - 11:30', subject: 'Bahasa Inggris' }],
        "Rabu": [{ time: '07:30 - 09:00', subject: 'Kimia' }, { time: '10:00 - 11:30', subject: 'Biologi' }],
        "Kamis": [{ time: '07:30 - 09:00', subject: 'PAI' }, { time: '10:00 - 11:30', subject: 'Sejarah' }],
        "Jumat": [{ time: '07:30 - 09:00', subject: 'Olahraga' }, { time: '10:00 - 11:30', subject: 'Seni Budaya' }],
    }),

    getGamificationProfile: async (studentId: string): Promise<GamificationProfile> => Promise.resolve({
        progress: { 'Aljabar Linear': 75, 'Termodinamika': 60, 'Sastra Klasik': 95 },
        badges: [
            { id: '1', icon: '🥇', name: 'Jagoan Aljabar', description: 'Menyelesaikan semua kuis Aljabar.' },
            { id: '2', icon: '🔥', name: 'Runtutan Belajar 7 Hari', description: 'Login dan belajar selama 7 hari berturut-turut.' },
            { id: '3', icon: '✍️', name: 'Pujangga Muda', description: 'Mendapat nilai A di Sastra Klasik.' },
        ]
    }),
};

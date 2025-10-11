// services/dataService.ts
import { supabase } from './supabaseClient';
import {
    User, UserRole, School, Announcement, TeachingJournal, Subject, Class, GamificationProfile, JournalEntry
} from '../types';
import { PostgrestError } from '@supabase/supabase-js';

// --- HELPER FUNCTIONS ---

// Centralized error handler to provide user-friendly messages
const handleSupabaseError = (error: PostgrestError | null, context: string): never => {
    console.error(`Supabase error in ${context}:`, error);
    let message = `Gagal mengambil data dari server (${context}).`;

    if (error) {
        if (error.code === '23505') { // Unique constraint violation
            if (context.includes('Subject')) {
                 message = 'Mata pelajaran dengan nama ini sudah ada untuk sekolah yang dipilih.';
            } else {
                 message = 'Data yang Anda masukkan sudah ada (duplikat).';
            }
        } else if (error.message.includes('violates row-level security policy')) {
            message = `Akses ditolak. Anda tidak memiliki izin untuk melakukan aksi ini pada '${context}'. Periksa kebijakan RLS di Supabase.`;
        } else {
            message = error.message;
        }
    }
    throw new Error(message);
};

// --- DATA SERVICE IMPLEMENTATION ---

export const dataService = {
    // --- Users ---
    async getUsers(filters?: { role?: UserRole; schoolId?: string }): Promise<User[]> {
        let query = supabase.from('profiles').select(`
            id,
            identity_number,
            full_name,
            role,
            avatar_url,
            school_id,
            school:schools(name)
        `).order('full_name', { ascending: true });

        if (filters?.role) {
            query = query.eq('role', filters.role);
        }
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }

        const { data, error } = await query;
        if (error) handleSupabaseError(error, 'getUsers');
        
        return data.map((profile: any) => ({
            id: profile.id,
            name: profile.full_name,
            identityNumber: profile.identity_number,
            role: profile.role,
            avatarUrl: profile.avatar_url,
            schoolId: profile.school_id,
            schoolName: profile.school?.name,
            email: '' // Email is not exposed for privacy
        }));
    },

    async createUser(userData: any): Promise<void> {
        // Step 1: Sign up the user in Supabase Auth.
        // A trigger in Supabase should then copy this data to the public.profiles table.
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email: userData.email.trim(),
            password: userData.password,
            options: {
                data: {
                    full_name: userData.name,
                    identity_number: userData.identityNumber,
                    role: userData.role,
                    school_id: userData.schoolId || null,
                    avatar_url: userData.avatarUrl,
                },
            },
        });

        if (signUpError) {
            console.error('Supabase signup error:', signUpError);
             if (signUpError.message.toLowerCase().includes('email address is invalid')) {
                throw new Error('Format email tidak valid. Pastikan tidak ada spasi.');
            }
            throw new Error(signUpError.message);
        }

        if (!user) {
            throw new Error('Gagal mendaftarkan pengguna, tidak ada data pengguna yang dikembalikan.');
        }
    },

    async updateUser(userId: string, userData: any): Promise<void> {
        const { error } = await supabase.from('profiles').update({
            full_name: userData.name,
            identity_number: userData.identityNumber,
            role: userData.role,
            school_id: userData.schoolId || null,
        }).eq('id', userId);

        if (error) handleSupabaseError(error, 'updateUser');
    },

    async deleteUser(userId: string): Promise<void> {
        // Deleting a user requires elevated privileges and should be done via an RPC function
        // that uses the `service_role` key on the server-side for security.
        const { error } = await supabase.rpc('delete_user', { user_id: userId });
        if (error) handleSupabaseError(error, 'deleteUser RPC. Pastikan fungsi 'delete_user' ada di database Anda.');
    },

    async getUserCount(filters?: { role?: UserRole; schoolId?: string }): Promise<number> {
        let query = supabase.from('profiles').select('id', { count: 'exact', head: true });
        if (filters?.role) {
            query = query.eq('role', filters.role);
        }
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { count, error } = await query;
        if (error) handleSupabaseError(error, 'getUserCount');
        return count ?? 0;
    },

    // --- Schools ---
    async getSchools(): Promise<School[]> {
        const { data, error } = await supabase.from('schools').select('*').order('name');
        if (error) handleSupabaseError(error, 'getSchools');
        return data;
    },
    async createSchool(schoolData: Omit<School, 'id'>): Promise<void> {
        const { error } = await supabase.from('schools').insert([schoolData]);
        if (error) handleSupabaseError(error, 'createSchool');
    },
    async updateSchool(schoolId: string, schoolData: Omit<School, 'id'>): Promise<void> {
        const { error } = await supabase.from('schools').update(schoolData).eq('id', schoolId);
        if (error) handleSupabaseError(error, 'updateSchool');
    },
    async deleteSchool(schoolId: string): Promise<void> {
        const { error } = await supabase.from('schools').delete().eq('id', schoolId);
        if (error) handleSupabaseError(error, 'deleteSchool');
    },
    async getSchoolCount(): Promise<number> {
        const { count, error } = await supabase.from('schools').select('id', { count: 'exact', head: true });
        if (error) handleSupabaseError(error, 'getSchoolCount');
        return count ?? 0;
    },
    
    // --- Subjects ---
    async getSubjects(filters?: { schoolId?: string }): Promise<Subject[]> {
        let query = supabase.from('subjects').select(`*, school:schools(name)`).order('name');
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { data, error } = await query;
        if (error) handleSupabaseError(error, 'getSubjects');
        return data.map((d: any) => ({ ...d, schoolName: d.school?.name }));
    },
    async createSubject(subjectData: { name: string, schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').insert([{ name: subjectData.name, school_id: subjectData.schoolId }]);
        if (error) handleSupabaseError(error, 'createSubject');
    },
    async updateSubject(subjectId: string, subjectData: { name: string, schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').update({ name: subjectData.name, school_id: subjectData.schoolId }).eq('id', subjectId);
        if (error) handleSupabaseError(error, 'updateSubject');
    },
    async deleteSubject(subjectId: string): Promise<void> {
        const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
        if (error) handleSupabaseError(error, 'deleteSubject');
    },

    // --- Classes ---
    async getClasses(filters?: { teacherId?: string }): Promise<Class[]> {
        let query = supabase.from('classes').select(`
            id, name, school_id, homeroom_teacher_id,
            school:schools(name),
            teacher:profiles(full_name)
        `).order('name');
        
        if (filters?.teacherId) {
            query = query.eq('homeroom_teacher_id', filters.teacherId);
        }
        
        const { data, error } = await query;
        if (error) handleSupabaseError(error, 'getClasses');
        return data.map((cls: any) => ({
            id: cls.id,
            name: cls.name,
            schoolId: cls.school_id,
            homeroomTeacherId: cls.homeroom_teacher_id,
            schoolName: cls.school?.name,
            homeroomTeacherName: cls.teacher?.full_name,
        }));
    },
    async createClass(classData: any): Promise<void> {
        const { data, error } = await supabase.from('classes').insert({
            name: classData.name,
            school_id: classData.schoolId,
            homeroom_teacher_id: classData.homeroomTeacherId || null,
        }).select('id').single();

        if (error) handleSupabaseError(error, 'createClass (insert)');
        if (!data) throw new Error("Gagal membuat kelas, tidak ada ID yang dikembalikan.");

        if (classData.studentIds && classData.studentIds.length > 0) {
            const studentLinks = classData.studentIds.map((studentId: string) => ({
                class_id: data.id,
                student_id: studentId,
            }));
            const { error: studentError } = await supabase.from('class_students').insert(studentLinks);
            if (studentError) handleSupabaseError(studentError, 'createClass (link students)');
        }
    },
    async updateClass(classId: string, classData: any): Promise<void> {
        const { error } = await supabase.from('classes').update({
            name: classData.name,
            school_id: classData.schoolId,
            homeroom_teacher_id: classData.homeroomTeacherId || null,
        }).eq('id', classId);
        if (error) handleSupabaseError(error, 'updateClass (update)');

        const { error: deleteError } = await supabase.from('class_students').delete().eq('class_id', classId);
        if (deleteError) handleSupabaseError(deleteError, 'updateClass (unlink students)');
        
        if (classData.studentIds && classData.studentIds.length > 0) {
            const studentLinks = classData.studentIds.map((studentId: string) => ({
                class_id: classId,
                student_id: studentId,
            }));
            const { error: insertError } = await supabase.from('class_students').insert(studentLinks);
            if (insertError) handleSupabaseError(insertError, 'updateClass (relink students)');
        }
    },
    async deleteClass(classId: string): Promise<void> {
        const { error } = await supabase.from('classes').delete().eq('id', classId);
        if (error) handleSupabaseError(error, 'deleteClass');
    },
    async getStudentsInClass(classId: string): Promise<User[]> {
        const { data, error } = await supabase.from('class_students').select(`
            student:profiles(id, full_name, identity_number, avatar_url, role)
        `).eq('class_id', classId);
        
        if (error) handleSupabaseError(error, 'getStudentsInClass');
        return data.map((item: any) => ({
            id: item.student.id,
            name: item.student.full_name,
            identityNumber: item.student.identity_number,
            avatarUrl: item.student.avatar_url,
            role: item.student.role,
            email: ''
        }));
    },

    // --- Teaching Journals ---
    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        const { data, error } = await supabase
            .from('teaching_journals')
            .select(`
                id, date, topic, class_id, subject_id,
                class:classes(name),
                subject:subjects(name)
            `)
            .eq('teacher_id', teacherId)
            .order('date', { ascending: false });
        if (error) handleSupabaseError(error, 'getTeachingJournals');
        return data.map((j: any) => ({
            id: j.id,
            teacherId: teacherId,
            classId: j.class_id,
            subjectId: j.subject_id,
            date: j.date,
            topic: j.topic,
            className: j.class?.name,
            subjectName: j.subject?.name,
        }));
    },
    async createTeachingJournal(data: any): Promise<void> {
        const { error } = await supabase.from('teaching_journals').insert([{
            teacher_id: data.teacherId,
            class_id: data.classId,
            subject_id: data.subjectId,
            date: data.date,
            topic: data.topic
        }]);
        if (error) handleSupabaseError(error, 'createTeachingJournal');
    },
    async updateTeachingJournal(journalId: number, data: any): Promise<void> {
        const { error } = await supabase.from('teaching_journals').update({
            class_id: data.classId,
            subject_id: data.subjectId,
            date: data.date,
            topic: data.topic
        }).eq('id', journalId);
        if (error) handleSupabaseError(error, 'updateTeachingJournal');
    },
    async deleteTeachingJournal(journalId: number): Promise<void> {
        const { error } = await supabase.from('teaching_journals').delete().eq('id', journalId);
        if (error) handleSupabaseError(error, 'deleteTeachingJournal');
    },

    // --- Announcements ---
    async getAnnouncements(): Promise<Announcement[]> {
        const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        if (error) handleSupabaseError(error, 'getAnnouncements');
        return data.map((a: any) => ({
            id: a.id,
            title: a.title,
            content: a.content,
            date: a.created_at.split('T')[0],
            author: a.author_name,
        }));
    },
    async createAnnouncement(data: { title: string, content: string, author: string }): Promise<void> {
        const { error } = await supabase.from('announcements').insert([{
            title: data.title,
            content: data.content,
            author_name: data.author,
        }]);
        if (error) handleSupabaseError(error, 'createAnnouncement');
    },
    async deleteAnnouncement(id: string): Promise<void> {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteAnnouncement');
    },

    // --- MOCKED/PLACEHOLDER SECTIONS (For complex features not yet implemented in DB) ---
    async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
        return [
            { subject: 'Matematika', score: 85, grade: 'A-' },
            { subject: 'Bahasa Indonesia', score: 92, grade: 'A' },
            { subject: 'Fisika', score: 78, grade: 'B+' },
        ];
    },
    async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> {
        return [
            { date: '2024-07-01', status: 'Hadir' }, { date: '2024-07-02', status: 'Hadir' },
            { date: '2024-07-03', status: 'Sakit' }, { date: '2024-07-04', status: 'Hadir' },
        ];
    },
    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string; teacherName: string; }> {
        return { note: "Siswa menunjukkan kemajuan yang sangat baik. Terus tingkatkan!", teacherName: "Wali Kelas" };
    },
    async getClassForStudent(studentId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('class_students').select('class:classes(name)').eq('student_id', studentId).single();
        if (error || !data) return null;
        return data.class?.name || null;
    },
    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        const { data, error } = await supabase.from('teaching_journals')
            .select(`*, class:classes(name), subject:subjects(name)`)
            .eq('teacher_id', teacherId).eq('date', date);
        if (error) handleSupabaseError(error, 'getJournalForTeacher');
        return data.map(j => ({ subject: j.subject.name, class: j.class.name, topic: j.topic }));
    },
    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        return {
            progress: { 'Matematika': 85, 'Fisika': 78, 'B. Indo': 92 },
            badges: [{ id: 'b1', icon: '🚀', name: 'Penyelesai Cepat', description: 'Tugas selesai sebelum deadline' }]
        };
    },
    async getClassSchedule(className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
        return {
            'Senin': [{ time: '07:30 - 09:00', subject: 'Matematika' }],
            'Selasa': [{ time: '07:30 - 09:00', subject: 'Fisika' }],
        };
    },
    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
        return [{ school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.2 }];
    },
    async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number; }[]> {
        return [{ subject: 'Matematika', avg: 82 }];
    },
    async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number; }[]> {
        return [{ month: 'Jan', percentage: 98 }];
    }
};

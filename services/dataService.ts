import { supabase } from './supabaseClient';
import {
    User,
    UserRole,
    School,
    Announcement,
    JournalEntry,
    TeachingJournal,
    GamificationProfile,
    Badge,
    Subject,
    Class,
} from '../types';

// Helper to handle Supabase errors consistently
const handleSupabaseError = (error: any, context: string) => {
    console.error(`Supabase error in ${context}:`, error);
    throw new Error(`Gagal mengambil data dari server (${context}).`);
};

// Helper function to map Supabase user profile to app's User type
const mapProfileToUser = (profile: any): User => {
    return {
        id: profile.id,
        email: '', // Email is not in profiles table, handle this gracefully
        identityNumber: profile.identity_number,
        name: profile.full_name,
        role: profile.role as UserRole,
        avatarUrl: profile.avatar_url,
        schoolId: profile.school_id,
        schoolName: profile.schools?.name,
    };
};

export const dataService = {
    // --- User Management ---
    async getUsers(filters?: { role?: UserRole; schoolId?: string }): Promise<User[]> {
        let query = supabase.from('profiles').select(`
            id,
            identity_number,
            full_name,
            role,
            avatar_url,
            school_id,
            schools (name)
        `);

        if (filters?.role) {
            query = query.eq('role', filters.role);
        }
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }

        const { data, error } = await query;
        if (error) handleSupabaseError(error, 'getUsers');
        return data ? data.map(mapProfileToUser) : [];
    },
    async createUser(userData: any): Promise<void> {
        // This is a complex operation that should ideally be a single transaction or an RPC function in Supabase.
        // 1. Create the auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
        });
        if (authError) handleSupabaseError(authError, 'createUser (auth)');
        if (!authData.user) throw new Error("Gagal membuat pengguna otentikasi.");

        // 2. Create the public profile
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            full_name: userData.name,
            identity_number: userData.identityNumber,
            role: userData.role,
            school_id: userData.schoolId || null,
            avatar_url: userData.avatarUrl,
        });

        if (profileError) {
             // Attempt to clean up the auth user if profile creation fails
            await supabase.auth.admin.deleteUser(authData.user.id);
            handleSupabaseError(profileError, 'createUser (profile)');
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
        // Deleting from auth schema requires admin privileges and is best done server-side.
        // For simplicity here, we assume an RPC function `delete_user` exists.
        // If not, we'll just delete the profile.
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) handleSupabaseError(error, 'deleteUser');
        // You would also call `supabase.auth.admin.deleteUser(userId)` on a trusted server.
    },
    async getUserCount(filters: { role: UserRole; schoolId?: string }): Promise<number> {
        let query = supabase.from('profiles').select('id', { count: 'exact', head: true });
        if (filters.role) query = query.eq('role', filters.role);
        if (filters.schoolId) query = query.eq('school_id', filters.schoolId);
        
        const { count, error } = await query;
        if (error) handleSupabaseError(error, 'getUserCount');
        return count || 0;
    },

    // --- School Management ---
    async getSchools(): Promise<School[]> {
        const { data, error } = await supabase.from('schools').select('*');
        if (error) handleSupabaseError(error, 'getSchools');
        return data || [];
    },
    async getSchoolCount(): Promise<number> {
        const { count, error } = await supabase.from('schools').select('id', { count: 'exact', head: true });
        if (error) handleSupabaseError(error, 'getSchoolCount');
        return count || 0;
    },
    async createSchool(schoolData: Omit<School, 'id'>): Promise<void> {
        const { error } = await supabase.from('schools').insert(schoolData);
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

    // --- Subject Management ---
    async getSubjects(filters?: { schoolId?: string }): Promise<Subject[]> {
        let query = supabase.from('subjects').select('*, schools (name)');
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { data, error } = await query;
        if (error) handleSupabaseError(error, 'getSubjects');
        return data ? data.map(s => ({...s, schoolName: s.schools?.name})) : [];
    },
    async createSubject(subjectData: { name: string; schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').insert({ name: subjectData.name, school_id: subjectData.schoolId });
        if (error) handleSupabaseError(error, 'createSubject');
    },
    async updateSubject(subjectId: string, subjectData: { name: string; schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').update({ name: subjectData.name, school_id: subjectData.schoolId }).eq('id', subjectId);
        if (error) handleSupabaseError(error, 'updateSubject');
    },
    async deleteSubject(subjectId: string): Promise<void> {
        const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
        if (error) handleSupabaseError(error, 'deleteSubject');
    },
    
    // --- Class Management ---
    async getClasses(filters?: { teacherId?: string }): Promise<Class[]> {
        let query = supabase.from('classes').select(`
            *,
            schools (name),
            profiles (full_name)
        `);
         if (filters?.teacherId) {
            // This assumes a teacher is only associated as a homeroom teacher. A more complex schema would use a linking table.
            query = query.eq('homeroom_teacher_id', filters.teacherId);
        }
        const { data, error } = await query;
        if (error) handleSupabaseError(error, 'getClasses');
        return data ? data.map(c => ({
            id: c.id,
            name: c.name,
            schoolId: c.school_id,
            homeroomTeacherId: c.homeroom_teacher_id,
            schoolName: c.schools?.name,
            homeroomTeacherName: c.profiles?.full_name,
        })) : [];
    },
    async getStudentsInClass(classId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('class_students')
            .select('profiles(*, schools(name))')
            .eq('class_id', classId);

        if (error) handleSupabaseError(error, 'getStudentsInClass');
        return data ? data.map(item => mapProfileToUser(item.profiles)) : [];
    },
    async createClass(classData: { name: string; schoolId: string; homeroomTeacherId?: string; studentIds: string[] }): Promise<void> {
        const { data, error } = await supabase.from('classes').insert({
            name: classData.name,
            school_id: classData.schoolId,
            homeroom_teacher_id: classData.homeroomTeacherId || null,
        }).select().single();

        if (error) handleSupabaseError(error, 'createClass (insert)');
        if (!data) throw new Error("Gagal membuat kelas baru.");

        if (classData.studentIds && classData.studentIds.length > 0) {
            const studentLinks = classData.studentIds.map(studentId => ({
                class_id: data.id,
                student_id: studentId
            }));
            const { error: studentError } = await supabase.from('class_students').insert(studentLinks);
            if (studentError) handleSupabaseError(studentError, 'createClass (link students)');
        }
    },
    async updateClass(classId: string, classData: { name: string; schoolId: string; homeroomTeacherId?: string; studentIds: string[] }): Promise<void> {
        const { error } = await supabase.from('classes').update({
            name: classData.name,
            school_id: classData.schoolId,
            homeroom_teacher_id: classData.homeroomTeacherId || null,
        }).eq('id', classId);
        if (error) handleSupabaseError(error, 'updateClass (update)');
        
        // Replace all student associations for this class
        const { error: deleteError } = await supabase.from('class_students').delete().eq('class_id', classId);
        if (deleteError) handleSupabaseError(deleteError, 'updateClass (clear students)');

        if (classData.studentIds && classData.studentIds.length > 0) {
            const studentLinks = classData.studentIds.map(studentId => ({
                class_id: classId,
                student_id: studentId
            }));
            const { error: insertError } = await supabase.from('class_students').insert(studentLinks);
            if (insertError) handleSupabaseError(insertError, 'updateClass (re-link students)');
        }
    },
    async deleteClass(classId: string): Promise<void> {
        // Deleting from class_students first, then classes. Or use CASCADE delete in DB.
        const { error: studentError } = await supabase.from('class_students').delete().eq('class_id', classId);
        if (studentError) handleSupabaseError(studentError, 'deleteClass (students)');
        const { error: classError } = await supabase.from('classes').delete().eq('id', classId);
        if (classError) handleSupabaseError(classError, 'deleteClass (class)');
    },
    
    // --- Announcements ---
    async getAnnouncements(): Promise<Announcement[]> {
        const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        if (error) handleSupabaseError(error, 'getAnnouncements');
        return data ? data.map(a => ({
            id: a.id,
            title: a.title,
            content: a.content,
            author: a.author,
            date: new Date(a.created_at).toISOString().split('T')[0]
        })) : [];
    },
    async createAnnouncement(data: { title: string, content: string, author: string }): Promise<void> {
        const { error } = await supabase.from('announcements').insert(data);
        if (error) handleSupabaseError(error, 'createAnnouncement');
    },
    async deleteAnnouncement(id: string): Promise<void> {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteAnnouncement');
    },

    // --- Teaching Journals ---
    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        const { data, error } = await supabase
            .from('teaching_journals')
            .select(`*, classes(name), subjects(name)`)
            .eq('teacher_id', teacherId)
            .order('date', { ascending: false });

        if (error) handleSupabaseError(error, 'getTeachingJournals');
        return data ? data.map(j => ({
            id: j.id,
            teacherId: j.teacher_id,
            classId: j.class_id,
            subjectId: j.subject_id,
            date: j.date,
            topic: j.topic,
            className: j.classes?.name,
            subjectName: j.subjects?.name,
        })) : [];
    },
    async createTeachingJournal(data: any): Promise<void> {
        const { error } = await supabase.from('teaching_journals').insert({
            teacher_id: data.teacherId,
            class_id: data.classId,
            subject_id: data.subjectId,
            date: data.date,
            topic: data.topic
        });
        if (error) handleSupabaseError(error, 'createTeachingJournal');
    },
    async updateTeachingJournal(id: number, data: any): Promise<void> {
        const { error } = await supabase.from('teaching_journals').update({
            class_id: data.classId,
            subject_id: data.subjectId,
            date: data.date,
            topic: data.topic
        }).eq('id', id);
        if (error) handleSupabaseError(error, 'updateTeachingJournal');
    },
    async deleteTeachingJournal(id: number): Promise<void> {
        const { error } = await supabase.from('teaching_journals').delete().eq('id', id);
        if (error) handleSupabaseError(error, 'deleteTeachingJournal');
    },

    // --- MOCKED/PLACEHOLDER FUNCTIONS (Require complex queries or undefined schema) ---
    async getClassForStudent(studentId: string): Promise<string | null> {
         const { data, error } = await supabase.from('class_students').select('classes(name)').eq('student_id', studentId).single();
         if (error || !data) {
             console.error("Error fetching student's class:", error);
             return 'Tidak terdaftar';
         }
         // @ts-ignore
         return data.classes?.name || null;
    },
    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        const journals = await this.getTeachingJournals(teacherId);
        return journals
            .filter(j => j.date === date)
            .map(j => ({
                subject: j.subjectName || 'N/A',
                class: j.className || 'N/A',
                topic: j.topic,
            }));
    },
    async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
        console.warn("getGradesForStudent is using mock data.");
        return [
            { subject: 'Matematika Wajib', score: 85, grade: 'A-' },
            { subject: 'Bahasa Indonesia', score: 90, grade: 'A' },
            { subject: 'Fisika', score: 78, grade: 'B+' },
        ];
    },
    async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> {
        console.warn("getAttendanceForStudent is using mock data.");
        return [
            { date: '2024-07-21', status: 'Hadir' },
            { date: '2024-07-20', status: 'Hadir' },
            { date: '2024-07-19', status: 'Sakit' },
        ];
    },
    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        console.warn("getGamificationProfile is using mock data.");
        return { progress: { 'Matematika Wajib': 88, 'Fisika': 75 }, badges: [{ id: 'bdg2', icon: '🧠', name: 'Ahli Matematika', description: 'Nilai di atas 90 pada Matematika.' }] };
    },
    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string; teacherName: string }> {
        console.warn("getTeacherNoteForStudent is using mock data.");
        return { note: 'Perkembangan sangat baik, pertahankan semangat belajar!', teacherName: 'Siti Aminah, S.Si' };
    },
    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
        console.warn("getSchoolPerformance is using mock data.");
        return [
            { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.5 },
            { school: 'MTS Fathus Salafi', 'Rata-rata Nilai': 82.1 },
        ];
    },
    async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number }[]> {
        console.warn("getAverageGradesBySubject is using mock data.");
        return [
            { subject: 'Matematika', avg: 88 }, { subject: 'B. Indo', avg: 85 },
            { subject: 'Fisika', avg: 79 }, { subject: 'Biologi', avg: 82 },
        ];
    },
    async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number }[]> {
        console.warn("getAttendanceTrend is using mock data.");
        return [
            { month: 'Jan', percentage: 98 }, { month: 'Feb', percentage: 97 },
            { month: 'Mar', percentage: 98.5 }, { month: 'Apr', percentage: 96 },
        ];
    },
    async getClassSchedule(className: string, schoolIdentifier: string): Promise<Record<string, { time: string, subject: string }[]>> {
        console.warn("getClassSchedule is using mock data.");
        return {
            "Senin": [{ time: '07:30 - 09:00', subject: 'Matematika' }, { time: '10:00 - 11:30', subject: 'Bahasa Indonesia' }],
            "Selasa": [{ time: '07:30 - 09:00', subject: 'Fisika' }, { time: '10:00 - 11:30', subject: 'Pendidikan Agama' }],
        };
    }
};

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

const toUserRoleEnum = (dbRole: string): UserRole => {
    const roleKey = Object.keys(UserRole).find(
        (key) => (UserRole as any)[key].toLowerCase() === dbRole?.toLowerCase()
    );
    return roleKey ? (UserRole as any)[key] : dbRole as UserRole;
};

// Mock data where Supabase integration is complex
const mockGrades = [
    { subject: 'Matematika', score: 85, grade: 'A-' },
    { subject: 'Bahasa Indonesia', score: 92, grade: 'A' },
    { subject: 'Fisika', score: 78, grade: 'B+' },
    { subject: 'Kimia', score: 81, grade: 'B+' },
    { subject: 'Sejarah', score: 88, grade: 'A-' },
];

export const dataService = {
    // USERS
    async getUsers(filters: { role?: UserRole, schoolId?: string, teacherId?: string } = {}): Promise<User[]> {
        let query = supabase.from('profiles').select(`
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

        if (error) {
            console.error("Error fetching users:", error);
            throw error;
        }

        return data.map((profile: any) => ({
            id: profile.id,
            email: '', // Not always available
            identityNumber: profile.identity_number,
            name: profile.full_name,
            role: toUserRoleEnum(profile.role),
            avatarUrl: profile.avatar_url,
            schoolId: profile.school_id,
            schoolName: profile.schools?.name,
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
        return count ?? 0;
    },

    async createUser(userData: any): Promise<void> {
        // This is complex because it involves auth and profiles.
        // A real implementation would use an edge function to create auth user and profile transactionally.
        // This is a simplified version for demonstration.
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.name,
                    avatar_url: userData.avatarUrl
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Could not create user");

        const { error: profileError } = await supabase.from('profiles').update({
            full_name: userData.name,
            identity_number: userData.identityNumber,
            role: userData.role.toLowerCase(),
            school_id: userData.schoolId || null,
            avatar_url: userData.avatarUrl,
        }).eq('id', authData.user.id);
        
        if (profileError) {
             console.error("Failed to update profile for new user:", profileError);
             // In a real app, you might want to delete the auth user here
             throw profileError;
        }
    },

    async updateUser(userId: string, userData: any): Promise<void> {
        const { error } = await supabase.from('profiles').update({
            full_name: userData.name,
            identity_number: userData.identityNumber,
            role: userData.role.toLowerCase(),
            school_id: userData.schoolId || null,
        }).eq('id', userId);
        if (error) throw error;
    },

    async deleteUser(userId: string): Promise<void> {
        // Deleting from profiles table only, auth user deletion would be separate (and protected)
        // A real implementation would use an edge function.
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
    },

    // SCHOOLS
    async getSchools(): Promise<School[]> {
        const { data, error } = await supabase.from('schools').select('*');
        if (error) throw error;
        return data as School[];
    },

    async getSchoolCount(): Promise<number> {
        const { count, error } = await supabase.from('schools').select('id', { count: 'exact', head: true });
        if (error) throw error;
        return count ?? 0;
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

    // SUBJECTS
    async getSubjects(filters: { schoolId?: string } = {}): Promise<Subject[]> {
        let query = supabase.from('subjects').select(`
            id,
            name,
            school_id,
            schools (name)
        `);
        if (filters.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map((s: any) => ({
            id: s.id,
            name: s.name,
            schoolId: s.school_id,
            schoolName: s.schools?.name,
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

    // CLASSES
    async getClasses(filters: { teacherId?: string } = {}): Promise<Class[]> {
        let query = supabase.from('classes').select(`
            id,
            name,
            school_id,
            homeroom_teacher_id,
            schools ( name ),
            profiles ( full_name )
        `);
         if (filters.teacherId) {
            query = query.eq('homeroom_teacher_id', filters.teacherId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            schoolId: c.school_id,
            schoolName: c.schools?.name,
            homeroomTeacherId: c.homeroom_teacher_id,
            homeroomTeacherName: c.profiles?.full_name
        }));
    },
    
    async getStudentsInClass(classId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('class_students')
            .select(`profiles ( *, schools(name) )`)
            .eq('class_id', classId);
        if (error) throw error;
        return data.map((item: any) => ({
            id: item.profiles.id,
            email: '',
            identityNumber: item.profiles.identity_number,
            name: item.profiles.full_name,
            role: toUserRoleEnum(item.profiles.role),
            avatarUrl: item.profiles.avatar_url,
            schoolId: item.profiles.school_id,
            schoolName: item.profiles.schools?.name,
        }));
    },

    async createClass(classData: any): Promise<void> {
        const { data, error } = await supabase.from('classes').insert([{
            name: classData.name,
            school_id: classData.schoolId,
            homeroom_teacher_id: classData.homeroomTeacherId || null
        }]).select().single();
        if (error || !data) throw error || new Error("Failed to create class");
        
        const newClassId = data.id;
        if (classData.studentIds?.length > 0) {
            const studentMappings = classData.studentIds.map((studentId: string) => ({
                class_id: newClassId,
                student_id: studentId
            }));
            const { error: studentError } = await supabase.from('class_students').insert(studentMappings);
            if (studentError) throw studentError;
        }
    },

    async updateClass(classId: string, classData: any): Promise<void> {
        const { error } = await supabase.from('classes').update({
            name: classData.name,
            school_id: classData.schoolId,
            homeroom_teacher_id: classData.homeroomTeacherId || null
        }).eq('id', classId);
        if (error) throw error;

        await supabase.from('class_students').delete().eq('class_id', classId);
        if (classData.studentIds?.length > 0) {
            const studentMappings = classData.studentIds.map((studentId: string) => ({
                class_id: classId,
                student_id: studentId
            }));
            const { error: studentError } = await supabase.from('class_students').insert(studentMappings);
            if (studentError) throw studentError;
        }
    },

    async deleteClass(classId: string): Promise<void> {
        await supabase.from('class_students').delete().eq('class_id', classId);
        const { error } = await supabase.from('classes').delete().eq('id', classId);
        if (error) throw error;
    },

    // ANNOUNCEMENTS
    async getAnnouncements(): Promise<Announcement[]> {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('date', { ascending: false });
        if (error) throw error;
        return data;
    },
    
    async createAnnouncement(announcementData: { title: string, content: string, author: string }): Promise<void> {
        const { error } = await supabase.from('announcements').insert([{
            ...announcementData,
            date: new Date().toISOString().split('T')[0]
        }]);
        if (error) throw error;
    },
    
    async deleteAnnouncement(id: string): Promise<void> {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw error;
    },

    // JOURNALS
    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        const { data, error } = await supabase.from('teaching_journals')
            .select(`
                topic,
                classes (name),
                subjects (name)
            `)
            .eq('teacher_id', teacherId)
            .eq('date', date);
            
        if (error) throw error;
        
        return data.map((j: any) => ({
            topic: j.topic,
            class: j.classes.name,
            subject: j.subjects.name
        }));
    },

    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        const { data, error } = await supabase.from('teaching_journals')
            .select(`
                *,
                classes (name),
                subjects (name)
            `)
            .eq('teacher_id', teacherId)
            .order('date', { ascending: false });
        if (error) throw error;
        return data.map((j: any) => ({
            id: j.id,
            teacherId: j.teacher_id,
            classId: j.class_id,
            subjectId: j.subject_id,
            date: j.date,
            topic: j.topic,
            className: j.classes.name,
            subjectName: j.subjects.name
        }));
    },

    async createTeachingJournal(journalData: any): Promise<void> {
        const { error } = await supabase.from('teaching_journals').insert([{
            teacher_id: journalData.teacherId,
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            date: journalData.date,
            topic: journalData.topic,
        }]);
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


    // MOCK DATA
    async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
        await new Promise(res => setTimeout(res, 500));
        return mockGrades;
    },

    async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'; }[]> {
        await new Promise(res => setTimeout(res, 500));
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        
        return Array.from({ length: today.getDate() }, (_, i) => {
            const day = (i + 1).toString().padStart(2, '0');
            const date = `${year}-${month}-${day}`;
            const dayOfWeek = new Date(date).getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) return null; // Skip weekends

            const random = Math.random();
            let status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' = 'Hadir';
            if (random > 0.98) status = 'Alpha';
            else if (random > 0.95) status = 'Sakit';
            else if (random > 0.92) status = 'Izin';
            return { date, status };
        }).filter(Boolean) as { date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'; }[];
    },

    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string, teacherName: string }> {
        return { note: 'Ananda menunjukkan perkembangan yang sangat baik di semester ini, terutama dalam mata pelajaran eksakta. Tetap pertahankan semangat belajarnya!', teacherName: 'Budi Setiawan, S.Pd.' };
    },

    async getClassForStudent(studentId: string): Promise<string | null> {
         const { data, error } = await supabase
            .from('class_students')
            .select(`classes ( name )`)
            .eq('student_id', studentId)
            .single();
        if (error || !data || !data.classes) return 'MA Kelas 10-A'; // Fallback
        return data.classes.name;
    },

    async getClassSchedule(className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
        return {
            'Senin': [{time: '07:30 - 09:00', subject: 'Matematika'}, {time: '10:00 - 11:30', subject: 'Fisika'}],
            'Selasa': [{time: '07:30 - 09:00', subject: 'Bahasa Indonesia'}, {time: '10:00 - 11:30', subject: 'Kimia'}],
            'Rabu': [{time: '07:30 - 09:00', subject: 'Biologi'}, {time: '10:00 - 11:30', subject: 'Sejarah'}],
            'Kamis': [{time: '07:30 - 09:00', subject: 'Pendidikan Agama'}, {time: '10:00 - 11:30', subject: 'Bahasa Inggris'}],
            'Jumat': [{time: '07:30 - 09:00', subject: 'Penjaskes'}, {time: '10:00 - 11:30', subject: 'Seni Budaya'}],
        };
    },
    
    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        return {
            progress: { 'Matematika': 85, 'Fisika': 78, 'Kimia': 81 },
            badges: [
                { id: '1', icon: '🔬', name: 'Sains Master', description: 'Menyelesaikan semua modul Sains' },
                { id: '2', icon: '🧮', name: 'Raja Angka', description: 'Nilai Matematika di atas 80' }
            ]
        };
    },

    // MOCK DATA FOR AGGREGATE REPORTS
    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
        return [
            { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.5 },
            { school: 'MTS Fathus Salafi', 'Rata-rata Nilai': 82.1 },
            { school: 'MI Fathus Salafi', 'Rata-rata Nilai': 88.4 },
        ];
    },

    async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number; }[]> {
         return [
            { subject: 'Matematika', avg: 82 },
            { subject: 'Fisika', avg: 79 },
            { subject: 'Kimia', avg: 81 },
            { subject: 'Biologi', avg: 85 },
            { subject: 'B. Indo', avg: 88 },
            { subject: 'B. Ing', avg: 84 },
        ];
    },

    async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number; }[]> {
        return [
            { month: 'Jan', percentage: 98 },
            { month: 'Feb', percentage: 97 },
            { month: 'Mar', percentage: 98 },
            { month: 'Apr', percentage: 96 },
            { month: 'Mei', percentage: 97 },
            { month: 'Jun', percentage: 99 },
        ];
    },
};

import { supabase } from './supabaseClient';
import { User, School, Subject, Class, Announcement, UserRole, GamificationProfile, JournalEntry, TeachingJournal } from '../types';

// Helper to safely convert DB role to Enum value
// FIX: Refactored to use Object.entries for improved type safety and to resolve a potential linting/compilation issue.
const toUserRoleEnum = (dbRole: string): UserRole => {
    const roleEntry = Object.entries(UserRole).find(
        ([, value]) => value.toLowerCase() === dbRole?.toLowerCase()
    );
    return roleEntry ? roleEntry[1] : dbRole as UserRole;
};

export const dataService = {

    // School methods
    async getSchools(): Promise<School[]> {
        const { data, error } = await supabase.from('schools').select('*').order('name');
        if (error) throw error;
        return data as School[];
    },

    async getSchoolCount(): Promise<number> {
        const { count, error } = await supabase.from('schools').select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count || 0;
    },

    async createSchool(schoolData: Omit<School, 'id'>): Promise<void> {
        const { error } = await supabase.from('schools').insert([schoolData]);
        if (error) throw error;
    },

    async updateSchool(id: string, schoolData: Partial<Omit<School, 'id'>>): Promise<void> {
        const { error } = await supabase.from('schools').update(schoolData).eq('id', id);
        if (error) throw error;
    },

    async deleteSchool(id: string): Promise<void> {
        const { error } = await supabase.from('schools').delete().eq('id', id);
        if (error) throw error;
    },

    // User methods
    async getUsers(filters: { role?: UserRole; schoolId?: string } = {}): Promise<User[]> {
        let query = supabase.from('profiles').select(`
            id,
            identity_number,
            full_name,
            email,
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

        const { data, error } = await query.order('full_name');
        if (error) throw error;

        return data.map((profile: any) => ({
            id: profile.id,
            identityNumber: profile.identity_number,
            name: profile.full_name,
            email: profile.email,
            role: toUserRoleEnum(profile.role),
            avatarUrl: profile.avatar_url,
            schoolId: profile.school_id,
            schoolName: profile.schools?.name,
        }));
    },
    
    async getUserCount(filters: { role: UserRole; schoolId: string }): Promise<number> {
         const { count, error } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', filters.role.toLowerCase())
            .eq('school_id', filters.schoolId);
        if (error) throw error;
        return count || 0;
    },
    
    async createUser(userData: any): Promise<void> {
        // Assumes a Supabase RPC function for creating user and profile securely
        const { error } = await supabase.rpc('create_new_user', {
            p_email: userData.email,
            p_password: userData.password,
            p_identity_number: userData.identityNumber,
            p_full_name: userData.name,
            p_role: userData.role.toLowerCase(),
            p_school_id: userData.schoolId || null,
            p_avatar_url: userData.avatarUrl,
        });
        if (error) throw error;
    },

    async updateUser(id: string, userData: any): Promise<void> {
         const profileData = {
            full_name: userData.name,
            identity_number: userData.identityNumber,
            role: userData.role.toLowerCase(),
            school_id: userData.schoolId,
            avatar_url: userData.avatarUrl,
        };
        const { error } = await supabase.from('profiles').update(profileData).eq('id', id);
        if (error) throw error;
    },

    async deleteUser(id: string): Promise<void> {
        // Assumes a Supabase RPC function for deleting user from auth and profiles
        const { error } = await supabase.rpc('delete_user_and_profile', { p_user_id: id });
        if (error) throw error;
    },
    
    // Subject methods
    async getSubjects(filters: { schoolId?: string } = {}): Promise<Subject[]> {
        let query = supabase.from('subjects').select('*, schools (name)').order('name');
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

    async updateSubject(id: string, subjectData: { name: string, schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').update({ name: subjectData.name, school_id: subjectData.schoolId }).eq('id', id);
        if (error) throw error;
    },

    async deleteSubject(id: string): Promise<void> {
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) throw error;
    },

    // Class methods
    async getClasses(filters: { teacherId?: string } = {}): Promise<Class[]> {
        if (filters.teacherId) {
             const { data, error } = await supabase.rpc('get_teacher_classes', { p_teacher_id: filters.teacherId });
             if (error) throw error;
             return data.map((c: any) => ({
                 id: c.id,
                 name: c.name,
                 schoolId: c.school_id,
                 homeroomTeacherId: c.homeroom_teacher_id,
                 homeroomTeacherName: c.homeroom_teacher_name
             }));
        }

        const { data, error } = await supabase.rpc('get_all_classes_with_details');
        if (error) throw error;
        return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            schoolId: c.school_id,
            schoolName: c.school_name,
            homeroomTeacherId: c.homeroom_teacher_id,
            homeroomTeacherName: c.homeroom_teacher_name,
        }));
    },
    
    async getStudentsInClass(classId: string): Promise<User[]> {
        const { data, error } = await supabase.rpc('get_students_in_class', { p_class_id: classId });
        if (error) throw error;
        return data.map((profile: any) => ({
            id: profile.id,
            identityNumber: profile.identity_number,
            name: profile.full_name,
            email: profile.email,
            role: toUserRoleEnum(profile.role),
            avatarUrl: profile.avatar_url,
            schoolId: profile.school_id,
            schoolName: profile.school_name,
        }));
    },
    
    async createClass(classData: any): Promise<void> {
        const { error } = await supabase.rpc('create_class_with_students', {
            p_name: classData.name,
            p_school_id: classData.schoolId,
            p_homeroom_teacher_id: classData.homeroomTeacherId || null,
            p_student_ids: classData.studentIds || [],
        });
        if (error) throw error;
    },

    async updateClass(id: string, classData: any): Promise<void> {
        const { error } = await supabase.rpc('update_class_with_students', {
            p_class_id: id,
            p_name: classData.name,
            p_school_id: classData.schoolId,
            p_homeroom_teacher_id: classData.homeroomTeacherId || null,
            p_student_ids: classData.studentIds || [],
        });
        if (error) throw error;
    },

    async deleteClass(id: string): Promise<void> {
        const { error } = await supabase.rpc('delete_class', { p_class_id: id });
        if (error) throw error;
    },

    // Announcements
    async getAnnouncements(): Promise<Announcement[]> {
        const { data, error } = await supabase.from('announcements').select('*').order('date', { ascending: false });
        if (error) throw error;
        return data as Announcement[];
    },

    async createAnnouncement(announcementData: { title: string, content: string, author: string }): Promise<void> {
        const payload = {
            ...announcementData,
            date: new Date().toISOString().split('T')[0],
        };
        const { error } = await supabase.from('announcements').insert([payload]);
        if (error) throw error;
    },

    async deleteAnnouncement(id: string): Promise<void> {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw error;
    },
    
    async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
        return Promise.resolve([
            { subject: 'Matematika Wajib', score: 88, grade: 'A-' },
            { subject: 'Bahasa Indonesia', score: 92, grade: 'A' },
            { subject: 'Fisika', score: 78, grade: 'B+' },
            { subject: 'Kimia', score: 81, grade: 'B+' },
            { subject: 'Sejarah Indonesia', score: 75, grade: 'B' },
            { subject: 'Bahasa Inggris', score: 95, grade: 'A' },
        ]);
    },
    
    async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> {
        const MOCKED_ATTENDANCE: { date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[] = [];
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-indexed
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            const day = new Date(year, month, i).getDay();
            if (day === 0 || day === 6) continue; // Skip weekends
            
            const random = Math.random();
            let status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' = 'Hadir';
            if (random > 0.95) status = 'Sakit';
            else if (random > 0.93) status = 'Izin';
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            if (new Date(dateStr) < today) {
                MOCKED_ATTENDANCE.push({ date: dateStr, status });
            }
        }
        return Promise.resolve(MOCKED_ATTENDANCE);
    },

    async getClassForStudent(studentId: string): Promise<string | null> {
         const { data, error } = await supabase.rpc('get_student_class_name', { p_student_id: studentId }).single();
        if (error) {
            console.error("Failed to get student class name:", error.message);
            return 'Belum terdaftar';
        }
        return data || 'Belum terdaftar';
    },

    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string, teacherName: string }> {
        return Promise.resolve({
            note: 'Ananda menunjukkan perkembangan yang sangat baik di semester ini, terutama dalam mata pelajaran sains. Perlu lebih meningkatkan partisipasi aktif di kelas sosial.',
            teacherName: 'Budi Setiawan, S.Pd.'
        });
    },

    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        if (date === new Date().toISOString().split('T')[0]) {
            return Promise.resolve([
                { subject: 'Matematika', class: 'MA Kelas 10-A', topic: 'Fungsi Kuadrat' },
                { subject: 'Matematika', class: 'MA Kelas 10-B', topic: 'Persamaan Linear' },
            ]);
        }
        return Promise.resolve([]);
    },

    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        return Promise.resolve({
            progress: {
                'Matematika': 88,
                'Fisika': 75,
                'Bahasa Inggris': 95,
            },
            badges: [
                { id: '1', icon: '🏆', name: 'Raja Kuis', description: 'Menyelesaikan semua kuis Matematika' },
                { id: '2', icon: '🚀', name: 'Penjelajah Sains', description: 'Menguasai 5 topik Fisika' },
            ]
        });
    },
    
    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
        return Promise.resolve([
            { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.5 },
            { school: 'MTS Fathus Salafi', 'Rata-rata Nilai': 82.1 },
            { school: 'SD Fathus Salafi', 'Rata-rata Nilai': 88.3 },
        ]);
    },
    
    async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number; }[]> {
        return Promise.resolve([
            { subject: 'Matematika', avg: 82 },
            { subject: 'Fisika', avg: 78 },
            { subject: 'Kimia', avg: 79 },
            { subject: 'Biologi', avg: 85 },
            { subject: 'B. Indo', avg: 88 },
            { subject: 'B. Ing', avg: 91 },
        ]);
    },
    
    async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number; }[]> {
         return Promise.resolve([
            { month: 'Jan', percentage: 98.5 },
            { month: 'Feb', percentage: 97.2 },
            { month: 'Mar', percentage: 98.1 },
            { month: 'Apr', percentage: 96.5 },
            { month: 'Mei', percentage: 97.8 },
            { month: 'Jun', percentage: 99.1 },
        ]);
    },

    async getClassSchedule(className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
        return Promise.resolve({
            'Senin': [{ time: '07:30 - 09:00', subject: 'Matematika' }, { time: '09:15 - 10:45', subject: 'Bahasa Indonesia' }, { time: '11:00 - 12:30', subject: 'Fisika' }],
            'Selasa': [{ time: '07:30 - 09:00', subject: 'Kimia' }, { time: '09:15 - 10:45', subject: 'Bahasa Inggris' }, { time: '11:00 - 12:30', subject: 'Sejarah' }],
            'Rabu': [{ time: '07:30 - 09:00', subject: 'Biologi' }, { time: '09:15 - 10:45', subject: 'Pendidikan Agama' }, { time: '11:00 - 12:30', subject: 'Matematika' }],
            'Kamis': [{ time: '07:30 - 09:00', subject: 'Bahasa Indonesia' }, { time: '09:15 - 10:45', subject: 'Fisika' }, { time: '11:00 - 12:30', subject: 'PJOK' }],
            'Jumat': [{ time: '07:30 - 09:00', subject: 'Seni Budaya' }, { time: '09:15 - 10:45', subject: 'Bahasa Inggris' }],
        });
    },

    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        const { data, error } = await supabase.rpc('get_teaching_journals_for_teacher', { p_teacher_id: teacherId });
        if (error) throw error;
        return data.map((j: any) => ({
            id: j.id,
            teacherId: j.teacher_id,
            classId: j.class_id,
            subjectId: j.subject_id,
            date: j.date,
            topic: j.topic,
            className: j.class_name,
            subjectName: j.subject_name,
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

    async updateTeachingJournal(id: number, journalData: any): Promise<void> {
        const { error } = await supabase.from('teaching_journals').update({
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            date: journalData.date,
            topic: journalData.topic,
        }).eq('id', id);
        if (error) throw error;
    },

    async deleteTeachingJournal(id: number): Promise<void> {
        const { error } = await supabase.from('teaching_journals').delete().eq('id', id);
        if (error) throw error;
    },
};

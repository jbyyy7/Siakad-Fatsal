
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
    Class,
    Badge,
} from '../types';

// Helper to convert DB user to App User
const fromDbToUser = (profile: any): User => ({
    id: profile.id,
    email: profile.email || '', // Email might not be in profiles table
    identityNumber: profile.identity_number,
    name: profile.full_name,
    // FIX: Map lowercase db role to capitalized enum value
    role: (Object.values(UserRole).find(role => role.toLowerCase() === profile.role) || profile.role) as UserRole,
    avatarUrl: profile.avatar_url,
    schoolId: profile.school_id,
    schoolName: profile.schools?.name,
});


export const dataService = {
    // USER MANAGEMENT
    async getUsers(filters?: { role?: UserRole; schoolId?: string }): Promise<User[]> {
        let query = supabase.from('profiles').select(`
            id,
            identity_number,
            full_name,
            role,
            avatar_url,
            school_id,
            schools ( name )
        `);

        if (filters?.role) {
            query = query.eq('role', filters.role.toLowerCase());
        }
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        return data.map(fromDbToUser);
    },

    async getUserCount(filters: { role: UserRole; schoolId: string }): Promise<number> {
         const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', filters.role.toLowerCase())
            .eq('school_id', filters.schoolId);

        if (error) {
            console.error('Error counting users:', error);
            throw error;
        }
        return count ?? 0;
    },

    async createUser(userData: any): Promise<void> {
        // This is complex because it involves auth.users and profiles.
        // For now, a simplified version.
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.name,
                    avatar_url: userData.avatarUrl,
                }
            }
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed in auth");

        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            full_name: userData.name,
            identity_number: userData.identityNumber,
            role: userData.role.toLowerCase(),
            school_id: userData.schoolId || null,
            avatar_url: userData.avatarUrl,
        });

        if (profileError) {
            // Cleanup auth user if profile fails
            // await supabase.auth.admin.deleteUser(authData.user.id); // Requires admin privileges
            console.error('Error creating profile:', profileError);
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
        // This is also complex. Deleting from profiles first.
        // In a real app, you'd need an admin client to delete from auth.users.
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
    },
    
    // SCHOOL MANAGEMENT
    async getSchools(): Promise<School[]> {
        const { data, error } = await supabase.from('schools').select('*');
        if (error) throw error;
        return data;
    },
    
    async getSchoolCount(): Promise<number> {
        const { count, error } = await supabase.from('schools').select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count ?? 0;
    },

    async createSchool(schoolData: Omit<School, 'id'>): Promise<void> {
        const { error } = await supabase.from('schools').insert(schoolData);
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

    // SUBJECT MANAGEMENT
    async getSubjects(filters?: { schoolId?: string }): Promise<Subject[]> {
        let query = supabase.from('subjects').select(`*, schools ( name )`);
        if(filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map(s => ({ ...s, schoolName: s.schools?.name, schoolId: s.school_id }));
    },
    
    async createSubject(subjectData: { name: string, schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').insert({ name: subjectData.name, school_id: subjectData.schoolId });
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

    // CLASS MANAGEMENT
    async getClasses(filters?: { teacherId?: string }): Promise<Class[]> {
        // This is tricky. Let's assume homeroom teacher is the filter.
         let query = supabase.from('classes').select(`
            *,
            profiles ( full_name )
         `);

        if (filters?.teacherId) {
            query = query.eq('homeroom_teacher_id', filters.teacherId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data.map(c => ({...c, homeroomTeacherId: c.homeroom_teacher_id, schoolId: c.school_id, homeroomTeacherName: c.profiles?.full_name }));
    },

    async getStudentsInClass(classId: string): Promise<User[]> {
        // Assumes a junction table `student_classes`
        const { data, error } = await supabase
            .from('student_classes')
            .select('profiles (*, schools(name))')
            .eq('class_id', classId);

        if (error) throw error;
        return data.map(item => fromDbToUser(item.profiles));
    },

     async createClass(classData: any): Promise<void> {
        const { studentIds, ...rest } = classData;
        const { data, error } = await supabase.from('classes').insert({
            name: rest.name,
            school_id: rest.schoolId,
            homeroom_teacher_id: rest.homeroomTeacherId || null,
        }).select().single();

        if (error) throw error;
        
        if (studentIds && studentIds.length > 0) {
            const studentClassRelations = studentIds.map((studentId: string) => ({
                class_id: data.id,
                student_id: studentId
            }));
            const { error: junctionError } = await supabase.from('student_classes').insert(studentClassRelations);
            if (junctionError) throw junctionError;
        }
    },

    async updateClass(classId: string, classData: any): Promise<void> {
        const { studentIds, ...rest } = classData;

        const { error } = await supabase.from('classes').update({
            name: rest.name,
            school_id: rest.schoolId,
            homeroom_teacher_id: rest.homeroomTeacherId || null,
        }).eq('id', classId);
        if (error) throw error;

        // Sync students
        const { error: deleteError } = await supabase.from('student_classes').delete().eq('class_id', classId);
        if(deleteError) throw deleteError;
        
        if (studentIds && studentIds.length > 0) {
            const studentClassRelations = studentIds.map((studentId: string) => ({
                class_id: classId,
                student_id: studentId
            }));
            const { error: insertError } = await supabase.from('student_classes').insert(studentClassRelations);
            if (insertError) throw insertError;
        }
    },

    async deleteClass(classId: string): Promise<void> {
        // Also need to delete from junction table
        await supabase.from('student_classes').delete().eq('class_id', classId);
        const { error } = await supabase.from('classes').delete().eq('id', classId);
        if(error) throw error;
    },

    // STUDENT DATA
    async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
        // Mocking this as it can be complex
        await new Promise(res => setTimeout(res, 500));
        return [
            { subject: 'Matematika', score: 85, grade: 'A-' },
            { subject: 'Bahasa Indonesia', score: 92, grade: 'A' },
            { subject: 'Fisika', score: 78, grade: 'B+' },
            { subject: 'Kimia', score: 88, grade: 'A-' },
        ];
    },
    
    async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> {
        await new Promise(res => setTimeout(res, 500));
         return [
            { date: '2024-07-01', status: 'Hadir' },
            { date: '2024-07-02', status: 'Hadir' },
            { date: '2024-07-03', status: 'Sakit' },
            { date: '2024-07-04', status: 'Hadir' },
            { date: '2024-07-05', status: 'Hadir' },
         ];
    },

    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string; teacherName: string; }> {
        await new Promise(res => setTimeout(res, 300));
        return { note: 'Ahmad menunjukkan perkembangan yang sangat baik di semester ini, terutama dalam mata pelajaran Sains. Terus tingkatkan semangat belajarnya!', teacherName: 'Budi Santoso, S.Pd.' };
    },

    async getClassForStudent(studentId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('student_classes')
            .select('classes(name)')
            .eq('student_id', studentId)
            .single();
        if (error || !data) return null;
        return data.classes?.name || null;
    },

    // TEACHER DATA
    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        const { data, error } = await supabase
            .from('teaching_journals')
            .select('topic, classes(name), subjects(name)')
            .eq('teacher_id', teacherId)
            .eq('date', date);

        if (error) throw error;
        return data.map(j => ({
            topic: j.topic,
            class: j.classes.name,
            subject: j.subjects.name,
        }));
    },
    
    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        const { data, error } = await supabase
            .from('teaching_journals')
            .select('*, classes(name), subjects(name)')
            .eq('teacher_id', teacherId);
        
        if (error) throw error;
        
        return data.map(j => ({
            id: j.id,
            teacherId: j.teacher_id,
            classId: j.class_id,
            subjectId: j.subject_id,
            date: j.date,
            topic: j.topic,
            className: j.classes?.name,
            subjectName: j.subjects?.name,
        }));
    },

    async createTeachingJournal(journalData: any): Promise<void> {
        const { error } = await supabase.from('teaching_journals').insert({
            date: journalData.date,
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            topic: journalData.topic,
            teacher_id: journalData.teacherId,
        });
        if (error) throw error;
    },

    async updateTeachingJournal(journalId: number, journalData: any): Promise<void> {
         const { error } = await supabase.from('teaching_journals').update({
            date: journalData.date,
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            topic: journalData.topic,
         }).eq('id', journalId);
        if (error) throw error;
    },
    
    async deleteTeachingJournal(journalId: number): Promise<void> {
        const { error } = await supabase.from('teaching_journals').delete().eq('id', journalId);
        if (error) throw error;
    },

    // OTHERS
    async getAnnouncements(): Promise<Announcement[]> {
        const { data, error } = await supabase.from('announcements').select('*').order('date', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createAnnouncement(announcementData: { title: string, content: string, author: string }): Promise<void> {
        const { error } = await supabase.from('announcements').insert({
            ...announcementData,
            date: new Date().toISOString().split('T')[0],
        });
        if (error) throw error;
    },

    async deleteAnnouncement(id: string): Promise<void> {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw error;
    },

    async getClassSchedule(className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
        // Mocking
        await new Promise(res => setTimeout(res, 500));
        return {
            "Senin": [{ time: "07:30 - 09:00", subject: "Matematika" }, { time: "10:00 - 11:30", subject: "Bahasa Indonesia" }],
            "Selasa": [{ time: "07:30 - 09:00", subject: "Fisika" }, { time: "10:00 - 11:30", subject: "Kimia" }],
            "Rabu": [{ time: "07:30 - 09:00", subject: "Biologi" }, { time: "10:00 - 11:30", subject: "Sejarah" }],
            "Kamis": [{ time: "07:30 - 09:00", subject: "Geografi" }, { time: "10:00 - 11:30", subject: "Pendidikan Agama" }],
            "Jumat": [{ time: "07:30 - 09:00", subject: "Olahraga" }, { time: "10:00 - 11:30", subject: "Seni Budaya" }],
        };
    },

    async getSchoolPerformance(): Promise<{ school: string; 'Rata-rata Nilai': number; }[]> {
        // Mocking
        await new Promise(res => setTimeout(res, 800));
        return [
            { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.2 },
            { school: 'MTs Fathus Salafi', 'Rata-rata Nilai': 82.1 },
            { school: 'MI Fathus Salafi', 'Rata-rata Nilai': 88.4 },
        ];
    },

    async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number; }[]> {
        await new Promise(res => setTimeout(res, 600));
        return [
            { subject: 'Matematika', avg: 82 },
            { subject: 'Fisika', avg: 78 },
            { subject: 'Kimia', avg: 85 },
            { subject: 'Biologi', avg: 88 },
            { subject: 'B. Indo', avg: 90 },
        ];
    },

    async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number; }[]> {
        await new Promise(res => setTimeout(res, 600));
        return [
            { month: 'Jan', percentage: 98 },
            { month: 'Feb', percentage: 97 },
            { month: 'Mar', percentage: 98.5 },
            { month: 'Apr', percentage: 96 },
            { month: 'Mei', percentage: 97.5 },
        ];
    },

    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        await new Promise(res => setTimeout(res, 400));
        const badges: Badge[] = [
            { id: '1', icon: '🚀', name: 'Pejuang Pagi', description: 'Hadir tepat waktu 10 kali berturut-turut' },
            { id: '2', icon: '🧠', name: 'Master Matematika', description: 'Mendapat nilai A di 3 ujian Matematika' },
        ];
        return {
            progress: {
                'Matematika': 85,
                'Fisika': 70,
                'Kimia': 80,
            },
            badges,
        };
    },
};

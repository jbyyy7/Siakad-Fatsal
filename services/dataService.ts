import { supabase } from './supabaseClient';
import { 
    User, 
    UserRole, 
    School, 
    Announcement, 
    JournalEntry, 
    Class, 
    Subject, 
    AttendanceRecord, 
    AttendanceStatus,
    GamificationProfile,
    TeachingJournal,
    NotificationSettings,
    Badge
} from '../types';

// Helper function to map database role string (e.g., 'murid') to the app's UserRole enum (e.g., 'Murid')
const toUserRoleEnum = (dbRole: any): UserRole => {
    const roleEntry = Object.entries(UserRole).find(
        ([, value]) => value.toLowerCase() === dbRole?.toLowerCase()
    );
    return roleEntry ? roleEntry[1] : dbRole as UserRole;
};

// Helper function to map a profile from Supabase to a User object
const mapProfileToUser = (profile: any, schoolName?: string): User => ({
    id: profile.id,
    email: profile.email || 'no-email@example.com', // Email might not be in profiles table
    identityNumber: profile.identity_number,
    name: profile.full_name,
    role: toUserRoleEnum(profile.role),
    avatarUrl: profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`,
    schoolId: profile.school_id,
    schoolName: schoolName || profile.schools?.name,
});

export const dataService = {
    // School related functions
    async getSchools(): Promise<School[]> {
        const { data, error } = await supabase.from('schools').select('*');
        if (error) throw error;
        return data || [];
    },
    async getSchoolCount(): Promise<number> {
        const { count, error } = await supabase.from('schools').select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count || 0;
    },
    async createSchool(schoolData: Omit<School, 'id'>): Promise<School> {
        const { data, error } = await supabase.from('schools').insert(schoolData).select().single();
        if (error) throw error;
        return data;
    },
    async updateSchool(id: string, schoolData: Partial<School>): Promise<School> {
        const { data, error } = await supabase.from('schools').update(schoolData).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },
    async deleteSchool(id: string): Promise<void> {
        const { error } = await supabase.from('schools').delete().eq('id', id);
        if (error) throw error;
    },
    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
        // This is complex, will return mock data for now
        console.warn("getSchoolPerformance is returning mock data.");
        return [
            { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.5 },
            { school: 'MTs Fathus Salafi', 'Rata-rata Nilai': 82.1 },
            { school: 'MI Fathus Salafi', 'Rata-rata Nilai': 88.9 },
        ];
    },


    // User related functions
    async getUsers(filters?: { role?: UserRole; schoolId?: string }): Promise<User[]> {
        let query = supabase.from('profiles').select(`
            *,
            schools ( name )
        `);
        if (filters?.role) {
            query = query.eq('role', filters.role.toLowerCase());
        }
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { data: profiles, error } = await query;
        if (error) throw error;
        return profiles?.map(p => mapProfileToUser(p)) || [];
    },
    async getUserCount(filters: { role: UserRole; schoolId: string }): Promise<number> {
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', filters.role.toLowerCase())
            .eq('school_id', filters.schoolId);
        if (error) throw error;
        return count || 0;
    },
    async createUser(userData: any): Promise<User> {
        // This is a complex operation involving auth.users and profiles table,
        // often best handled by a server-side function.
        console.warn("createUser is a complex operation and is mocked on the client-side. This should be a server-side function.");
        
        // 1. Create user in auth.users
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed in auth.");

        // 2. Create profile in profiles
        const profileData = {
            id: authData.user.id,
            full_name: userData.name,
            identity_number: userData.identityNumber,
            role: (userData.role as string).toLowerCase(),
            school_id: userData.schoolId || null,
            avatar_url: userData.avatarUrl,
        };

        const { data: profile, error: profileError } = await supabase.from('profiles').insert(profileData).select().single();
        if (profileError) {
             // Rollback auth user if profile creation fails
            // This requires admin privileges
            console.error("Failed to create profile, user in auth schema might be orphaned.", profileError);
            throw profileError;
        }

        return mapProfileToUser(profile);
    },
    async updateUser(id: string, userData: Partial<User>): Promise<User> {
         const profileUpdate: { [key: string]: any } = {
            full_name: userData.name,
            identity_number: userData.identityNumber,
            role: userData.role ? (userData.role as string).toLowerCase() : undefined,
            school_id: userData.schoolId,
            avatar_url: userData.avatarUrl,
        };
        // remove undefined keys
        Object.keys(profileUpdate).forEach(key => profileUpdate[key] === undefined && delete profileUpdate[key]);

        const { data, error } = await supabase.from('profiles').update(profileUpdate).eq('id', id).select().single();
        if (error) throw error;
        return mapProfileToUser(data);
    },
    async deleteUser(id: string): Promise<void> {
        // Deleting a user requires admin privileges and should be handled server-side.
        // It involves deleting from `auth.users` and `public.profiles`.
        console.warn("deleteUser requires admin privileges and is mocked here. This should be a server-side function.");
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
        // The auth user is now orphaned. A real implementation needs an edge function.
    },


    // Class related functions
    async getClasses(filters?: { teacherId?: string; schoolId?: string }): Promise<Class[]> {
        let query = supabase.from('classes').select(`
            *,
            teacher:profiles ( full_name )
        `);
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        if (filters?.teacherId) {
            // Need a join table for this, e.g. `class_teachers`
            console.warn("getClasses by teacherId is not fully implemented and may return all classes.");
        }
        
        const { data, error } = await query;
        if (error) throw error;

        return data?.map((c: any) => ({
            id: c.id,
            name: c.name,
            schoolId: c.school_id,
            homeroomTeacherId: c.homeroom_teacher_id,
            homeroomTeacherName: c.teacher?.full_name,
        })) || [];
    },
    async createClass(classData: any): Promise<void> {
        const { name, schoolId, homeroomTeacherId, studentIds } = classData;
        const { data: newClass, error } = await supabase.from('classes').insert({
            name,
            school_id: schoolId,
            homeroom_teacher_id: homeroomTeacherId || null,
        }).select().single();

        if (error) throw error;

        if (studentIds && studentIds.length > 0) {
            const studentClassEntries = studentIds.map((student_id: string) => ({
                class_id: newClass.id,
                student_id,
            }));
            const { error: studentError } = await supabase.from('student_classes').insert(studentClassEntries);
            if (studentError) throw studentError;
        }
    },
    async updateClass(id: string, classData: any): Promise<void> {
        const { name, schoolId, homeroomTeacherId, studentIds } = classData;
        const { error } = await supabase.from('classes').update({
            name,
            school_id: schoolId,
            homeroom_teacher_id: homeroomTeacherId || null,
        }).eq('id', id);
        
        if (error) throw error;
        
        // Handle student associations
        // 1. Remove all existing students from this class
        const { error: deleteError } = await supabase.from('student_classes').delete().eq('class_id', id);
        if (deleteError) throw deleteError;

        // 2. Add new students
        if (studentIds && studentIds.length > 0) {
            const studentClassEntries = studentIds.map((student_id: string) => ({
                class_id: id,
                student_id,
            }));
            const { error: insertError } = await supabase.from('student_classes').insert(studentClassEntries);
            if (insertError) throw insertError;
        }
    },
    async deleteClass(id: string): Promise<void> {
        // Also need to delete from student_classes (or set FK to on-delete cascade)
        const { error: studentClassError } = await supabase.from('student_classes').delete().eq('class_id', id);
        if (studentClassError) throw studentClassError;
        
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) throw error;
    },
    async getStudentsInClass(classId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('student_classes')
            .select(`
                profiles (
                    *,
                    schools (name)
                )
            `)
            .eq('class_id', classId);

        if (error) throw error;
        return data?.map((item: any) => mapProfileToUser(item.profiles)) || [];
    },
    async getClassForStudent(studentId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('student_classes')
            .select(`
                classes ( name )
            `)
            .eq('student_id', studentId)
            .limit(1)
            .single();

        if (error || !data) {
            console.error("Error fetching class for student", error);
            return null;
        }
        return data.classes?.name || null;
    },

    
    // Subject related functions
    async getSubjects(filters?: { schoolId?: string }): Promise<Subject[]> {
        let query = supabase.from('subjects').select('*');
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data?.map((d: any) => ({...d, schoolId: d.school_id})) || [];
    },
    async createSubject(subjectData: { name: string, schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').insert({ name: subjectData.name, school_id: subjectData.schoolId });
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
    
    
    // Announcement functions
    async getAnnouncements(): Promise<Announcement[]> {
        // Mock data for announcements
        return [
            { id: '1', title: 'Rapat Yayasan Bulanan', content: 'Rapat akan diadakan pada tanggal 30.', author: 'Kepala Yayasan', date: '2024-07-25' },
            { id: '2', title: 'Libur Idul Adha', content: 'Sekolah akan libur untuk perayaan Idul Adha.', author: 'Admin', date: '2024-07-15' },
        ];
    },


    // Student specific data
    async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
        // Mock data
        console.warn("getGradesForStudent is returning mock data.");
        return [
            { subject: 'Matematika', score: 85, grade: 'A-' },
            { subject: 'Bahasa Indonesia', score: 92, grade: 'A' },
            { subject: 'Fisika', score: 78, grade: 'B+' },
            { subject: 'Sejarah', score: 88, grade: 'A-' },
        ];
    },
    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string, teacherName: string }> {
         // Mock data
         return { note: 'Ahmad menunjukkan perkembangan yang sangat baik di semester ini, terutama dalam mata pelajaran eksak. Perlu lebih aktif dalam diskusi kelas.', teacherName: 'Budi Santoso, S.Pd.' };
    },
    async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: AttendanceStatus }[]> {
        // Mock data for a few days in the current month
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        return [
            { date: `${year}-${month}-01`, status: 'Hadir' },
            { date: `${year}-${month}-02`, status: 'Hadir' },
            { date: `${year}-${month}-03`, status: 'Sakit' },
            { date: `${year}-${month}-04`, status: 'Hadir' },
            { date: `${year}-${month}-05`, status: 'Hadir' },
        ];
    },
    async getClassSchedule(className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
        // Mock data
        return {
            "Senin": [
                { time: "07:30 - 09:00", subject: "Matematika" },
                { time: "09:15 - 10:45", subject: "Bahasa Indonesia" },
            ],
            "Selasa": [
                { time: "07:30 - 09:00", subject: "Fisika" },
                { time: "09:15 - 10:45", subject: "Sejarah" },
            ]
        };
    },
    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        // Mock data
        return {
            studentId,
            progress: {
                'Matematika': 82,
                'Fisika': 75,
                'Bahasa Indonesia': 91,
            },
            badges: [
                { id: '1', icon: '🏆', description: 'Juara Kelas' },
                { id: '2', icon: '💯', description: 'Nilai Sempurna Matematika' },
            ]
        }
    },


    // Teacher specific data
    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        const { data, error } = await supabase
            .from('teaching_journals')
            .select(`
                topic,
                classes ( name ),
                subjects ( name )
            `)
            .eq('teacher_id', teacherId)
            .eq('date', date);
        if (error) throw error;

        return data?.map((item: any) => ({
            subject: item.subjects?.name || 'N/A',
            class: item.classes?.name || 'N/A',
            topic: item.topic
        })) || [];
    },
    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        const { data, error } = await supabase
            .from('teaching_journals')
            .select(`
                *,
                className:classes ( name ),
                subjectName:subjects ( name )
            `)
            .eq('teacher_id', teacherId);
        
        if (error) throw error;

        return data?.map((j: any) => ({
            id: j.id,
            date: j.date,
            teacherId: j.teacher_id,
            classId: j.class_id,
            subjectId: j.subject_id,
            topic: j.topic,
            className: j.className?.name,
            subjectName: j.subjectName?.name
        })) || [];
    },
    async createTeachingJournal(journalData: any): Promise<void> {
        const { error } = await supabase.from('teaching_journals').insert({
            date: journalData.date,
            teacher_id: journalData.teacherId,
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            topic: journalData.topic,
        });
        if (error) throw error;
    },
    async updateTeachingJournal(id: number, journalData: any): Promise<void> {
        const { error } = await supabase.from('teaching_journals').update({
            date: journalData.date,
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            topic: journalData.topic,
        }).eq('id', id);
        if (error) throw error;
    },
    async deleteTeachingJournal(id: number): Promise<void> {
        const { error } = await supabase.from('teaching_journals').delete().eq('id', id);
        if (error) throw error;
    },

    // Attendance management
    async getAttendanceForDate(classId: string, subjectId: string, date: string): Promise<AttendanceRecord[]> {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('class_id', classId)
            .eq('subject_id', subjectId)
            .eq('date', date);
        
        if (error) throw error;
        return data || [];
    },
    async saveAttendance(records: AttendanceRecord[]): Promise<void> {
        // Upsert operation
        const { error } = await supabase.from('attendance').upsert(records, {
            onConflict: 'date, student_id, class_id, subject_id',
        });
        if (error) throw error;
    },
    async getAttendanceTrend(schoolId: string): Promise<{ month: string, percentage: number }[]> {
        // Mock data
        return [
            { month: 'Jan', percentage: 98 },
            { month: 'Feb', percentage: 97 },
            { month: 'Mar', percentage: 98.5 },
            { month: 'Apr', percentage: 96 },
            { month: 'Mei', percentage: 97 },
        ];
    },

    // Admin grade monitoring
    async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string, avg: number }[]> {
        // Mock data
        return [
            { subject: 'Matematika', avg: 82 },
            { subject: 'Fisika', avg: 79 },
            { subject: 'Kimia', avg: 81 },
            { subject: 'Biologi', avg: 85 },
            { subject: 'Sejarah', avg: 88 },
        ];
    },

};

import { supabase } from './supabaseClient';
import { User, School, UserRole, Announcement, Subject, Class, TeachingJournal, GamificationProfile, Badge, JournalEntry } from '../types';

// Helper terpusat untuk menangani error Supabase
const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Supabase error in ${context}:`, error);
        throw new Error(`Gagal mengambil data dari server (${context}).`);
    }
};

export const dataService = {
    // --- PENGGUNA (USERS) ---
    async getUsers(filters?: { role?: UserRole; schoolId?: string }): Promise<User[]> {
        let query = supabase.from('profiles').select(`
            id,
            identity_number,
            full_name,
            email,
            role,
            avatar_url,
            school_id,
            schools (name)
        `);

        if (filters?.role) {
            query = query.eq('role', filters.role.toLowerCase());
        }
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }

        const { data, error } = await query;
        handleSupabaseError(error, 'getUsers');
        
        return data?.map((profile: any) => ({
            id: profile.id,
            identityNumber: profile.identity_number,
            name: profile.full_name,
            email: profile.email,
            role: Object.values(UserRole).find(r => r.toLowerCase() === profile.role) || profile.role,
            avatarUrl: profile.avatar_url,
            schoolId: profile.school_id,
            schoolName: profile.schools?.name,
        })) || [];
    },
    
    async getUserCount(filters: { role: UserRole; schoolId?: string }): Promise<number> {
        let query = supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true });
        
        if(filters.role) {
            query = query.eq('role', filters.role.toLowerCase());
        }
        if(filters.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }

        const { count, error } = await query;
        handleSupabaseError(error, 'getUserCount');
        return count || 0;
    },

    async createUser(formData: any): Promise<void> {
        // Implementasi createUser yang sesungguhnya akan melibatkan memanggil fungsi Supabase Edge
        // untuk membuat user di `auth.users` dan profil di `public.profiles`.
        // Untuk saat ini, kita akan fokus pada pembuatan profil saja.
        const { error } = await supabase.from('profiles').insert({
            // 'id' harus sama dengan id dari auth.users
            // Ini adalah placeholder, idealnya dilakukan di backend/Edge function
            full_name: formData.name,
            identity_number: formData.identityNumber,
            role: formData.role.toLowerCase(),
            school_id: formData.schoolId || null,
            avatar_url: formData.avatarUrl
        });
        handleSupabaseError(error, 'createUser');
    },

    async updateUser(userId: string, formData: any): Promise<void> {
        const { error } = await supabase.from('profiles').update({
            full_name: formData.name,
            identity_number: formData.identityNumber,
            role: formData.role.toLowerCase(),
            school_id: formData.schoolId || null,
        }).eq('id', userId);
        handleSupabaseError(error, 'updateUser');
    },

    async deleteUser(userId: string): Promise<void> {
         // Implementasi deleteUser yang sesungguhnya juga harus menghapus dari auth.users
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        handleSupabaseError(error, 'deleteUser');
    },

    // --- SEKOLAH (SCHOOLS) ---
    async getSchools(): Promise<School[]> {
        const { data, error } = await supabase.from('schools').select('*');
        handleSupabaseError(error, 'getSchools');
        return data || [];
    },
    async getSchoolCount(): Promise<number> {
        const { count, error } = await supabase.from('schools').select('id', { count: 'exact', head: true });
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
    
    // --- MATA PELAJARAN (SUBJECTS) ---
    async getSubjects(filters?: { schoolId?: string }): Promise<Subject[]> {
        let query = supabase.from('subjects').select('*, schools(name)');
        if (filters?.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { data, error } = await query;
        handleSupabaseError(error, 'getSubjects');
        return data?.map((d: any) => ({
            id: d.id,
            name: d.name,
            schoolId: d.school_id,
            schoolName: d.schools.name
        })) || [];
    },
    async createSubject(formData: { name: string, schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').insert({ name: formData.name, school_id: formData.schoolId });
        handleSupabaseError(error, 'createSubject');
    },
    async updateSubject(subjectId: string, formData: { name: string, schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').update({ name: formData.name, school_id: formData.schoolId }).eq('id', subjectId);
        handleSupabaseError(error, 'updateSubject');
    },
    async deleteSubject(subjectId: string): Promise<void> {
        const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
        handleSupabaseError(error, 'deleteSubject');
    },

    // --- KELAS (CLASSES) ---
    async getClasses(filters?: { teacherId?: string }): Promise<Class[]> {
        // More complex query would be needed for teacherId if it's not homeroom teacher
        let query = supabase.from('classes').select(`
            id, 
            name, 
            school_id,
            homeroom_teacher_id,
            schools (name),
            profiles (full_name)
        `);
        if(filters?.teacherId) {
             query = query.eq('homeroom_teacher_id', filters.teacherId);
        }

        const { data, error } = await query;
        handleSupabaseError(error, 'getClasses');
        return data?.map((d: any) => ({
            id: d.id,
            name: d.name,
            schoolId: d.school_id,
            schoolName: d.schools.name,
            homeroomTeacherId: d.homeroom_teacher_id,
            homeroomTeacherName: d.profiles.full_name,
        })) || [];
    },
    async getStudentsInClass(classId: string): Promise<User[]> {
        const { data, error } = await supabase
            .from('class_students')
            .select('profiles(*, schools(name))')
            .eq('class_id', classId);
        handleSupabaseError(error, 'getStudentsInClass');
        return data?.map((d: any) => ({
             id: d.profiles.id,
            identityNumber: d.profiles.identity_number,
            name: d.profiles.full_name,
            email: d.profiles.email,
            role: Object.values(UserRole).find(r => r.toLowerCase() === d.profiles.role) || d.profiles.role,
            avatarUrl: d.profiles.avatar_url,
            schoolId: d.profiles.school_id,
            schoolName: d.profiles.schools?.name,
        })) || [];
    },
    // Create/Update/Delete Class would be more complex, involving transactions to update class_students table.
    // FIX: Add createClass, updateClass, and deleteClass methods to manage class data.
    async createClass(formData: { name: string, schoolId: string, homeroomTeacherId?: string, studentIds: string[] }): Promise<void> {
        // Step 1: Create the class and get its ID
        const { data, error: classError } = await supabase.from('classes').insert({
            name: formData.name,
            school_id: formData.schoolId,
            homeroom_teacher_id: formData.homeroomTeacherId || null,
        }).select('id').single();

        handleSupabaseError(classError, 'createClass (insert class)');
        if (!data) throw new Error('Failed to get new class ID after creation.');

        const newClassId = data.id;

        // Step 2: Add students to the class
        if (formData.studentIds && formData.studentIds.length > 0) {
            const studentMappings = formData.studentIds.map(studentId => ({
                class_id: newClassId,
                student_id: studentId,
            }));
            const { error: studentError } = await supabase.from('class_students').insert(studentMappings);
            handleSupabaseError(studentError, 'createClass (add students)');
        }
    },

    async updateClass(classId: string, formData: { name: string, schoolId: string, homeroomTeacherId?: string, studentIds: string[] }): Promise<void> {
        // Step 1: Update class details
        const { error: updateError } = await supabase.from('classes').update({
            name: formData.name,
            school_id: formData.schoolId,
            homeroom_teacher_id: formData.homeroomTeacherId || null,
        }).eq('id', classId);

        handleSupabaseError(updateError, 'updateClass (update details)');

        // Step 2: Remove all existing students from the class
        const { error: deleteError } = await supabase.from('class_students').delete().eq('class_id', classId);
        handleSupabaseError(deleteError, 'updateClass (remove students)');

        // Step 3: Add the new list of students
        if (formData.studentIds && formData.studentIds.length > 0) {
            const studentMappings = formData.studentIds.map(studentId => ({
                class_id: classId,
                student_id: studentId,
            }));
            const { error: insertError } = await supabase.from('class_students').insert(studentMappings);
            handleSupabaseError(insertError, 'updateClass (add students)');
        }
    },
    
    async deleteClass(classId: string): Promise<void> {
        // Step 1: Delete student associations first due to foreign key constraints
        const { error: studentError } = await supabase.from('class_students').delete().eq('class_id', classId);
        handleSupabaseError(studentError, 'deleteClass (remove students)');
        
        // Step 2: Delete the class itself
        const { error: classError } = await supabase.from('classes').delete().eq('id', classId);
        handleSupabaseError(classError, 'deleteClass (delete class)');
    },

    // --- PENGUMUMAN (ANNOUNCEMENTS) ---
    async getAnnouncements(): Promise<Announcement[]> {
        const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        handleSupabaseError(error, 'getAnnouncements');
        return data?.map(d => ({
            id: d.id,
            title: d.title,
            content: d.content,
            date: d.created_at,
            author: d.author_name
        })) || [];
    },
    async createAnnouncement(data: { title: string, content: string, author: string }): Promise<void> {
        const { error } = await supabase.from('announcements').insert({
            title: data.title,
            content: data.content,
            author_name: data.author,
        });
        handleSupabaseError(error, 'createAnnouncement');
    },
    async deleteAnnouncement(id: string): Promise<void> {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        handleSupabaseError(error, 'deleteAnnouncement');
    },

    // --- JURNAL MENGAJAR (TEACHING JOURNAL) ---
    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        const { data, error } = await supabase
            .from('teaching_journals')
            .select('*, classes(name), subjects(name)')
            .eq('teacher_id', teacherId)
            .order('date', { ascending: false });
        handleSupabaseError(error, 'getTeachingJournals');
        return data?.map((d: any) => ({
            id: d.id,
            teacherId: d.teacher_id,
            classId: d.class_id,
            subjectId: d.subject_id,
            date: d.date,
            topic: d.topic,
            className: d.classes.name,
            subjectName: d.subjects.name,
        })) || [];
    },
    async createTeachingJournal(journalData: Omit<TeachingJournal, 'id'>): Promise<void> {
        const { error } = await supabase.from('teaching_journals').insert({
            teacher_id: journalData.teacherId,
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            date: journalData.date,
            topic: journalData.topic,
        });
        handleSupabaseError(error, 'createTeachingJournal');
    },
    async updateTeachingJournal(journalId: number, journalData: Omit<TeachingJournal, 'id'>): Promise<void> {
        const { error } = await supabase.from('teaching_journals').update({
             class_id: journalData.classId,
             subject_id: journalData.subjectId,
             date: journalData.date,
             topic: journalData.topic,
        }).eq('id', journalId);
        handleSupabaseError(error, 'updateTeachingJournal');
    },
    async deleteTeachingJournal(journalId: number): Promise<void> {
        const { error } = await supabase.from('teaching_journals').delete().eq('id', journalId);
        handleSupabaseError(error, 'deleteTeachingJournal');
    },
    
    // --- DATA SPESIFIK SISWA ---
    // The following are examples and would require actual tables in Supabase.
    // They are kept as mock data for now until the DB schema is confirmed.
    
    async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
        // Placeholder until `grades` table is implemented
        console.warn("getGradesForStudent is using mock data.");
        return [
            { subject: 'Matematika', score: 85, grade: 'A-' },
            { subject: 'Biologi', score: 92, grade: 'A' },
            { subject: 'Fisika', score: 78, grade: 'B+' },
        ];
    },
    async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> {
        // Placeholder until `attendance` table is implemented
        console.warn("getAttendanceForStudent is using mock data.");
        return [{ date: new Date().toISOString().split('T')[0], status: 'Hadir' }];
    },
     async getTeacherNoteForStudent(studentId: string): Promise<{ note: string, teacherName: string }> {
        // Placeholder
        console.warn("getTeacherNoteForStudent is using mock data.");
        return { note: "Perkembangan sangat baik.", teacherName: "Budi Hartono, S.Pd." };
    },
    async getClassForStudent(studentId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('class_students')
            .select('classes(name)')
            .eq('student_id', studentId)
            .single();
        // This won't throw error if null, which is fine.
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
             console.error("Supabase error in getClassForStudent", error);
        }
        return data?.classes?.name || null;
    },

    // --- LAIN-LAIN (REPORTS, GAMIFICATION, ETC) ---
    // These remain as mock data as they are complex and require specific DB structures.
    
    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
        console.warn("getSchoolPerformance is using mock data.");
        return [
            { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.4 },
            { school: 'MTs Fathus Salafi', 'Rata-rata Nilai': 82.1 },
        ];
    },
    async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number; }[]> {
       console.warn("getAverageGradesBySubject is using mock data.");
       const subjects = await this.getSubjects({ schoolId });
       return subjects.map(s => ({ subject: s.name, avg: 75 + Math.random() * 15 }));
    },
    async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number; }[]> {
        console.warn("getAttendanceTrend is using mock data.");
        return [{ month: 'Juli', percentage: 98 }, { month: 'Agustus', percentage: 97 }];
    },
    async getClassSchedule(className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
        console.warn("getClassSchedule is using mock data.");
        return { 'Senin': [{ time: '07:30 - 09:00', subject: 'Matematika' }]};
    },
    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        console.warn("getGamificationProfile is using mock data.");
        return {
            progress: { 'Aljabar': 85, 'Biologi Sel': 95 },
            badges: [{ id: 'b1', icon: '🥇', name: 'Jagoan Aljabar', description: 'Selesai kuis Aljabar' }],
        };
    },
    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        const journals = await this.getTeachingJournals(teacherId);
        return journals
            .filter(j => j.date === date)
            .map(j => ({
                class: j.className || 'N/A',
                subject: j.subjectName || 'N/A',
                topic: j.topic,
            }));
    },
};
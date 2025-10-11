
import { supabase } from './supabaseClient';
import { Announcement, User, UserRole, School, Subject, Class, AttendanceRecord, AttendanceStatus, GamificationProfile, TeachingJournal, JournalEntry } from '../types';

export const dataService = {
    // User functions
    async getUsers(filters: { role?: UserRole; schoolId?: string } = {}): Promise<User[]> {
        let query = supabase.from('profiles').select('*, school:schools(name)');
        if (filters.role) {
            query = query.eq('role', filters.role);
        }
        if (filters.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map((u: any) => ({
            id: u.id,
            email: u.email,
            identityNumber: u.identity_number,
            name: u.full_name,
            role: u.role,
            avatarUrl: u.avatar_url,
            schoolId: u.school_id,
            schoolName: u.school?.name,
        }));
    },

    async createUser(userData: any): Promise<void> {
        // This is a simplified version. A real implementation would involve creating auth user and profile.
        // For now, we assume an RPC function handles this.
        const { error } = await supabase.rpc('create_new_user', {
            p_email: userData.email,
            p_password: userData.password,
            p_full_name: userData.name,
            p_identity_number: userData.identityNumber,
            p_role: userData.role,
            p_school_id: userData.schoolId || null
        });
        if (error) throw error;
    },

    async updateUser(id: string, userData: any): Promise<void> {
        const { error } = await supabase.from('profiles').update({
            full_name: userData.name,
            identity_number: userData.identityNumber,
            role: userData.role,
            school_id: userData.schoolId || null
        }).eq('id', id);
        if (error) throw error;
    },

    async deleteUser(id: string): Promise<void> {
        // This should be an admin-only function on supabase
        const { error } = await supabase.rpc('delete_user_by_id', { user_id_to_delete: id });
        if (error) throw error;
    },

    // School functions
    async getSchools(): Promise<School[]> {
        const { data, error } = await supabase.from('schools').select('*');
        if (error) throw error;
        return data;
    },
    async getSchoolCount(): Promise<number> {
        const { count, error } = await supabase.from('schools').select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count || 0;
    },
    async createSchool(schoolData: Omit<School, 'id'>): Promise<void> {
        const { error } = await supabase.from('schools').insert(schoolData);
        if (error) throw error;
    },
    async updateSchool(id: string, schoolData: Omit<School, 'id'>): Promise<void> {
        const { error } = await supabase.from('schools').update(schoolData).eq('id', id);
        if (error) throw error;
    },
    async deleteSchool(id: string): Promise<void> {
        const { error } = await supabase.from('schools').delete().eq('id', id);
        if (error) throw error;
    },

    // Announcement functions
    async getAnnouncements(): Promise<Announcement[]> {
        let query = supabase.from('announcements').select(`
            *,
            author:profiles ( full_name ),
            school:schools ( name )
        `);
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data?.map((item: any) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            author_id: item.author_id,
            author: item.author?.full_name || 'Sistem',
            date: new Date(item.created_at).toISOString().split('T')[0],
            schoolId: item.school_id,
            schoolName: item.school?.name
        })) || [];
    },
    async createAnnouncement(announcementData: { title: string, content: string, author_id: string, school_id?: string }): Promise<void> {
        const { error } = await supabase.from('announcements').insert(announcementData);
        if (error) throw error;
    },
    async updateAnnouncement(id: string, announcementData: { title: string, content: string }): Promise<void> {
        const { error } = await supabase.from('announcements').update(announcementData).eq('id', id);
        if (error) throw error;
    },
    async deleteAnnouncement(id: string): Promise<void> {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw error;
    },


    // Student specific data
    async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
        // MOCK DATA
        return Promise.resolve([
            { subject: 'Matematika', score: 85, grade: 'A-' },
            { subject: 'Bahasa Indonesia', score: 92, grade: 'A' },
            { subject: 'Bahasa Inggris', score: 88, grade: 'A-' },
            { subject: 'Fisika', score: 78, grade: 'B+' },
            { subject: 'Kimia', score: 81, grade: 'B+' },
        ]);
    },
    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string; teacherName: string; }> {
        return Promise.resolve({ note: 'Ananda sangat aktif di kelas dan menunjukkan minat belajar yang tinggi. Pertahankan semangatmu!', teacherName: 'Budi Hartono, S.Pd.' });
    },
    async getClassForStudent(studentId: string): Promise<string | null> {
        const { data, error } = await supabase.from('class_student').select('class:classes(name)').eq('student_id', studentId).maybeSingle();
        if (error || !data) {
            console.error(error);
            return null;
        }
        return data.class?.name || null;
    },
    async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: AttendanceStatus }[]> {
        const { data, error } = await supabase.from('attendance').select('date, status').eq('student_id', studentId);
        if (error) throw error;
        return data;
    },

    // Teacher specific data
    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        const { data, error } = await supabase.from('teaching_journals')
            .select('subject:subjects(name), class:classes(name), topic')
            .eq('teacher_id', teacherId)
            .eq('date', date);
        if (error) throw error;
        return data.map((j: any) => ({
            subject: j.subject.name,
            class: j.class.name,
            topic: j.topic,
        }));
    },

    // Class & Subject data
    async getClasses(filters: { teacherId?: string; schoolId?: string } = {}): Promise<Class[]> {
        // This is complex. A simplified version:
        let query = supabase.from('classes').select('*, homeroom:profiles(full_name)');
        if(filters.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        if(filters.teacherId) {
             // If we need all classes a teacher teaches (not just homeroom), we need a junction table.
             // This is a simplified query for homeroom teacher for now.
             query = query.eq('homeroom_teacher_id', filters.teacherId)
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            schoolId: c.school_id,
            homeroomTeacherId: c.homeroom_teacher_id,
            homeroomTeacherName: c.homeroom?.full_name
        }));
    },
    async createClass(classData: any): Promise<void> {
        const { error } = await supabase.rpc('create_class_with_students', {
            p_name: classData.name,
            p_school_id: classData.schoolId,
            p_homeroom_teacher_id: classData.homeroomTeacherId || null,
            p_student_ids: classData.studentIds
        });
        if (error) throw error;
    },
     async updateClass(id: string, classData: any): Promise<void> {
        const { error } = await supabase.rpc('update_class_with_students', {
            p_class_id: id,
            p_name: classData.name,
            p_school_id: classData.schoolId,
            p_homeroom_teacher_id: classData.homeroomTeacherId || null,
            p_student_ids: classData.studentIds
        });
        if (error) throw error;
    },
    async deleteClass(id: string): Promise<void> {
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) throw error;
    },
    async getStudentsInClass(classId: string): Promise<User[]> {
        const { data, error } = await supabase.from('class_student').select('student:profiles(*, school:schools(name))').eq('class_id', classId);
        if (error) throw error;
        return data.map((item: any) => ({
            id: item.student.id,
            email: item.student.email,
            identityNumber: item.student.identity_number,
            name: item.student.full_name,
            role: item.student.role,
            avatarUrl: item.student.avatar_url,
            schoolId: item.student.school_id,
            schoolName: item.student.school?.name,
        }));
    },
    async getSubjects(filters: { schoolId?: string } = {}): Promise<Subject[]> {
        let query = supabase.from('subjects').select('*');
        if (filters.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },
    async createSubject(subjectData: { name: string; schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').insert({ name: subjectData.name, school_id: subjectData.schoolId });
        if (error) throw error;
    },
    async updateSubject(id: string, subjectData: { name: string; schoolId: string }): Promise<void> {
        const { error } = await supabase.from('subjects').update({ name: subjectData.name, school_id: subjectData.schoolId }).eq('id', id);
        if (error) throw error;
    },
    async deleteSubject(id: string): Promise<void> {
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) throw error;
    },


    // Gamification & Reports
    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        return Promise.resolve({
            progress: { 'Aljabar Linear': 75, 'Kalkulus': 60, 'Struktur Data': 85 },
            badges: [
                { id: '1', icon: '🚀', description: 'Penyelesai Cepat' },
                { id: '2', icon: '🎯', description: 'Akurasi Tinggi' },
                { id: '3', icon: '🔥', description: 'Belajar Beruntun' },
            ]
        });
    },

    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
        return Promise.resolve([
            { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.4 },
            { school: 'MTS Fathus Salafi', 'Rata-rata Nilai': 88.1 },
            { school: 'SD Fathus Salafi', 'Rata-rata Nilai': 90.2 },
        ]);
    },
    
    async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number; }[]> {
         // MOCK DATA
        return Promise.resolve([
            { subject: "Matematika", avg: 82 },
            { subject: "B. Indo", avg: 88 },
            { subject: "IPA", avg: 85 },
            { subject: "IPS", avg: 86 },
            { subject: "B. Ing", avg: 81 },
        ]);
    },

    async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number; }[]> {
        // MOCK DATA
        return Promise.resolve([
            { month: "Jan", percentage: 98.5 },
            { month: "Feb", percentage: 97.2 },
            { month: "Mar", percentage: 98.1 },
            { month: "Apr", percentage: 96.9 },
            { month: "Mei", percentage: 97.5 },
        ]);
    },
    async getClassSchedule(className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
        // MOCK DATA
        return Promise.resolve({
            "Senin": [{ time: "07:30 - 09:00", subject: "Upacara & Matematika" }, { time: "10:00 - 11:30", subject: "Bahasa Indonesia" }],
            "Selasa": [{ time: "07:30 - 09:00", subject: "Fisika" }, { time: "10:00 - 11:30", subject: "Bahasa Inggris" }],
            "Rabu": [{ time: "07:30 - 09:00", subject: "Kimia" }, { time: "10:00 - 11:30", subject: "Sejarah" }],
            "Kamis": [{ time: "07:30 - 09:00", subject: "Biologi" }, { time: "10:00 - 11:30", subject: "PJOK" }],
            "Jumat": [{ time: "07:30 - 09:00", subject: "Agama" }, { time: "10:00 - 11:30", subject: "Seni Budaya" }],
        });
    },

    // Attendance
    async getAttendanceForDate(classId: string, subjectId: string, date: string): Promise<AttendanceRecord[]> {
        const { data, error } = await supabase.from('attendance')
            .select('*')
            .eq('class_id', classId)
            .eq('subject_id', subjectId)
            .eq('date', date);
        if (error) throw error;
        return data;
    },
    async saveAttendance(records: AttendanceRecord[]): Promise<void> {
        const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'date, student_id, subject_id' });
        if (error) throw error;
    },

    // Teaching Journal
    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        const { data, error } = await supabase.from('teaching_journals')
            .select('*, class:classes(name), subject:subjects(name)')
            .eq('teacher_id', teacherId);
        if (error) throw error;
        return data.map((j: any) => ({
            id: j.id,
            date: j.date,
            classId: j.class_id,
            subjectId: j.subject_id,
            topic: j.topic,
            className: j.class.name,
            subjectName: j.subject.name
        }));
    },
    async createTeachingJournal(journalData: Omit<TeachingJournal, 'id'>): Promise<void> {
        const { error } = await supabase.from('teaching_journals').insert({
            date: journalData.date,
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            topic: journalData.topic,
            teacher_id: journalData.teacherId
        });
        if (error) throw error;
    },
    async updateTeachingJournal(id: number, journalData: Omit<TeachingJournal, 'id'>): Promise<void> {
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
};

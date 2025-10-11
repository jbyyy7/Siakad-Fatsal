import { User, School, UserRole, Announcement, JournalEntry, GamificationProfile, Badge, Subject, Class, TeachingJournal, NotificationSettings } from '../types';

// --- MOCK DATABASE ---

let MOCK_SCHOOLS: School[] = [
    { id: 'ma_fs', name: 'MA Fathus Salafi', level: 'SMA', address: 'Jl. Pesantren No. 1, Banyuwangi' },
    { id: 'mts_fs', name: 'MTs Fathus Salafi', level: 'SMP', address: 'Jl. Pesantren No. 2, Banyuwangi' },
    { id: 'mi_fs', name: 'MI Fathus Salafi', level: 'SD', address: 'Jl. Pesantren No. 3, Banyuwangi' },
];

let MOCK_USERS: User[] = [
    { id: 'admin-01', email: 'admin@siakad.dev', identityNumber: 'ADMIN001', name: 'Admin Utama', role: UserRole.ADMIN, avatarUrl: 'https://i.pravatar.cc/150?u=admin-01' },
    { id: 'foundation-01', email: 'yayasan@siakad.dev', identityNumber: 'YYS001', name: 'Bpk. Yayasan', role: UserRole.FOUNDATION_HEAD, avatarUrl: 'https://i.pravatar.cc/150?u=foundation-01' },
    
    { id: 'principal-ma', email: 'kepsek.ma@siakad.dev', identityNumber: 'KSMA001', name: 'Drs. H. Ahmad', role: UserRole.PRINCIPAL, avatarUrl: 'https://i.pravatar.cc/150?u=principal-ma', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'principal-mts', email: 'kepsek.mts@siakad.dev', identityNumber: 'KSMTS001', name: 'Dra. Hj. Fatimah', role: UserRole.PRINCIPAL, avatarUrl: 'https://i.pravatar.cc/150?u=principal-mts', schoolId: 'mts_fs', schoolName: 'MTs Fathus Salafi' },

    { id: 'teacher-01', email: 'guru.matematika@siakad.dev', identityNumber: '198501012010011001', name: 'Budi Hartono, S.Pd.', role: UserRole.TEACHER, avatarUrl: 'https://i.pravatar.cc/150?u=teacher-01', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'teacher-02', email: 'guru.biologi@siakad.dev', identityNumber: '199002022015022002', name: 'Siti Aminah, S.Si.', role: UserRole.TEACHER, avatarUrl: 'https://i.pravatar.cc/150?u=teacher-02', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'teacher-03', email: 'guru.mtk.mts@siakad.dev', identityNumber: '198803032014031003', name: 'Rahmat Hidayat, S.Pd.', role: UserRole.TEACHER, avatarUrl: 'https://i.pravatar.cc/150?u=teacher-03', schoolId: 'mts_fs', schoolName: 'MTs Fathus Salafi' },

    { id: 'student-01', email: 'ahmad@siakad.dev', identityNumber: '2024001', name: 'Ahmad Abdullah', role: UserRole.STUDENT, avatarUrl: 'https://i.pravatar.cc/150?u=student-01', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'student-02', email: 'fatimah@siakad.dev', identityNumber: '2024002', name: 'Fatimah Az-Zahra', role: UserRole.STUDENT, avatarUrl: 'https://i.pravatar.cc/150?u=student-02', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'student-03', email: 'yusuf@siakad.dev', identityNumber: '2024003', name: 'Yusuf Ibrahim', role: UserRole.STUDENT, avatarUrl: 'https://i.pravatar.cc/150?u=student-03', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'student-04', email: 'aisyah@siakad.dev', identityNumber: '2025001', name: 'Aisyah Humaira', role: UserRole.STUDENT, avatarUrl: 'https://i.pravatar.cc/150?u=student-04', schoolId: 'mts_fs', schoolName: 'MTs Fathus Salafi' },
];

let MOCK_SUBJECTS: Subject[] = [
    { id: 'subj-mtk-ma', name: 'Matematika', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'subj-bio-ma', name: 'Biologi', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'subj-fis-ma', name: 'Fisika', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'subj-indo-ma', name: 'Bahasa Indonesia', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'subj-mtk-mts', name: 'Matematika', schoolId: 'mts_fs', schoolName: 'MTs Fathus Salafi' },
    { id: 'subj-ipa-mts', name: 'IPA Terpadu', schoolId: 'mts_fs', schoolName: 'MTs Fathus Salafi' },
];

let MOCK_CLASSES: Class[] = [
    { id: 'class-10a-ma', name: 'MA Kelas 10-A', schoolId: 'ma_fs', homeroomTeacherId: 'teacher-01' },
    { id: 'class-10b-ma', name: 'MA Kelas 10-B', schoolId: 'ma_fs', homeroomTeacherId: 'teacher-02' },
    { id: 'class-7a-mts', name: 'MTs Kelas 7-A', schoolId: 'mts_fs', homeroomTeacherId: 'teacher-03' },
];

// Mapping students to classes
let MOCK_CLASS_STUDENTS: { classId: string, studentId: string }[] = [
    { classId: 'class-10a-ma', studentId: 'student-01' },
    { classId: 'class-10a-ma', studentId: 'student-02' },
    { classId: 'class-10a-ma', studentId: 'student-03' },
    { classId: 'class-7a-mts', studentId: 'student-04' },
];

let MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: 'ann-1', title: 'Rapat Yayasan Awal Tahun Ajaran', content: 'Diberitahukan kepada seluruh kepala sekolah di lingkungan yayasan untuk menghadiri rapat koordinasi awal tahun ajaran baru.', date: '2024-07-01', author: 'Bpk. Yayasan' },
    { id: 'ann-2', title: 'Libur Idul Adha', content: 'Kegiatan belajar mengajar diliburkan dalam rangka perayaan Idul Adha.', date: '2024-06-15', author: 'Bpk. Yayasan' },
];

let MOCK_TEACHING_JOURNALS: TeachingJournal[] = [
    { id: 1, teacherId: 'teacher-01', classId: 'class-10a-ma', subjectId: 'subj-mtk-ma', date: new Date().toISOString().split('T')[0], topic: 'Pengenalan Aljabar' },
    { id: 2, teacherId: 'teacher-01', classId: 'class-10b-ma', subjectId: 'subj-mtk-ma', date: new Date().toISOString().split('T')[0], topic: 'Fungsi Kuadrat' },
    { id: 3, teacherId: 'teacher-02', classId: 'class-10a-ma', subjectId: 'subj-bio-ma', date: '2024-07-20', topic: 'Struktur Sel' },
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- DATA SERVICE API ---

export const dataService = {
    // Users
    async getUsers(filters?: { role?: UserRole; schoolId?: string }): Promise<User[]> {
        await delay(300);
        let users = MOCK_USERS;
        if (filters?.role) {
            users = users.filter(u => u.role === filters.role);
        }
        if (filters?.schoolId) {
            users = users.filter(u => u.schoolId === filters.schoolId);
        }
        return users.map(u => ({...u, schoolName: MOCK_SCHOOLS.find(s => s.id === u.schoolId)?.name }));
    },
    async getUserCount(filters: { role: UserRole; schoolId: string }): Promise<number> {
        await delay(200);
        return MOCK_USERS.filter(u => u.role === filters.role && u.schoolId === filters.schoolId).length;
    },
    async createUser(formData: any): Promise<void> {
        await delay(500);
        const newUser: User = {
            id: `new-user-${Date.now()}`,
            email: formData.email,
            identityNumber: formData.identityNumber,
            name: formData.name,
            role: formData.role,
            avatarUrl: formData.avatarUrl || 'https://i.pravatar.cc/150',
            schoolId: formData.schoolId || undefined,
        };
        MOCK_USERS.push(newUser);
    },
    async updateUser(userId: string, formData: any): Promise<void> {
        await delay(500);
        MOCK_USERS = MOCK_USERS.map(u => u.id === userId ? { ...u, ...formData } : u);
    },
    async deleteUser(userId: string): Promise<void> {
        await delay(500);
        MOCK_USERS = MOCK_USERS.filter(u => u.id !== userId);
    },

    // Schools
    async getSchools(): Promise<School[]> {
        await delay(300);
        return MOCK_SCHOOLS;
    },
    async getSchoolCount(): Promise<number> {
        await delay(200);
        return MOCK_SCHOOLS.length;
    },
    async createSchool(formData: Omit<School, 'id'>): Promise<void> {
        await delay(500);
        const newSchool: School = {
            id: `new-school-${Date.now()}`,
            ...formData,
        };
        MOCK_SCHOOLS.push(newSchool);
    },
    async updateSchool(schoolId: string, formData: Omit<School, 'id'>): Promise<void> {
        await delay(500);
        MOCK_SCHOOLS = MOCK_SCHOOLS.map(s => s.id === schoolId ? { ...s, ...formData } : s);
    },
    async deleteSchool(schoolId: string): Promise<void> {
        await delay(500);
        MOCK_SCHOOLS = MOCK_SCHOOLS.filter(s => s.id !== schoolId);
    },

    // Subjects
    async getSubjects(filters?: { schoolId?: string }): Promise<Subject[]> {
        await delay(300);
        let subjects = MOCK_SUBJECTS.map(sub => ({ ...sub, schoolName: MOCK_SCHOOLS.find(s => s.id === sub.schoolId)?.name }));
        if (filters?.schoolId) {
            subjects = subjects.filter(sub => sub.schoolId === filters.schoolId);
        }
        return subjects;
    },
    async createSubject(formData: { name: string, schoolId: string }): Promise<void> {
        await delay(500);
        MOCK_SUBJECTS.push({ id: `new-subj-${Date.now()}`, ...formData });
    },
    async updateSubject(subjectId: string, formData: { name: string, schoolId: string }): Promise<void> {
        await delay(500);
        MOCK_SUBJECTS = MOCK_SUBJECTS.map(s => s.id === subjectId ? { ...s, ...formData } : s);
    },
    async deleteSubject(subjectId: string): Promise<void> {
        await delay(500);
        MOCK_SUBJECTS = MOCK_SUBJECTS.filter(s => s.id !== subjectId);
    },

    // Classes
    async getClasses(filters?: { teacherId?: string }): Promise<Class[]> {
        await delay(400);
        let classes = MOCK_CLASSES.map(c => {
            const homeroomTeacher = MOCK_USERS.find(u => u.id === c.homeroomTeacherId);
            return {
                ...c,
                schoolName: MOCK_SCHOOLS.find(s => s.id === c.schoolId)?.name,
                homeroomTeacherName: homeroomTeacher?.name,
            };
        });
        if (filters?.teacherId) {
            // This is a simplification. In reality, we'd check a teacher-to-class mapping.
            // For now, we assume a teacher is assigned if they are the homeroom teacher.
            classes = classes.filter(c => c.homeroomTeacherId === filters.teacherId);
        }
        return classes;
    },
    async getStudentsInClass(classId: string): Promise<User[]> {
        await delay(300);
        const studentIds = MOCK_CLASS_STUDENTS.filter(cs => cs.classId === classId).map(cs => cs.studentId);
        return MOCK_USERS.filter(u => studentIds.includes(u.id));
    },
    async createClass(formData: any): Promise<void> {
        await delay(500);
        const newClass = {
            id: `new-class-${Date.now()}`,
            name: formData.name,
            schoolId: formData.schoolId,
            homeroomTeacherId: formData.homeroomTeacherId
        };
        MOCK_CLASSES.push(newClass);
        // Update student mappings
        MOCK_CLASS_STUDENTS = MOCK_CLASS_STUDENTS.filter(cs => !formData.studentIds.includes(cs.studentId));
        formData.studentIds.forEach((studentId: string) => MOCK_CLASS_STUDENTS.push({ classId: newClass.id, studentId }));
    },
    async updateClass(classId: string, formData: any): Promise<void> {
        await delay(500);
        MOCK_CLASSES = MOCK_CLASSES.map(c => c.id === classId ? { ...c, ...formData, id: c.id } : c);
        // Update student mappings
        MOCK_CLASS_STUDENTS = MOCK_CLASS_STUDENTS.filter(cs => cs.classId !== classId);
        formData.studentIds.forEach((studentId: string) => MOCK_CLASS_STUDENTS.push({ classId, studentId }));
    },
    async deleteClass(classId: string): Promise<void> {
        await delay(500);
        MOCK_CLASSES = MOCK_CLASSES.filter(c => c.id !== classId);
        MOCK_CLASS_STUDENTS = MOCK_CLASS_STUDENTS.filter(cs => cs.classId !== classId);
    },

    // Student specific data
    async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
        await delay(500);
        if (studentId === 'student-01') return [
            { subject: 'Matematika', score: 85, grade: 'A-' },
            { subject: 'Biologi', score: 92, grade: 'A' },
            { subject: 'Fisika', score: 78, grade: 'B+' },
            { subject: 'Bahasa Indonesia', score: 88, grade: 'A-' },
        ];
        return [];
    },
    async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> {
        await delay(400);
        const today = new Date();
        const attendance = [];
        for (let i = 1; i < today.getDate(); i++) {
            const date = new Date(today.getFullYear(), today.getMonth(), i);
            if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends
            
            const random = Math.random();
            let status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' = 'Hadir';
            if (random > 0.95) status = 'Sakit';
            else if (random > 0.93) status = 'Izin';

            attendance.push({ date: date.toISOString().split('T')[0], status });
        }
        return attendance;
    },
    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string, teacherName: string }> {
        await delay(300);
        return {
            note: "Ahmad menunjukkan perkembangan yang sangat baik di semester ini, terutama dalam mata pelajaran eksakta. Perlu lebih aktif dalam diskusi kelas.",
            teacherName: "Budi Hartono, S.Pd."
        };
    },
    async getClassForStudent(studentId: string): Promise<string | null> {
        await delay(200);
        const mapping = MOCK_CLASS_STUDENTS.find(cs => cs.studentId === studentId);
        if (!mapping) return null;
        const studentClass = MOCK_CLASSES.find(c => c.id === mapping.classId);
        return studentClass?.name || null;
    },
    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        await delay(600);
        return {
            progress: {
                'Aljabar': 85,
                'Biologi Sel': 95,
                'Mekanika Dasar': 70,
            },
            badges: [
                { id: 'b1', icon: '🥇', name: 'Jagoan Aljabar', description: 'Menyelesaikan semua kuis Aljabar' },
                { id: 'b2', icon: '🔬', name: 'Pakar Mikroskop', description: 'Nilai sempurna pada praktikum Biologi' },
            ],
        };
    },

    // Teacher specific data
    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        await delay(300);
        const journals = MOCK_TEACHING_JOURNALS.filter(j => j.teacherId === teacherId && j.date === date);
        return journals.map(j => {
            const className = MOCK_CLASSES.find(c => c.id === j.classId)?.name || 'N/A';
            const subjectName = MOCK_SUBJECTS.find(s => s.id === j.subjectId)?.name || 'N/A';
            return {
                class: className,
                subject: subjectName,
                topic: j.topic,
            };
        });
    },

    // Foundation/Principal specific data
    async getAnnouncements(): Promise<Announcement[]> {
        await delay(400);
        return MOCK_ANNOUNCEMENTS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    async createAnnouncement(data: { title: string, content: string, author: string }): Promise<void> {
        await delay(500);
        const newAnnouncement: Announcement = {
            id: `ann-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            ...data
        };
        MOCK_ANNOUNCEMENTS.push(newAnnouncement);
    },
    async deleteAnnouncement(id: string): Promise<void> {
        await delay(500);
        MOCK_ANNOUNCEMENTS = MOCK_ANNOUNCEMENTS.filter(a => a.id !== id);
    },
    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
        await delay(800);
        return [
            { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.4 },
            { school: 'MTs Fathus Salafi', 'Rata-rata Nilai': 82.1 },
            { school: 'MI Fathus Salafi', 'Rata-rata Nilai': 88.9 },
        ];
    },
    async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number; }[]> {
        await delay(700);
        return MOCK_SUBJECTS.filter(s => s.schoolId === schoolId).map(s => ({
            subject: s.name,
            avg: 75 + Math.random() * 15,
        }));
    },
    async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number; }[]> {
        await delay(700);
        return [
            { month: 'Jan', percentage: 98 },
            { month: 'Feb', percentage: 97 },
            { month: 'Mar', percentage: 95 },
            { month: 'Apr', percentage: 97 },
            { month: 'Mei', percentage: 96 },
            { month: 'Jun', percentage: 94 },
        ];
    },

    // Schedule
    async getClassSchedule(className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
        await delay(500);
        return {
            'Senin': [
                { time: '07:30 - 09:00', subject: 'Matematika' },
                { time: '09:15 - 10:45', subject: 'Bahasa Indonesia' },
                { time: '11:00 - 12:30', subject: 'Fisika' },
            ],
            'Selasa': [
                { time: '07:30 - 09:00', subject: 'Biologi' },
                { time: '09:15 - 10:45', subject: 'Kimia' },
                { time: '11:00 - 12:30', subject: 'Sejarah' },
            ],
            'Rabu': [
                { time: '07:30 - 09:00', subject: 'Matematika' },
                { time: '09:15 - 10:45', subject: 'Bahasa Inggris' },
                { time: '11:00 - 12:30', subject: 'Pendidikan Agama' },
            ],
            'Kamis': [
                 { time: '07:30 - 09:00', subject: 'Biologi' },
                { time: '09:15 - 10:45', subject: 'Geografi' },
                { time: '11:00 - 12:30', subject: 'PKN' },
            ],
            'Jumat': [
                 { time: '07:30 - 09:00', subject: 'Fisika' },
                { time: '09:15 - 10:45', subject: 'Seni Budaya' },
            ],
        };
    },

    // Teaching Journal
    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        await delay(400);
        return MOCK_TEACHING_JOURNALS
            .filter(j => j.teacherId === teacherId)
            .map(j => ({
                ...j,
                className: MOCK_CLASSES.find(c => c.id === j.classId)?.name,
                subjectName: MOCK_SUBJECTS.find(s => s.id === j.subjectId)?.name,
            }))
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    async createTeachingJournal(journalData: Omit<TeachingJournal, 'id'>): Promise<void> {
        await delay(500);
        const newJournal: TeachingJournal = {
            id: Date.now(),
            ...journalData,
        };
        MOCK_TEACHING_JOURNALS.push(newJournal);
    },
    async updateTeachingJournal(journalId: number, journalData: Omit<TeachingJournal, 'id'>): Promise<void> {
        await delay(500);
        MOCK_TEACHING_JOURNALS = MOCK_TEACHING_JOURNALS.map(j => j.id === journalId ? { id: j.id, ...journalData } : j);
    },
    async deleteTeachingJournal(journalId: number): Promise<void> {
        await delay(500);
        MOCK_TEACHING_JOURNALS = MOCK_TEACHING_JOURNALS.filter(j => j.id !== journalId);
    }
};

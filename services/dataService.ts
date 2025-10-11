// This file provides a mock data service to simulate a backend.
// In a real application, this would interact with a database like Supabase.

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

// --- MOCK DATABASE ---

let mockSchools: School[] = [
    { id: 'sch1', name: 'MA Fathus Salafi', level: 'MA', address: 'Jl. Pesantren No. 1' },
    { id: 'sch2', name: 'MTS Fathus Salafi', level: 'MTS', address: 'Jl. Pesantren No. 2' },
];

let mockUsers: User[] = [
    { id: 'usr1', email: 'admin@siakad.com', identityNumber: 'ADMIN01', name: 'Admin Utama', role: UserRole.ADMIN, avatarUrl: 'https://i.pravatar.cc/150?u=usr1' },
    { id: 'usr2', email: 'kepala@yayasan.com', identityNumber: 'KY01', name: 'Dr. H. Ahmad', role: UserRole.FOUNDATION_HEAD, avatarUrl: 'https://i.pravatar.cc/150?u=usr2' },
    { id: 'usr3', email: 'kepsek.ma@siakad.com', identityNumber: 'KSMA01', name: 'Budi Santoso, S.Pd', role: UserRole.PRINCIPAL, avatarUrl: 'https://i.pravatar.cc/150?u=usr3', schoolId: 'sch1', schoolName: 'MA Fathus Salafi' },
    { id: 'usr4', email: 'guru.mat@siakad.com', identityNumber: 'GRMA01', name: 'Siti Aminah, S.Si', role: UserRole.TEACHER, avatarUrl: 'https://i.pravatar.cc/150?u=usr4', schoolId: 'sch1', schoolName: 'MA Fathus Salafi' },
    { id: 'usr5', email: 'andi@siakad.com', identityNumber: 'SISWA01', name: 'Andi Pratama', role: UserRole.STUDENT, avatarUrl: 'https://i.pravatar.cc/150?u=usr5', schoolId: 'sch1', schoolName: 'MA Fathus Salafi' },
    { id: 'usr6', email: 'susan@siakad.com', identityNumber: 'SISWA02', name: 'Susan Puspita', role: UserRole.STUDENT, avatarUrl: 'https://i.pravatar.cc/150?u=usr6', schoolId: 'sch1', schoolName: 'MA Fathus Salafi' },
    { id: 'usr7', email: 'guru.bio@siakad.com', identityNumber: 'GRMA02', name: 'Eko Wahyudi, S.Pd', role: UserRole.TEACHER, avatarUrl: 'https://i.pravatar.cc/150?u=usr7', schoolId: 'sch1', schoolName: 'MA Fathus Salafi' },
    { id: 'usr8', email: 'kepsek.mts@siakad.com', identityNumber: 'KSMTS01', name: 'Rina Marlina, M.Pd', role: UserRole.PRINCIPAL, avatarUrl: 'https://i.pravatar.cc/150?u=usr8', schoolId: 'sch2', schoolName: 'MTS Fathus Salafi' },
];

let mockAnnouncements: Announcement[] = [
    { id: 'ann1', title: 'Rapat Yayasan Awal Tahun Ajaran', content: 'Diberitahukan kepada seluruh kepala sekolah untuk menghadiri rapat awal tahun ajaran baru 2024/2025.', date: '2024-07-01', author: 'Dr. H. Ahmad' },
    { id: 'ann2', title: 'Libur Hari Raya Idul Adha', content: 'Kegiatan belajar mengajar diliburkan dalam rangka hari raya Idul Adha.', date: '2024-06-15', author: 'Admin Utama' },
];

let mockSubjects: Subject[] = [
    { id: 'sub1', name: 'Matematika Wajib', schoolId: 'sch1', schoolName: 'MA Fathus Salafi' },
    { id: 'sub2', name: 'Bahasa Indonesia', schoolId: 'sch1', schoolName: 'MA Fathus Salafi' },
    { id: 'sub3', name: 'Fisika', schoolId: 'sch1', schoolName: 'MA Fathus Salafi' },
    { id: 'sub4', name: 'Matematika', schoolId: 'sch2', schoolName: 'MTS Fathus Salafi' },
];

let mockClasses: Class[] = [
    { id: 'cls1', name: 'MA Kelas 10-A', schoolId: 'sch1', homeroomTeacherId: 'usr4', homeroomTeacherName: 'Siti Aminah, S.Si', schoolName: 'MA Fathus Salafi' },
    { id: 'cls2', name: 'MA Kelas 10-B', schoolId: 'sch1', homeroomTeacherId: 'usr7', homeroomTeacherName: 'Eko Wahyudi, S.Pd', schoolName: 'MA Fathus Salafi' },
    { id: 'cls3', name: 'MTS Kelas 7-A', schoolId: 'sch2', schoolName: 'MTS Fathus Salafi' },
];

let mockClassStudents: { classId: string; studentId: string }[] = [
    { classId: 'cls1', studentId: 'usr5' },
    { classId: 'cls1', studentId: 'usr6' },
];

let mockTeachingJournals: TeachingJournal[] = [
    { id: 1, teacherId: 'usr4', classId: 'cls1', subjectId: 'sub1', date: new Date().toISOString().split('T')[0], topic: 'Aljabar Linear', className: 'MA Kelas 10-A', subjectName: 'Matematika Wajib' },
    { id: 2, teacherId: 'usr4', classId: 'cls1', subjectId: 'sub1', date: '2024-07-20', topic: 'Trigonometri', className: 'MA Kelas 10-A', subjectName: 'Matematika Wajib' },
];

const mockGrades = [
    { studentId: 'usr5', subjectId: 'sub1', score: 85, grade: 'A-' },
    { studentId: 'usr5', subjectId: 'sub2', score: 90, grade: 'A' },
    { studentId: 'usr5', subjectId: 'sub3', score: 78, grade: 'B+' },
    { studentId: 'usr6', subjectId: 'sub1', score: 92, grade: 'A' },
];

const mockAttendance = [
    { studentId: 'usr5', date: '2024-07-21', status: 'Hadir' },
    { studentId: 'usr5', date: '2024-07-20', status: 'Hadir' },
    { studentId: 'usr5', date: '2024-07-19', status: 'Sakit' },
];

const mockBadges: Badge[] = [
    { id: 'bdg1', icon: '🚀', name: 'Penyelesai Cepat', description: 'Menyelesaikan tugas sebelum deadline.' },
    { id: 'bdg2', icon: '🧠', name: 'Ahli Matematika', description: 'Nilai di atas 90 pada Matematika.' }
];

const mockGamificationProfiles: Record<string, GamificationProfile> = {
    'usr5': { progress: { 'Matematika Wajib': 88, 'Fisika': 75 }, badges: [mockBadges[1]] },
    'usr6': { progress: { 'Matematika Wajib': 95 }, badges: [mockBadges[0], mockBadges[1]] },
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const dataService = {
    // --- User Management ---
    async getUsers(filters?: { role?: UserRole; schoolId?: string }): Promise<User[]> {
        await delay(300);
        let users = mockUsers.map(u => ({...u, schoolName: mockSchools.find(s => s.id === u.schoolId)?.name}));
        if (filters?.role) users = users.filter(u => u.role === filters.role);
        if (filters?.schoolId) users = users.filter(u => u.schoolId === filters.schoolId);
        return users;
    },
    async createUser(userData: any): Promise<void> {
        await delay(500);
        const newUser: User = {
            id: `usr${Math.random()}`,
            ...userData,
        };
        mockUsers.push(newUser);
    },
    async updateUser(userId: string, userData: any): Promise<void> {
        await delay(500);
        mockUsers = mockUsers.map(u => u.id === userId ? { ...u, ...userData } : u);
    },
    async deleteUser(userId: string): Promise<void> {
        await delay(500);
        mockUsers = mockUsers.filter(u => u.id !== userId);
    },
    async getUserCount(filters: { role: UserRole; schoolId: string }): Promise<number> {
        await delay(100);
        return mockUsers.filter(u => u.role === filters.role && u.schoolId === filters.schoolId).length;
    },

    // --- School Management ---
    async getSchools(): Promise<School[]> {
        await delay(200);
        return mockSchools;
    },
    async getSchoolCount(): Promise<number> {
        await delay(100);
        return mockSchools.length;
    },
    async createSchool(schoolData: Omit<School, 'id'>): Promise<void> {
        await delay(500);
        const newSchool: School = { id: `sch${Math.random()}`, ...schoolData };
        mockSchools.push(newSchool);
    },
    async updateSchool(schoolId: string, schoolData: Omit<School, 'id'>): Promise<void> {
        await delay(500);
        mockSchools = mockSchools.map(s => s.id === schoolId ? { id: s.id, ...schoolData } : s);
    },
    async deleteSchool(schoolId: string): Promise<void> {
        await delay(500);
        mockSchools = mockSchools.filter(s => s.id !== schoolId);
    },

    // --- Subject Management ---
    async getSubjects(filters?: { schoolId?: string }): Promise<Subject[]> {
        await delay(200);
        let subjects = mockSubjects.map(s => ({...s, schoolName: mockSchools.find(sc => sc.id === s.schoolId)?.name}));
        if (filters?.schoolId) {
            subjects = subjects.filter(s => s.schoolId === filters.schoolId);
        }
        return subjects;
    },
    async createSubject(subjectData: { name: string; schoolId: string }): Promise<void> {
        await delay(400);
        mockSubjects.push({ id: `sub${Math.random()}`, ...subjectData });
    },
    async updateSubject(subjectId: string, subjectData: { name: string; schoolId: string }): Promise<void> {
        await delay(400);
        mockSubjects = mockSubjects.map(s => s.id === subjectId ? { ...s, ...subjectData } : s);
    },
    async deleteSubject(subjectId: string): Promise<void> {
        await delay(400);
        mockSubjects = mockSubjects.filter(s => s.id !== subjectId);
    },

    // --- Class Management ---
    async getClasses(filters?: { teacherId?: string }): Promise<Class[]> {
        await delay(300);
        let classes = mockClasses.map(c => ({
            ...c,
            schoolName: mockSchools.find(s => s.id === c.schoolId)?.name,
            homeroomTeacherName: mockUsers.find(u => u.id === c.homeroomTeacherId)?.name,
        }));
        if (filters?.teacherId) {
            // This logic is simplified. A real app would have a teachers_classes table.
            // Here we assume a teacher is assigned as a homeroom teacher.
            classes = classes.filter(c => c.homeroomTeacherId === filters.teacherId);
        }
        return classes;
    },
    async createClass(classData: any): Promise<void> {
        await delay(500);
        const newClass = { id: `cls${Math.random()}`, name: classData.name, schoolId: classData.schoolId, homeroomTeacherId: classData.homeroomTeacherId };
        mockClasses.push(newClass);
        // update student-class associations
        mockClassStudents = mockClassStudents.filter(sc => !classData.studentIds.includes(sc.studentId));
        classData.studentIds.forEach((studentId: string) => {
            mockClassStudents.push({ classId: newClass.id, studentId });
        });
    },
    async updateClass(classId: string, classData: any): Promise<void> {
        await delay(500);
        mockClasses = mockClasses.map(c => c.id === classId ? { ...c, ...classData } : c);
         // update student-class associations
        mockClassStudents = mockClassStudents.filter(sc => sc.classId !== classId);
        classData.studentIds.forEach((studentId: string) => {
            mockClassStudents.push({ classId: classId, studentId });
        });
    },
    async deleteClass(classId: string): Promise<void> {
        await delay(500);
        mockClasses = mockClasses.filter(c => c.id !== classId);
        mockClassStudents = mockClassStudents.filter(sc => sc.classId !== classId);
    },
    async getStudentsInClass(classId: string): Promise<User[]> {
        await delay(300);
        const studentIds = mockClassStudents.filter(sc => sc.classId === classId).map(sc => sc.studentId);
        return mockUsers.filter(u => studentIds.includes(u.id));
    },
    async getClassForStudent(studentId: string): Promise<string | null> {
        await delay(100);
        const association = mockClassStudents.find(sc => sc.studentId === studentId);
        if (!association) return null;
        return mockClasses.find(c => c.id === association.classId)?.name || null;
    },

    // --- Student Data ---
    async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
        await delay(400);
        return mockGrades
            .filter(g => g.studentId === studentId)
            .map(g => ({ ...g, subject: mockSubjects.find(s => s.id === g.subjectId)?.name || 'Unknown' }));
    },
    async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> {
        await delay(200);
        return mockAttendance.filter(a => a.studentId === studentId);
    },
    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        await delay(500);
        return mockGamificationProfiles[studentId] || { progress: {}, badges: [] };
    },

    // --- Teacher Data ---
    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string; teacherName: string }> {
        await delay(200);
        // Find student's class, then homeroom teacher
        const classAssoc = mockClassStudents.find(sc => sc.studentId === studentId);
        if (classAssoc) {
            const studentClass = mockClasses.find(c => c.id === classAssoc.classId);
            if (studentClass?.homeroomTeacherId) {
                const teacher = mockUsers.find(u => u.id === studentClass.homeroomTeacherId);
                return { note: 'Andi menunjukkan perkembangan yang baik, perlu lebih aktif di kelas.', teacherName: teacher?.name || 'Wali Kelas' };
            }
        }
        return { note: 'Belum ada catatan dari wali kelas.', teacherName: '' };
    },
    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        await delay(300);
        return mockTeachingJournals
            .filter(j => j.teacherId === teacherId && j.date === date)
            .map(j => ({
                subject: j.subjectName || 'N/A',
                class: j.className || 'N/A',
                topic: j.topic,
            }));
    },
    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        await delay(400);
        return mockTeachingJournals
            .filter(j => j.teacherId === teacherId)
            .map(j => ({
                ...j,
                className: mockClasses.find(c => c.id === j.classId)?.name,
                subjectName: mockSubjects.find(s => s.id === j.subjectId)?.name,
            }));
    },
    async createTeachingJournal(data: any): Promise<void> {
        await delay(400);
        mockTeachingJournals.push({ id: Math.random(), ...data });
    },
    async updateTeachingJournal(id: number, data: any): Promise<void> {
        await delay(400);
        mockTeachingJournals = mockTeachingJournals.map(j => j.id === id ? { ...j, ...data } : j);
    },
    async deleteTeachingJournal(id: number): Promise<void> {
        await delay(400);
        mockTeachingJournals = mockTeachingJournals.filter(j => j.id !== id);
    },

    // --- Announcements ---
    async getAnnouncements(): Promise<Announcement[]> {
        await delay(300);
        return [...mockAnnouncements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    async createAnnouncement(data: any): Promise<void> {
        await delay(500);
        mockAnnouncements.push({ id: `ann${Math.random()}`, date: new Date().toISOString().split('T')[0], ...data });
    },
    async deleteAnnouncement(id: string): Promise<void> {
        await delay(500);
        mockAnnouncements = mockAnnouncements.filter(a => a.id !== id);
    },

    // --- Reports ---
    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
        await delay(800);
        return [
            { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.5 },
            { school: 'MTS Fathus Salafi', 'Rata-rata Nilai': 82.1 },
        ];
    },
    async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number }[]> {
        await delay(700);
        return [
            { subject: 'Matematika', avg: 88 },
            { subject: 'B. Indo', avg: 85 },
            { subject: 'Fisika', avg: 79 },
            { subject: 'Biologi', avg: 82 },
        ];
    },
    async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number }[]> {
        await delay(600);
        return [
            { month: 'Jan', percentage: 98 },
            { month: 'Feb', percentage: 97 },
            { month: 'Mar', percentage: 98.5 },
            { month: 'Apr', percentage: 96 },
            { month: 'Mei', percentage: 97.5 },
        ];
    },
    
    // --- Schedules ---
    async getClassSchedule(className: string, schoolIdentifier: string): Promise<Record<string, { time: string, subject: string }[]>> {
        await delay(400);
        return {
            "Senin": [{ time: '07:30 - 09:00', subject: 'Matematika' }, { time: '10:00 - 11:30', subject: 'Bahasa Indonesia' }],
            "Selasa": [{ time: '07:30 - 09:00', subject: 'Fisika' }, { time: '10:00 - 11:30', subject: 'Pendidikan Agama' }],
            "Rabu": [{ time: '07:30 - 09:00', subject: 'Biologi' }, { time: '10:00 - 11:30', subject: 'Sejarah' }],
            "Kamis": [{ time: '07:30 - 09:00', subject: 'Bahasa Inggris' }, { time: '10:00 - 11:30', subject: 'Penjaskes' }],
            "Jumat": [{ time: '07:30 - 09:00', subject: 'Seni Budaya' }, { time: '10:00 - 11:30', subject: 'TIK' }],
        }
    }
};

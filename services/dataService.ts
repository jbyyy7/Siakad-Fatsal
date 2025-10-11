// services/dataService.ts

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
    NotificationSettings,
} from '../types';

// MOCK DATA - In a real app, this would come from a database.
const MOCK_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@siakad.com', identityNumber: 'ADMIN001', role: UserRole.ADMIN, avatarUrl: 'https://i.pravatar.cc/150?u=admin' },
  { id: '2', name: 'Kepala Yayasan', email: 'yayasan@siakad.com', identityNumber: 'YAYASAN001', role: UserRole.FOUNDATION_HEAD, avatarUrl: 'https://i.pravatar.cc/150?u=yayasan' },
  { id: '3', name: 'Drs. H. Miftah', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', email: 'kepsek_ma@siakad.com', identityNumber: 'KS001', role: UserRole.PRINCIPAL, avatarUrl: 'https://i.pravatar.cc/150?u=kepsek_ma' },
  { id: '4', name: 'Budi Santoso, S.Pd.', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', email: 'budi.s@siakad.com', identityNumber: 'GURU001', role: UserRole.TEACHER, avatarUrl: 'https://i.pravatar.cc/150?u=guru1' },
  { id: '5', name: 'Ahmad Faruq', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', email: 'ahmad.f@siakad.com', identityNumber: 'SISWA001', role: UserRole.STUDENT, avatarUrl: 'https://i.pravatar.cc/150?u=siswa1' },
  { id: '6', name: 'Siti Aminah', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', email: 'siti.a@siakad.com', identityNumber: 'SISWA002', role: UserRole.STUDENT, avatarUrl: 'https://i.pravatar.cc/150?u=siswa2' },
  { id: '7', name: 'Rina Kartika, S.Pd.', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', email: 'rina.k@siakad.com', identityNumber: 'GURU002', role: UserRole.TEACHER, avatarUrl: 'https://i.pravatar.cc/150?u=guru2' },
];

const MOCK_SCHOOLS: School[] = [
  { id: 'ma_fs', name: 'MA Fathus Salafi', level: 'SMA', address: 'Jl. Pesantren No. 1, Pagentan' },
  { id: 'mts_fs', name: 'MTs Fathus Salafi', level: 'SMP', address: 'Jl. Pesantren No. 2, Pagentan' },
];

const MOCK_SUBJECTS: Subject[] = [
    { id: 'subj-1', name: 'Matematika', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'subj-2', name: 'Bahasa Indonesia', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'subj-3', name: 'Fisika', schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi' },
    { id: 'subj-4', name: 'Bahasa Arab', schoolId: 'mts_fs', schoolName: 'MTs Fathus Salafi' },
];

const MOCK_CLASSES: Class[] = [
    { id: 'class-1', name: 'MA Kelas 10-A', schoolId: 'ma_fs', homeroomTeacherId: '4', homeroomTeacherName: 'Budi Santoso, S.Pd.', schoolName: 'MA Fathus Salafi' },
    { id: 'class-2', name: 'MA Kelas 10-B', schoolId: 'ma_fs', homeroomTeacherId: '7', homeroomTeacherName: 'Rina Kartika, S.Pd.', schoolName: 'MA Fathus Salafi' },
    { id: 'class-3', name: 'MTs Kelas 7-A', schoolId: 'mts_fs', schoolName: 'MTs Fathus Salafi' },
];

const MOCK_STUDENTS_IN_CLASS: Record<string, string[]> = {
    'class-1': ['5', '6'],
    'class-2': [],
};

const MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: '1', title: 'Libur Awal Ramadhan', content: 'Diberitahukan kepada seluruh siswa bahwa libur awal Ramadhan dimulai tanggal 10 Maret 2025.', date: '2025-03-01', author: 'Kepala Yayasan' },
    { id: '2', title: 'Ujian Akhir Semester', content: 'UAS akan dilaksanakan mulai tanggal 1 Juni 2025.', date: '2025-05-15', author: 'Kepala Yayasan' }
];

const MOCK_GRADES: Record<string, { subject: string; score: number; grade: string; }[]> = {
    '5': [ // Ahmad Faruq
        { subject: 'Matematika', score: 85, grade: 'A-' },
        { subject: 'Bahasa Indonesia', score: 92, grade: 'A' },
        { subject: 'Fisika', score: 78, grade: 'B+' },
    ],
    '6': [], // Siti Aminah
};

const MOCK_ATTENDANCE: Record<string, { date: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> = {
    '5': [
        { date: '2024-07-01', status: 'Hadir' },
        { date: '2024-07-02', status: 'Hadir' },
        { date: '2024-07-03', status: 'Sakit' },
        { date: '2024-07-04', status: 'Hadir' },
    ]
};

const MOCK_TEACHING_JOURNALS: TeachingJournal[] = [
    { id: 1, teacherId: '4', classId: 'class-1', subjectId: 'subj-1', date: '2024-07-22', topic: 'Integral Lipat Dua', className: 'MA Kelas 10-A', subjectName: 'Matematika' }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


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
        return JSON.parse(JSON.stringify(users));
    },
    async createUser(userData: any): Promise<void> {
        console.log("Creating user (mock):", userData);
        await delay(500);
        // In real app, this would be a call to supabase.auth.signUp and an insert to profiles table
        const newUser: User = {
            id: String(Date.now()),
            name: userData.name,
            email: userData.email,
            identityNumber: userData.identityNumber,
            role: userData.role,
            avatarUrl: userData.avatarUrl,
            schoolId: userData.schoolId,
            schoolName: MOCK_SCHOOLS.find(s => s.id === userData.schoolId)?.name,
        }
        MOCK_USERS.push(newUser);
    },
    async updateUser(userId: string, userData: any): Promise<void> {
        console.log(`Updating user ${userId} (mock):`, userData);
        await delay(500);
        const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...userData };
        }
    },
    async deleteUser(userId: string): Promise<void> {
        console.log(`Deleting user ${userId} (mock)`);
        await delay(500);
        const index = MOCK_USERS.findIndex(u => u.id === userId);
        if (index > -1) {
            MOCK_USERS.splice(index, 1);
        }
    },
    async getUserCount(filters: { role: UserRole; schoolId: string }): Promise<number> {
        await delay(200);
        return MOCK_USERS.filter(u => u.role === filters.role && u.schoolId === filters.schoolId).length;
    },

    // Schools
    async getSchools(): Promise<School[]> {
        await delay(300);
        return JSON.parse(JSON.stringify(MOCK_SCHOOLS));
    },
    async createSchool(schoolData: Omit<School, 'id'>): Promise<void> {
        console.log("Creating school (mock):", schoolData);
        await delay(500);
        MOCK_SCHOOLS.push({ id: String(Date.now()), ...schoolData });
    },
    async updateSchool(schoolId: string, schoolData: Omit<School, 'id'>): Promise<void> {
        console.log(`Updating school ${schoolId} (mock):`, schoolData);
        await delay(500);
        const index = MOCK_SCHOOLS.findIndex(s => s.id === schoolId);
        if (index > -1) {
            MOCK_SCHOOLS[index] = { ...MOCK_SCHOOLS[index], ...schoolData };
        }
    },
    async deleteSchool(schoolId: string): Promise<void> {
        console.log(`Deleting school ${schoolId} (mock)`);
        await delay(500);
        const index = MOCK_SCHOOLS.findIndex(s => s.id === schoolId);
        if (index > -1) {
            MOCK_SCHOOLS.splice(index, 1);
        }
    },
    async getSchoolCount(): Promise<number> {
        await delay(100);
        return MOCK_SCHOOLS.length;
    },

    // Subjects
    async getSubjects(filters?: { schoolId?: string }): Promise<Subject[]> {
        await delay(200);
        let subjects = MOCK_SUBJECTS;
        if (filters?.schoolId) {
            subjects = subjects.filter(s => s.schoolId === filters.schoolId);
        }
        return JSON.parse(JSON.stringify(subjects));
    },
     async createSubject(subjectData: { name: string, schoolId: string }): Promise<void> {
        console.log("Creating subject (mock):", subjectData);
        await delay(500);
        MOCK_SUBJECTS.push({ id: String(Date.now()), ...subjectData });
    },
    async updateSubject(subjectId: string, subjectData: { name: string, schoolId: string }): Promise<void> {
        console.log(`Updating subject ${subjectId} (mock):`, subjectData);
        await delay(500);
        const index = MOCK_SUBJECTS.findIndex(s => s.id === subjectId);
        if (index > -1) {
            MOCK_SUBJECTS[index] = { ...MOCK_SUBJECTS[index], ...subjectData };
        }
    },
    async deleteSubject(subjectId: string): Promise<void> {
        console.log(`Deleting subject ${subjectId} (mock)`);
        await delay(500);
        const index = MOCK_SUBJECTS.findIndex(s => s.id === subjectId);
        if (index > -1) {
            MOCK_SUBJECTS.splice(index, 1);
        }
    },

    // Classes
    async getClasses(filters?: { teacherId?: string }): Promise<Class[]> {
        await delay(300);
        let classes = MOCK_CLASSES;
        if (filters?.teacherId) {
            classes = classes.filter(c => c.homeroomTeacherId === filters.teacherId);
        }
        return JSON.parse(JSON.stringify(classes));
    },
    async getStudentsInClass(classId: string): Promise<User[]> {
        await delay(400);
        const studentIds = MOCK_STUDENTS_IN_CLASS[classId] || [];
        return MOCK_USERS.filter(u => studentIds.includes(u.id));
    },
     async createClass(classData: any): Promise<void> {
        console.log("Creating class (mock):", classData);
        await delay(500);
        const newClass = { id: String(Date.now()), name: classData.name, schoolId: classData.schoolId, homeroomTeacherId: classData.homeroomTeacherId, students: [] };
        MOCK_CLASSES.push(newClass);
        MOCK_STUDENTS_IN_CLASS[newClass.id] = classData.studentIds;
    },
    async updateClass(classId: string, classData: any): Promise<void> {
        console.log(`Updating class ${classId} (mock):`, classData);
        await delay(500);
        const index = MOCK_CLASSES.findIndex(c => c.id === classId);
        if (index > -1) {
            MOCK_CLASSES[index] = { ...MOCK_CLASSES[index], name: classData.name, homeroomTeacherId: classData.homeroomTeacherId };
            MOCK_STUDENTS_IN_CLASS[classId] = classData.studentIds;
        }
    },
    async deleteClass(classId: string): Promise<void> {
        console.log(`Deleting class ${classId} (mock)`);
        await delay(500);
        const index = MOCK_CLASSES.findIndex(c => c.id === classId);
        if (index > -1) {
            MOCK_CLASSES.splice(index, 1);
            delete MOCK_STUDENTS_IN_CLASS[classId];
        }
    },

    // Student specific data
    async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
        await delay(500);
        return MOCK_GRADES[studentId] || [];
    },
    async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> {
        await delay(500);
        return MOCK_ATTENDANCE[studentId] || [];
    },
    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string; teacherName: string; }> {
        await delay(200);
        if (studentId === '5') {
            return { note: "Ahmad menunjukkan kemajuan yang sangat baik, terutama dalam pelajaran Sains. Terus tingkatkan semangat belajarnya!", teacherName: "Budi Santoso, S.Pd." };
        }
        return { note: "Tidak ada catatan.", teacherName: "" };
    },
    async getClassForStudent(studentId: string): Promise<string | null> {
        await delay(100);
        for (const classId in MOCK_STUDENTS_IN_CLASS) {
            if (MOCK_STUDENTS_IN_CLASS[classId].includes(studentId)) {
                return MOCK_CLASSES.find(c => c.id === classId)?.name || null;
            }
        }
        return null;
    },

    // Teacher specific data
    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        await delay(400);
        const today = new Date().toISOString().split('T')[0];
        if (teacherId === '4' && date === today) {
             return [
                { subject: 'Matematika', class: 'MA Kelas 10-A', topic: 'Pengenalan Trigonometri' },
            ];
        }
        return [];
    },
    async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
        await delay(500);
        return MOCK_TEACHING_JOURNALS.filter(j => j.teacherId === teacherId);
    },
    async createTeachingJournal(data: any): Promise<void> {
        await delay(500);
        const newJournal: TeachingJournal = {
            id: Date.now(),
            ...data,
            className: MOCK_CLASSES.find(c => c.id === data.classId)?.name,
            subjectName: MOCK_SUBJECTS.find(s => s.id === data.subjectId)?.name,
        }
        MOCK_TEACHING_JOURNALS.push(newJournal);
    },
     async updateTeachingJournal(journalId: number, data: any): Promise<void> {
        await delay(500);
        const index = MOCK_TEACHING_JOURNALS.findIndex(j => j.id === journalId);
        if (index > -1) {
            MOCK_TEACHING_JOURNALS[index] = { ...MOCK_TEACHING_JOURNALS[index], ...data };
        }
    },
    async deleteTeachingJournal(journalId: number): Promise<void> {
        await delay(500);
        const index = MOCK_TEACHING_JOURNALS.findIndex(j => j.id === journalId);
        if (index > -1) {
            MOCK_TEACHING_JOURNALS.splice(index, 1);
        }
    },

    // Announcements
    async getAnnouncements(): Promise<Announcement[]> {
        await delay(400);
        return JSON.parse(JSON.stringify(MOCK_ANNOUNCEMENTS));
    },
    async createAnnouncement(data: Omit<Announcement, 'id' | 'date'>): Promise<void> {
        await delay(500);
        MOCK_ANNOUNCEMENTS.unshift({ id: String(Date.now()), date: new Date().toISOString().split('T')[0], ...data });
    },
    async deleteAnnouncement(id: string): Promise<void> {
        await delay(500);
        const index = MOCK_ANNOUNCEMENTS.findIndex(a => a.id === id);
        if (index > -1) {
            MOCK_ANNOUNCEMENTS.splice(index, 1);
        }
    },

    // Features
    async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
        await delay(600);
        return {
            progress: {
                'Matematika': 85,
                'Fisika': 78,
                'Bahasa Indonesia': 92,
            },
            badges: [
                { id: 'b1', icon: '🚀', name: 'Penyelesai Cepat', description: 'Menyelesaikan tugas sebelum deadline' },
                { id: 'b2', icon: '🎯', name: 'Tepat Sasaran', description: 'Nilai di atas 90 pada kuis' },
            ]
        };
    },
    async getClassSchedule(className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
        await delay(500);
        // This would be a complex query in a real DB
        return {
            'Senin': [
                { time: '07:30 - 09:00', subject: 'Matematika' },
                { time: '10:00 - 11:30', subject: 'Bahasa Indonesia' },
            ],
            'Selasa': [
                 { time: '07:30 - 09:00', subject: 'Fisika' },
                 { time: '10:00 - 11:30', subject: 'Sejarah' },
            ],
            'Rabu': [
                 { time: '07:30 - 09:00', subject: 'Matematika' },
                 { time: '10:00 - 11:30', subject: 'Bahasa Arab' },
            ],
            'Kamis': [
                 { time: '07:30 - 09:00', subject: 'Bahasa Inggris' },
                 { time: '10:00 - 11:30', subject: 'Fiqih' },
            ],
             'Jumat': [
                 { time: '07:30 - 09:00', subject: 'Pendidikan Jasmani' },
            ],
        };
    },

    // Reports
    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
        await delay(800);
        return [
            { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.2 },
            { school: 'MTs Fathus Salafi', 'Rata-rata Nilai': 82.1 },
            { school: 'SD Fathus Salafi', 'Rata-rata Nilai': 88.4 },
        ];
    },
     async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number; }[]> {
        await delay(700);
        if (schoolId === 'ma_fs') {
            return [
                { subject: 'Matematika', avg: 82 },
                { subject: 'Fisika', avg: 78 },
                { subject: 'B. Indo', avg: 88 },
                { subject: 'B. Arab', avg: 81 },
                { subject: 'Fiqih', avg: 85 },
            ];
        }
        return [];
    },
    async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number; }[]> {
        await delay(700);
        return [
            { month: 'Jan', percentage: 98 },
            { month: 'Feb', percentage: 97 },
            { month: 'Mar', percentage: 98 },
            { month: 'Apr', percentage: 95 },
            { month: 'Mei', percentage: 97 },
            { month: 'Jun', percentage: 99 },
        ];
    }
};

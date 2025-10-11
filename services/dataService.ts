import { supabase } from './supabaseClient';
import { 
    User, UserRole, School, Announcement, Subject, Class, 
    AttendanceRecord, AttendanceStatus, GamificationProfile, TeachingJournal, JournalEntry 
} from '../types';

// This is a mock implementation of the data service for demonstration and compilation purposes.
// In a real application, these functions would interact with a Supabase backend.
const MOCK_DELAY = 50;

export const dataService = {
  // USER MANAGEMENT
  async getUsers(filters?: { role?: UserRole; schoolId?: string }): Promise<User[]> {
    await new Promise(res => setTimeout(res, MOCK_DELAY));
     if (filters?.role === UserRole.STUDENT) {
        return [
            { id: 'student1', name: 'Budi Santoso', email: 'budi@email.com', identityNumber: '12345', role: UserRole.STUDENT, avatarUrl: 'https://i.pravatar.cc/150?u=student1', schoolId: 'school1', schoolName: 'MA Fathus Salafi' },
        ];
    }
    if (filters?.role === UserRole.TEACHER) {
        return [
            { id: 'teacher1', name: 'Dewi Lestari', email: 'dewi@email.com', identityNumber: '54321', role: UserRole.TEACHER, avatarUrl: 'https://i.pravatar.cc/150?u=teacher1', schoolId: 'school1', schoolName: 'MA Fathus Salafi' },
        ]
    }
    return [
        { id: 'admin1', name: 'Admin Utama', email: 'admin@email.com', identityNumber: '00001', role: UserRole.ADMIN, avatarUrl: 'https://i.pravatar.cc/150?u=admin1' },
        { id: 'student1', name: 'Budi Santoso', email: 'budi@email.com', identityNumber: '12345', role: UserRole.STUDENT, avatarUrl: 'https://i.pravatar.cc/150?u=student1', schoolId: 'school1', schoolName: 'MA Fathus Salafi' },
        { id: 'teacher1', name: 'Dewi Lestari', email: 'dewi@email.com', identityNumber: '54321', role: UserRole.TEACHER, avatarUrl: 'https://i.pravatar.cc/150?u=teacher1', schoolId: 'school1', schoolName: 'MA Fathus Salafi' },
    ];
  },
  async createUser(userData: any): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async updateUser(userId: string, userData: any): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async deleteUser(userId: string): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },

  // SCHOOL MANAGEMENT
  async getSchools(): Promise<School[]> {
    await new Promise(res => setTimeout(res, MOCK_DELAY));
    return [{id: 'school1', name: 'MA Fathus Salafi', level: 'MA', address: 'Jl. Pesantren No. 1'}];
  },
  async getSchoolCount(): Promise<number> { return 1; },
  async createSchool(schoolData: Omit<School, 'id'>): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async updateSchool(schoolId: string, schoolData: Omit<School, 'id'>): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async deleteSchool(schoolId: string): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },

  // ANNOUNCEMENTS
  async getAnnouncements(): Promise<Announcement[]> {
    return [{ id: '1', title: 'Pengumuman Libur Sekolah', content: 'Sekolah akan diliburkan pada tanggal 17 Agustus 2024.', date: '2024-08-10', author: 'Kepala Sekolah', author_id: 'ks1', schoolName: 'MA Fathus Salafi' }];
  },
  async createAnnouncement(data: any): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async updateAnnouncement(id: string, data: any): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async deleteAnnouncement(id: string): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },

  // STUDENT DATA
  async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
    return [ { subject: 'Matematika', score: 85, grade: 'A-' }, { subject: 'Fisika', score: 92, grade: 'A' }, { subject: 'Bahasa Indonesia', score: 88, grade: 'A-' } ];
  },
  async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: AttendanceStatus }[]> {
      return [ { date: '2024-08-01', status: 'Hadir' }, { date: '2024-08-02', status: 'Hadir' }, { date: '2024-08-03', status: 'Sakit' } ];
  },
  async getTeacherNoteForStudent(studentId: string): Promise<{ note: string; teacherName: string; }> {
      return { note: 'Ananda menunjukkan perkembangan yang sangat baik semester ini. Terus tingkatkan!', teacherName: 'Dewi Lestari, S.Pd.' };
  },
  async getClassForStudent(studentId: string): Promise<string | null> { return 'MA Kelas 10-A'; },

  // GAMIFICATION
  async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
      return { studentId, progress: { 'Matematika': 85, 'Fisika': 92, 'Bahasa': 88 }, badges: [{id: '1', icon: '🏆', description: 'Juara Kelas'}] };
  },
  
  // TEACHER DATA
   async getClasses(filters?: { teacherId?: string }): Promise<Class[]> {
    return [{ id: 'class1', name: 'MA Kelas 10-A', schoolId: 'school1', homeroomTeacherName: 'Dewi Lestari, S.Pd.' }];
  },
  async getSubjects(filters?: { schoolId?: string }): Promise<Subject[]> {
      return [{ id: 'subj1', name: 'Matematika', schoolId: 'school1' }, { id: 'subj2', name: 'Fisika', schoolId: 'school1' }];
  },
  async getStudentsInClass(classId: string): Promise<User[]> {
      return [ { id: 'student1', name: 'Budi Santoso', email: 'budi@email.com', identityNumber: '12345', role: UserRole.STUDENT, avatarUrl: 'https://i.pravatar.cc/150?u=student1', schoolId: 'school1', schoolName: 'MA Fathus Salafi' }];
  },
  async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
      return [{ subject: 'Matematika', class: 'MA Kelas 10-A', topic: 'Aljabar Linear' }];
  },
  async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> { return []; },
  async createTeachingJournal(data: any): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async updateTeachingJournal(id: number, data: any): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async deleteTeachingJournal(id: number): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },

  // ATTENDANCE
  async getAttendanceForDate(classId: string, subjectId: string, date: string): Promise<AttendanceRecord[]> { return []; },
  async saveAttendance(records: AttendanceRecord[]): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },

  // CLASS & SUBJECT MANAGEMENT
  async createSubject(data: any): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async updateSubject(id: string, data: any): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async deleteSubject(id: string): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async createClass(data: any): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async updateClass(id: string, data: any): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },
  async deleteClass(id: string): Promise<void> { await new Promise(res => setTimeout(res, MOCK_DELAY)); },

  // REPORTS
  async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
    return [{ school: 'MA Fathus Salafi', 'Rata-rata Nilai': 88.5 }];
  },
  async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number; }[]> {
      return [{ subject: 'Matematika', avg: 85 }, { subject: 'Fisika', avg: 92 }];
  },
  async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number; }[]> {
      return [{ month: 'Juli', percentage: 98 }, { month: 'Agustus', percentage: 99 }];
  },

  // SCHEDULE
  async getClassSchedule(className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
    return {
        'Senin': [{ time: '07:30 - 09:00', subject: 'Matematika' }, { time: '10:00 - 11:30', subject: 'Bahasa Indonesia'}],
        'Selasa': [{ time: '07:30 - 09:00', subject: 'Fisika' }],
    };
  }
};

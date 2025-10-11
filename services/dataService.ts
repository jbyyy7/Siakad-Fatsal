import { User, UserRole, School, Announcement, GamificationProfile, Subject, Class } from '../types';

// Mock Data
const mockSchools: School[] = [
    { id: 'ma_fs', name: 'MA Fathus Salafi', level: 'SMA/MA', address: 'Jl. Pesantren No. 1' },
    { id: 'mts_fs', name: 'MTS Fathus Salafi', level: 'SMP/MTS', address: 'Jl. Pesantren No. 2' },
];

const mockUsers: User[] = [
    // Admins & Foundation
    { id: 'user_admin', email: 'admin@siakad.dev', identityNumber: 'ADMIN01', name: 'Admin Utama', role: UserRole.ADMIN, avatarUrl: 'https://i.pravatar.cc/150?u=admin' },
    { id: 'user_foundation', email: 'yayasan@siakad.dev', identityNumber: 'YYS01', name: 'Bpk. Yayasan', role: UserRole.FOUNDATION_HEAD, avatarUrl: 'https://i.pravatar.cc/150?u=foundation' },
    // MA Fathus Salafi
    { id: 'user_principal_ma', email: 'kepsek.ma@siakad.dev', identityNumber: 'NIP001', name: 'Drs. H. Ahmad', role: UserRole.PRINCIPAL, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=principal_ma' },
    { id: 'user_teacher_1', email: 'guru1.ma@siakad.dev', identityNumber: 'NIP002', name: 'Ibu Siti Aminah', role: UserRole.TEACHER, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=teacher1' },
    { id: 'user_teacher_2', email: 'guru2.ma@siakad.dev', identityNumber: 'NIP003', name: 'Bpk. Budi Santoso', role: UserRole.TEACHER, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=teacher2' },
    { id: 'user_student_1', email: 'siswa1.ma@siakad.dev', identityNumber: 'NIS001', name: 'Ahmad Abdullah', role: UserRole.STUDENT, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', level: 'MA Kelas 10-A', avatarUrl: 'https://i.pravatar.cc/150?u=student1' },
    { id: 'user_student_2', email: 'siswa2.ma@siakad.dev', identityNumber: 'NIS002', name: 'Fatimatuz Zahra', role: UserRole.STUDENT, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', level: 'MA Kelas 10-A', avatarUrl: 'https://i.pravatar.cc/150?u=student2' },
     // MTS Fathus Salafi
    { id: 'user_principal_mts', email: 'kepsek.mts@siakad.dev', identityNumber: 'NIP004', name: 'Dra. Hj. Fatimah', role: UserRole.PRINCIPAL, schoolId: 'mts_fs', schoolName: 'MTS Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=principal_mts' },
    { id: 'user_teacher_3', email: 'guru3.mts@siakad.dev', identityNumber: 'NIP005', name: 'Bpk. Hidayat', role: UserRole.TEACHER, schoolId: 'mts_fs', schoolName: 'MTS Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=teacher3' },
    { id: 'user_student_3', email: 'siswa3.mts@siakad.dev', identityNumber: 'NIS003', name: 'Muhammad Yusuf', role: UserRole.STUDENT, schoolId: 'mts_fs', schoolName: 'MTS Fathus Salafi', level: 'MTS Kelas 7-B', avatarUrl: 'https://i.pravatar.cc/150?u=student3' },
];

const mockAnnouncements: Announcement[] = [
    { id: 'ann1', title: 'Libur Awal Ramadhan', content: 'Diberitahukan kepada seluruh siswa dan guru, kegiatan belajar mengajar akan diliburkan pada tanggal 1-3 Ramadhan. Kegiatan akan dimulai kembali pada tanggal 4 Ramadhan.', date: '10 Maret 2024', author: 'Yayasan Fathus Salafi' }
];

const mockSubjects: Subject[] = [
    { id: 'subj1', name: 'Matematika' },
    { id: 'subj2', name: 'Bahasa Indonesia' },
    { id: 'subj3', name: 'Fisika' },
    { id: 'subj4', name: 'Kimia' },
    { id: 'subj5', name: 'Biologi' },
    { id: 'subj6', name: 'Sejarah' },
];

const mockClasses: Class[] = [
    { id: 'class1', name: 'MA Kelas 10-A', schoolId: 'ma_fs', teacherId: 'user_teacher_1', schoolName: 'MA Fathus Salafi', teacherName: 'Ibu Siti Aminah' },
    { id: 'class2', name: 'MA Kelas 10-B', schoolId: 'ma_fs', teacherId: 'user_teacher_2', schoolName: 'MA Fathus Salafi', teacherName: 'Bpk. Budi Santoso' },
    { id: 'class3', name: 'MTS Kelas 7-B', schoolId: 'mts_fs', teacherId: 'user_teacher_3', schoolName: 'MTS Fathus Salafi', teacherName: 'Bpk. Hidayat' },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


export const dataService = {
  // User Management
  async getUsers(filters?: { role?: UserRole; schoolId?: string }): Promise<User[]> {
    await delay(500);
    let users = mockUsers.map(u => ({ ...u, schoolName: mockSchools.find(s => s.id === u.schoolId)?.name }));
    if (!filters) return users;
    if (filters.role) users = users.filter(u => u.role === filters.role);
    if (filters.schoolId) users = users.filter(u => u.schoolId === filters.schoolId);
    return users;
  },

  async updateUser(userId: string, formData: any): Promise<void> {
    await delay(300);
    console.log(`Updating user ${userId}`, formData);
    // Mock logic
    const index = mockUsers.findIndex(u => u.id === userId);
    if (index > -1) {
        mockUsers[index] = { ...mockUsers[index], ...formData };
    } else {
        throw new Error("User not found");
    }
  },

  async createUser(formData: any): Promise<void> {
    await delay(300);
    console.log('Creating user', formData);
    const newUser: User = {
        id: `user_${Date.now()}`,
        email: formData.email,
        ...formData
    }
    mockUsers.push(newUser);
  },

  async deleteUser(userId: string): Promise<void> {
    await delay(300);
    console.log(`Deleting user ${userId}`);
    const index = mockUsers.findIndex(u => u.id === userId);
    if (index > -1) {
        mockUsers.splice(index, 1);
    }
  },

  async getUserCount(filters: { role: UserRole; schoolId: string }): Promise<number> {
    await delay(200);
    return mockUsers.filter(u => u.role === filters.role && u.schoolId === filters.schoolId).length;
  },

  // School Management
  async getSchools(): Promise<School[]> {
    await delay(400);
    return mockSchools;
  },
  
  async getSchoolCount(): Promise<number> {
    await delay(100);
    return mockSchools.length;
  },

  async createSchool(formData: Omit<School, 'id'>): Promise<void> {
     await delay(300);
     console.log('Creating school', formData);
     mockSchools.push({ id: `school_${Date.now()}`, ...formData });
  },

  async updateSchool(schoolId: string, formData: Omit<School, 'id'>): Promise<void> {
      await delay(300);
      console.log(`Updating school ${schoolId}`, formData);
      const index = mockSchools.findIndex(s => s.id === schoolId);
      if(index > -1) {
        mockSchools[index] = { ...mockSchools[index], ...formData };
      }
  },

  async deleteSchool(schoolId: string): Promise<void> {
      await delay(300);
      console.log(`Deleting school ${schoolId}`);
       const index = mockSchools.findIndex(s => s.id === schoolId);
      if(index > -1) {
        mockSchools.splice(index, 1);
      }
  },

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    await delay(300);
    return mockAnnouncements;
  },

  // Student Data
  async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
    await delay(600);
    if(studentId === 'user_student_1' || studentId === 'user_student_2' || studentId === 'user_student_3') {
        return [
            { subject: 'Matematika', score: 85, grade: 'A-' },
            { subject: 'Sains', score: 92, grade: 'A' },
            { subject: 'Bahasa Indonesia', score: 88, grade: 'A-' },
            { subject: 'Bahasa Inggris', score: 90, grade: 'A' },
            { subject: 'Sejarah', score: 78, grade: 'B+' },
        ];
    }
    return [];
  },

  async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> {
    await delay(700);
    if (!studentId) return [];
    // Mock for current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return [
        { date: `${year}-${month.toString().padStart(2, '0')}-01`, status: 'Hadir' },
        { date: `${year}-${month.toString().padStart(2, '0')}-02`, status: 'Hadir' },
        { date: `${year}-${month.toString().padStart(2, '0')}-03`, status: 'Sakit' },
        { date: `${year}-${month.toString().padStart(2, '0')}-04`, status: 'Hadir' },
        { date: `${year}-${month.toString().padStart(2, '0')}-05`, status: 'Hadir' },
    ];
  },

  async getTeacherNoteForStudent(studentId: string): Promise<{ note: string, teacherName: string }> {
      await delay(300);
      if (!studentId) return { note: '', teacherName: '' };
      return {
          note: 'Ananda Ahmad menunjukkan kemajuan yang sangat baik di semester ini, terutama dalam pelajaran Sains. Terus tingkatkan semangat belajarnya dan jangan ragu bertanya jika ada kesulitan.',
          teacherName: 'Ibu Siti Aminah',
      }
  },

  // Teacher Data
  async getJournalForTeacher(teacherId: string, date: string): Promise<{ subject: string; classId: string; topic: string; }[]> {
    await delay(500);
    if (teacherId === 'user_teacher_1' && date === new Date().toISOString().split('T')[0]) {
      return [
        { subject: 'Matematika', classId: '10-A', topic: 'Aljabar Linear' },
        { subject: 'Matematika', classId: '10-B', topic: 'Pengenalan Trigonometri' },
      ];
    }
    return [];
  },

  // Gamification
  async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
    await delay(800);
    if (!studentId) throw new Error("Student not found");
    return {
      progress: {
        'Matematika': 85,
        'Fisika': 70,
        'Kimia': 65,
      },
      badges: [
        { id: 'b1', icon: '🚀', description: 'Penyelesai Cepat' },
        { id: 'b2', icon: '🎯', description: 'Nilai Sempurna' },
        { id: 'b3', icon: '📚', description: 'Rajin Membaca' },
      ],
    };
  },
  
  // Academic Reports
  async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
    await delay(1000);
    return [
        { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 88.5 },
        { school: 'MTS Fathus Salafi', 'Rata-rata Nilai': 86.2 },
        { school: 'SD Fathus Salafi', 'Rata-rata Nilai': 90.1 },
    ];
  },

  async getClassSchedule(classId: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
    await delay(500);
    console.log(classId, schoolId); // just to use params
    return {
        "Senin": [{ time: '07:30 - 09:00', subject: 'Matematika' }, { time: '10:00 - 11:30', subject: 'Bahasa Indonesia' }],
        "Selasa": [{ time: '07:30 - 09:00', subject: 'Fisika' }, { time: '10:00 - 11:30', subject: 'Kimia' }],
        "Rabu": [{ time: '07:30 - 09:00', subject: 'Biologi' }, { time: '10:00 - 11:30', subject: 'Sejarah' }],
        "Kamis": [{ time: '07:30 - 09:00', subject: 'Pendidikan Agama' }, { time: '10:00 - 11:30', subject: 'Olahraga' }],
        "Jumat": [{ time: '07:30 - 09:00', subject: 'Seni Budaya' }, { time: '10:00 - 11:30', subject: 'Teknologi Informasi' }],
    }
  },

  async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number; }[]> {
    await delay(700);
    if (!schoolId) return [];
    return [
      { subject: 'Matematika', avg: 82 },
      { subject: 'IPA', avg: 88 },
      { subject: 'IPS', avg: 85 },
      { subject: 'Bahasa', avg: 90 },
      { subject: 'Agama', avg: 92 },
    ];
  },

  async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number; }[]> {
    await delay(600);
    if (!schoolId) return [];
    return [
      { month: 'Jan', percentage: 98 },
      { month: 'Feb', percentage: 97 },
      { month: 'Mar', percentage: 98 },
      { month: 'Apr', percentage: 95 },
      { month: 'Mei', percentage: 96 },
      { month: 'Jun', percentage: 99 },
    ];
  },
    // Subject Management
    async getSubjects(): Promise<Subject[]> {
      await delay(300);
      return mockSubjects;
    },
    async createSubject(formData: Omit<Subject, 'id'>): Promise<void> {
      await delay(200);
      mockSubjects.push({ id: `subj_${Date.now()}`, ...formData });
    },
    async updateSubject(id: string, formData: Omit<Subject, 'id'>): Promise<void> {
      await delay(200);
      const index = mockSubjects.findIndex(s => s.id === id);
      if (index > -1) mockSubjects[index] = { id, ...formData };
    },
    async deleteSubject(id: string): Promise<void> {
      await delay(200);
      const index = mockSubjects.findIndex(s => s.id === id);
      if (index > -1) mockSubjects.splice(index, 1);
    },

    // Class Management
    async getClasses(): Promise<Class[]> {
        await delay(400);
        return mockClasses.map(c => ({
            ...c,
            schoolName: mockSchools.find(s => s.id === c.schoolId)?.name,
            teacherName: mockUsers.find(u => u.id === c.teacherId)?.name,
        }));
    },
    async createClass(formData: any): Promise<void> {
      await delay(300);
      mockClasses.push({ id: `class_${Date.now()}`, ...formData });
    },
    async updateClass(id: string, formData: any): Promise<void> {
      await delay(300);
      const index = mockClasses.findIndex(c => c.id === id);
      if (index > -1) mockClasses[index] = { ...mockClasses[index], ...formData };
    },
    async deleteClass(id: string): Promise<void> {
      await delay(300);
      const index = mockClasses.findIndex(c => c.id === id);
      if (index > -1) mockClasses.splice(index, 1);
    },
};

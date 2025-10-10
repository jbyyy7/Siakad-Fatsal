import { User, UserRole, School, GamificationProfile, JournalEntry, Badge, Announcement } from './types';

export const MOCK_SCHOOLS: School[] = [
  { id: 'ma_fs', name: 'MA Fathus Salafi', level: 'Madrasah Aliyah', address: 'Jl. Pesantren No. 1, Pagentan' },
  { id: 'mts_fs', name: 'MTS Fathus Salafi', level: 'Madrasah Tsanawiyah', address: 'Jl. Pesantren No. 2, Pagentan' },
];

export const MOCK_USERS: User[] = [
  // Admin
  { id: 'admin-01', email: 'admin@siakad.dev', identityNumber: 'admin', name: 'Admin Utama', role: UserRole.ADMIN, avatarUrl: 'https://i.pravatar.cc/150?u=admin-01' },
  // Foundation Head
  { id: 'head-01', email: 'yayasan@siakad.dev', identityNumber: 'kepala.yayasan', name: 'Dr. H. Ahmad Fauzi', role: UserRole.FOUNDATION_HEAD, avatarUrl: 'https://i.pravatar.cc/150?u=head-01' },
  // Principals
  { id: 'principal-ma', email: 'kepsek.ma@siakad.dev', identityNumber: 'kepsek.ma', name: 'Budi Santoso, S.Pd.', role: UserRole.PRINCIPAL, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=principal-ma' },
  { id: 'principal-mts', email: 'kepsek.mts@siakad.dev', identityNumber: 'kepsek.mts', name: 'Siti Aminah, M.Pd.', role: UserRole.PRINCIPAL, schoolId: 'mts_fs', schoolName: 'MTS Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=principal-mts' },
  // Teachers
  { id: 'teacher-01', email: 'eko.wibowo@siakad.dev', identityNumber: '198503152010011001', name: 'Eko Wibowo, S.Pd.', role: UserRole.TEACHER, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=teacher-01' },
  { id: 'teacher-02', email: 'dewi.lestari@siakad.dev', identityNumber: '199008202015032002', name: 'Dewi Lestari, S.Si.', role: UserRole.TEACHER, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=teacher-02' },
   { id: 'teacher-03', email: 'rudi.hartono@siakad.dev', identityNumber: '198801012012011003', name: 'Rudi Hartono, S.Kom.', role: UserRole.TEACHER, schoolId: 'mts_fs', schoolName: 'MTS Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=teacher-03' },
  // Students
  { id: 'student-01', email: 'ahmad.zain@siakad.dev', identityNumber: '1001', name: 'Ahmad Zain', role: UserRole.STUDENT, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', level: 'MA Kelas 10-A', avatarUrl: 'https://i.pravatar.cc/150?u=student-01' },
  { id: 'student-02', email: 'budi.darmawan@siakad.dev', identityNumber: '1002', name: 'Budi Darmawan', role: UserRole.STUDENT, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', level: 'MA Kelas 10-A', avatarUrl: 'https://i.pravatar.cc/150?u=student-02' },
  { id: 'student-03', email: 'cindy.putri@siakad.dev', identityNumber: '1003', name: 'Cindy Putri', role: UserRole.STUDENT, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', level: 'MA Kelas 10-A', avatarUrl: 'https://i.pravatar.cc/150?u=student-03' },
  { id: 'student-04', email: 'dian.sari@siakad.dev', identityNumber: '2001', name: 'Dian Sari', role: UserRole.STUDENT, schoolId: 'mts_fs', schoolName: 'MTS Fathus Salafi', level: 'MTS Kelas 8-B', avatarUrl: 'https://i.pravatar.cc/150?u=student-04' },
];

export const MOCK_GRADES: Record<string, { subject: string, score: number, grade: string }[]> = {
  'student-01': [
    { subject: 'Matematika', score: 88, grade: 'A-' },
    { subject: 'Bahasa Indonesia', score: 92, grade: 'A' },
    { subject: 'Fisika', score: 85, grade: 'B+' },
    { subject: 'Kimia', score: 90, grade: 'A' },
    { subject: 'Biologi', score: 78, grade: 'B' },
    { subject: 'Sejarah', score: 82, grade: 'B' },
  ],
  'student-02': [
    { subject: 'Matematika', score: 75, grade: 'B' },
    { subject: 'Bahasa Indonesia', score: 80, grade: 'B' },
    { subject: 'Fisika', score: 72, grade: 'C+' },
    { subject: 'Kimia', score: 78, grade: 'B' },
    { subject: 'Biologi', score: 81, grade: 'B' },
    { subject: 'Sejarah', score: 85, grade: 'B+' },
  ],
};

export const MOCK_TEACHER_NOTES: Record<string, string> = {
  'student-01': "Ahmad menunjukkan perkembangan yang sangat baik semester ini, terutama di bidang IPA. Pertahankan semangat belajarmu!",
};

export const MOCK_ATTENDANCE: Record<string, { date: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> = {
  'student-01': [
    // FIX: Using `as const` ensures TypeScript infers the literal type 'Hadir' for the status property, not the general type 'string'.
    ...Array.from({ length: 24 }, (_, i) => {
      const day = i + 1;
      const date = new Date(2024, 6, day); // July
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        return null;
      }
      // FIX: Used `as const` to ensure TypeScript infers a literal type for 'status', resolving the type assignment error.
      return { date: `2024-07-${day.toString().padStart(2, '0')}`, status: 'Hadir' as const };
    }).filter((v): v is { date: string; status: 'Hadir' } => Boolean(v)),
    // FIX: Used `as const` on status properties to ensure they are typed as literals ('Sakit', 'Izin'), not as a general string, to match the declared type.
    { date: '2024-07-08', status: 'Sakit' as const },
    { date: '2024-07-15', status: 'Izin' as const },
  ].sort((a,b) => a.date.localeCompare(b.date)),
};


export const MOCK_JOURNAL: Record<string, JournalEntry[]> = {
  '2024-07-25': [
    { teacherId: 'teacher-01', classId: '10-a', subject: 'Matematika', date: '2024-07-25', topic: 'Trigonometri Dasar' },
    { teacherId: 'teacher-01', classId: '10-b', subject: 'Matematika', date: '2024-07-25', topic: 'Pengenalan Logaritma' },
  ]
};

const badgeData: Badge[] = [
    { id: 'b-math-1', name: 'Ahli Aljabar', description: 'Menyelesaikan 100 soal aljabar', icon: '🧮' },
    { id: 'b-phys-1', name: 'Newton Muda', description: 'Menguasai konsep dasar mekanika', icon: '🍎' },
    { id: 'b-bio-1', name: 'Penjelajah Sel', description: 'Mengidentifikasi seluruh organel sel', icon: '🔬' },
    { id: 'b-hist-1', name: 'Saksi Sejarah', description: 'Menghafal 50 tanggal penting', icon: '📜' },
];

export const MOCK_GAMIFICATION: Record<string, GamificationProfile> = {
  'student-01': {
    studentId: 'student-01',
    points: 1250,
    level: 12,
    progress: {
      'Matematika': 88,
      'Fisika': 85,
      'Kimia': 90,
      'Biologi': 78,
    },
    badges: [badgeData[0], badgeData[1], badgeData[2]],
  },
};

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: 'ann-1', title: 'Rapat Persiapan Ujian Akhir Semester', content: 'Diberitahukan kepada seluruh dewan guru untuk menghadiri rapat persiapan UAS yang akan dilaksanakan pada hari Senin depan.', date: '2024-07-22', author: 'Dr. H. Ahmad Fauzi' },
    { id: 'ann-2', title: 'Informasi Libur Idul Adha', content: 'Sehubungan dengan perayaan Idul Adha, kegiatan belajar mengajar akan diliburkan selama 3 hari.', date: '2024-07-15', author: 'Dr. H. Ahmad Fauzi' },
];
// FIX: Implemented the content for `constants.ts` which was a placeholder. This file now contains mock data for schools, users, and grades, resolving multiple "not a module" errors across the application.
import { User, UserRole, School, GamificationProfile, Badge, JournalEntry } from './types';

export const MOCK_SCHOOLS: School[] = [
  { id: 'ra_fs', name: 'RA Fathus Salafi', level: 'RA', address: 'Jl. Ceria No. 1' },
  { id: 'mi_fs', name: 'MI Fathus Salafi', level: 'MI', address: 'Jl. Pendidikan No. 10' },
  { id: 'mts_fs', name: 'MTs Fathus Salafi', level: 'MTs', address: 'Jl. Prestasi No. 5' },
  { id: 'ma_fs', name: 'MA Fathus Salafi', level: 'MA', address: 'Jl. Ilmu No. 12' },
];

export const MOCK_USERS: User[] = [
  // Admins
  { id: 'admin_01', email: 'admin@fathussalafi.ac.id', username: 'admin', name: 'Admin Sistem', role: UserRole.ADMIN, avatarUrl: 'https://i.pravatar.cc/150?u=admin_01' },
  // Foundation
  { id: 'ky_01', email: 'kepala.yayasan@fathussalafi.ac.id', username: 'kepala.yayasan', name: 'Bpk. H. Ahmad', role: UserRole.FOUNDATION_HEAD, avatarUrl: 'https://i.pravatar.cc/150?u=ky_01' },
  // Principals
  { id: 'ks_mi_01', email: 'kepsek.mi@fathussalafi.ac.id', username: 'kepsek.mi', name: 'Ibu Budiarti', role: UserRole.PRINCIPAL, schoolId: 'mi_fs', schoolName: 'MI Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=ks_mi_01' },
  { id: 'ks_ma_01', email: 'kepsek.ma@fathussalafi.ac.id', username: 'kepsek.ma', name: 'Bpk. Susilo', role: UserRole.PRINCIPAL, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=ks_ma_01' },
  // Teachers
  { id: 'guru_mi_01', email: 'rina.m@fathussalafi.ac.id', username: 'rina.m', name: 'Rina Mustika', role: UserRole.TEACHER, schoolId: 'mi_fs', schoolName: 'MI Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=guru_mi_01' },
  { id: 'guru_ma_01', email: 'eko.w@fathussalafi.ac.id', username: 'eko.w', name: 'Eko Wibowo', role: UserRole.TEACHER, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', avatarUrl: 'https://i.pravatar.cc/150?u=guru_ma_01' },
  // Students
  { id: 'siswa_mi_01', email: 'andi.mi@fathussalafi.ac.id', username: 'andi.mi', name: 'Andi Pratama', role: UserRole.STUDENT, schoolId: 'mi_fs', schoolName: 'MI Fathus Salafi', level: 'MI', avatarUrl: 'https://i.pravatar.cc/150?u=siswa_mi_01' },
  { id: 'siswa_ma_01', email: 'cinta.ma@fathussalafi.ac.id', username: 'cinta.ma', name: 'Cinta Ayu', role: UserRole.STUDENT, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', level: 'MA', avatarUrl: 'https://i.pravatar.cc/150?u=siswa_ma_01' },
  { id: 'siswa_ma_02', email: 'budi.d@fathussalafi.ac.id', username: 'budi.d', name: 'Budi Doremi', role: UserRole.STUDENT, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', level: 'MA', avatarUrl: 'https://i.pravatar.cc/150?u=siswa_ma_02' },
  { id: 'siswa_ma_03', email: 'dewi.p@fathussalafi.ac.id', username: 'dewi.p', name: 'Dewi Persada', role: UserRole.STUDENT, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', level: 'MA', avatarUrl: 'https://i.pravatar.cc/150?u=siswa_ma_03' },
  { id: 'siswa_ma_04', email: 'fitri.a@fathussalafi.ac.id', username: 'fitri.a', name: 'Fitri Anggraini', role: UserRole.STUDENT, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', level: 'MA', avatarUrl: 'https://i.pravatar.cc/150?u=siswa_ma_04' },
  { id: 'siswa_ma_05', email: 'gita.s@fathussalafi.ac.id', username: 'gita.s', name: 'Gita Savitri', role: UserRole.STUDENT, schoolId: 'ma_fs', schoolName: 'MA Fathus Salafi', level: 'MA', avatarUrl: 'https://i.pravatar.cc/150?u=siswa_ma_05' },
];


export const MOCK_GRADES: { [studentId: string]: { subject: string; grade: string; score: number }[] } = {
  'siswa_ma_01': [
    { subject: 'Matematika', grade: 'A-', score: 88 },
    { subject: 'Fisika', grade: 'B+', score: 82 },
    { subject: 'Kimia', grade: 'A', score: 91 },
    { subject: 'Biologi', grade: 'B', score: 78 },
    { subject: 'Bahasa Indonesia', grade: 'A', score: 95 },
    { subject: 'Bahasa Inggris', grade: 'A-', score: 89 },
  ],
  'siswa_mi_01': [
    { subject: 'Matematika', grade: 'A', score: 92 },
    { subject: 'Bahasa Indonesia', grade: 'A-', score: 89 },
    { subject: 'IPA', grade: 'A', score: 95 },
  ]
};

export const MOCK_BADGES: Badge[] = [
    { id: 'b01', name: 'Bintang Kelas', description: 'Mendapatkan nilai rata-rata di atas 90.', icon: '⭐' },
    { id: 'b02', name: 'Rajin Membaca', description: 'Menyelesaikan 10 buku bacaan.', icon: '📚' },
    { id: 'b03', name: 'Absensi Sempurna', description: 'Tidak pernah absen dalam sebulan.', icon: '✅' },
];

export const MOCK_GAMIFICATION: { [studentId: string]: GamificationProfile } = {
    'siswa_ma_01': {
        studentId: 'siswa_ma_01',
        points: 1250,
        level: 12,
        progress: { 'Matematika': 88, 'Fisika': 82, 'Kimia': 91, 'Biologi': 78 },
        badges: [MOCK_BADGES[0], MOCK_BADGES[1]],
    },
    'siswa_mi_01': {
        studentId: 'siswa_mi_01',
        points: 850,
        level: 8,
        progress: { 'Matematika': 92, 'Bahasa Indonesia': 89, 'IPA': 95 },
        badges: [MOCK_BADGES[0], MOCK_BADGES[2]],
    }
};

export const MOCK_JOURNAL: { [date: string]: JournalEntry[] } = {
    '2024-07-25': [
        { teacherId: 'guru_mi_01', classId: 'mi-4a', subject: 'Matematika', date: '2024-07-25', topic: 'Penjumlahan Dasar' },
        { teacherId: 'guru_mi_01', classId: 'mi-4a', subject: 'Bahasa Indonesia', date: '2024-07-25', topic: 'Membaca Lancar' },
    ]
};
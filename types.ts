// FIX: Implemented the content for `types.ts` which was a placeholder. This defines the core data structures like User, UserRole, and School used throughout the application, resolving multiple "not a module" errors.
export enum UserRole {
  ADMIN = 'Admin',
  FOUNDATION_HEAD = 'Kepala Yayasan',
  PRINCIPAL = 'Kepala Sekolah',
  TEACHER = 'Guru',
  STUDENT = 'Siswa',
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  schoolId?: string;
  schoolName?: string;
  level?: 'RA' | 'MI' | 'MTs' | 'MA';
}

export interface School {
  id: string;
  name: string;
  level: 'RA' | 'MI' | 'MTs' | 'MA';
  address: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
}

export interface GamificationProfile {
  studentId: string;
  points: number;
  level: number;
  progress: { [subject: string]: number }; // Progress 0-100 per subject
  badges: Badge[];
}

export interface JournalEntry {
  teacherId: string;
  classId: string;
  subject: string;
  date: string;
  topic: string;
}

export interface NotificationSettings {
  whatsappNumber: string;
  attendance: boolean;
  newAssignment: boolean;
  dailyReport: boolean;
}
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
  identityNumber: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  schoolId?: string;
  schoolName?: string;
  level?: string;
}

export interface School {
  id: string;
  name: string;
  level: string;
  address: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface GamificationProfile {
  studentId: string;
  points: number;
  level: number;
  progress: { [subject: string]: number };
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

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}
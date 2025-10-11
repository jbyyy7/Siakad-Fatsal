
export enum UserRole {
  ADMIN = 'Admin',
  FOUNDATION_HEAD = 'Kepala Yayasan',
  PRINCIPAL = 'Kepala Sekolah',
  TEACHER = 'Guru',
  STUDENT = 'Murid',
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
}

export interface School {
  id: string;
  name: string;
  level: string;
  address: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string; // YYYY-MM-DD
}

export interface JournalEntry {
    subject: string;
    class: string;
    topic: string;
}

export interface Class {
    id: string;
    name: string;
    schoolId: string;
    homeroomTeacherId?: string;
    homeroomTeacherName?: string;
}

export interface Subject {
    id: string;
    name: string;
    schoolId: string;
}

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';

export interface AttendanceRecord {
    id?: number;
    date: string; // YYYY-MM-DD
    student_id: string;
    class_id: string;
    subject_id: string;
    teacher_id: string;
    status: AttendanceStatus;
}

export interface NotificationSettings {
    whatsappNumber: string;
    attendance: boolean;
    newAssignment: boolean;
    dailyReport: boolean;
}

export interface Badge {
  id: string;
  icon: string;
  description: string;
}

export interface GamificationProfile {
  studentId: string;
  progress: Record<string, number>; // subject: percentage
  badges: Badge[];
}

export interface TeachingJournal {
  id: number;
  date: string; // YYYY-MM-DD
  teacherId: string;
  classId: string;
  subjectId: string;
  topic: string;
  className?: string; // from join
  subjectName?: string; // from join
}

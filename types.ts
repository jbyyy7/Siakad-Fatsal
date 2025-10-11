
export enum UserRole {
  ADMIN = 'Admin',
  FOUNDATION_HEAD = 'Ketua Yayasan',
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
  avatarUrl: string;
  schoolId?: string;
  schoolName?: string;
}

export interface School {
  id: string;
  name: string;
  level: string;
  address: string;
}

export interface Class {
    id: string;
    name: string;
    schoolId: string;
    homeroomTeacherId?: string;
    homeroomTeacherName?: string;
    studentIds?: string[]; // for form
}

export interface Subject {
    id: string;
    name:string;
    schoolId: string;
}

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';

export interface AttendanceRecord {
    id?: number;
    date: string;
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

export interface GamificationProfile {
    progress: Record<string, number>;
    badges: { id: string; icon: string; description: string }[];
}

export interface TeachingJournal {
    id: number;
    date: string;
    classId: string;
    className?: string;
    subjectId: string;
    subjectName?: string;
    topic: string;
    teacherId?: string;
}

export interface JournalEntry {
    subject: string;
    class: string;
    topic: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string; // This is author's full name from profiles table
  author_id: string;
  date: string; // YYYY-MM-DD
  schoolId?: string;
  schoolName?: string;
}
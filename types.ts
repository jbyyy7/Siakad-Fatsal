
// FIX: Removed a circular dependency. The `User` type is defined in this file and does not need to be imported.

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
  
  // New detailed fields
  placeOfBirth?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: 'Laki-laki' | 'Perempuan';
  religion?: string;
  address?: string;
  phoneNumber?: string;
  parentName?: string;
  parentPhoneNumber?: string;
}

export interface School {
  id: string;
  name: string;
  level: string; // e.g., 'SMA', 'SMP'
  address: string;
}

export interface Class {
  id: string;
  name: string;
  schoolId: string;
  schoolName?: string;
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  studentIds?: string[];
}

export interface Subject {
  id: string;
  name: string;
  schoolId: string;
  schoolName?: string;
}

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';

export interface AttendanceRecord {
    id?: number;
    date: string;
    student_id: string;
    studentName?: string;
    class_id: string;
    subject_id: string;
    teacher_id: string;
    teacherName?: string;
    status: AttendanceStatus;
}

export interface Grade {
    id?: number;
    student_id: string;
    studentName?: string;
    class_id: string;
    subject_id: string;
    teacher_id: string;
    score: number;
    notes?: string;
}

export interface JournalEntry { // Used in TeacherDashboard
  subject: string;
  class: string;
  topic: string;
}

export interface TeachingJournal { // Used in TeachingJournalPage
    id: number;
    date: string;
    classId: string;
    className?: string;
    subjectId: string;
    subjectName?: string;
    topic: string;
    teacherId: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  author_id: string;
  schoolId?: string;
  schoolName?: string;
}

export interface NotificationSettings {
    whatsappNumber: string;
    attendance: boolean;
    newAssignment: boolean;
    dailyReport: boolean;
}

export interface GamificationProfile {
    studentId: string;
    progress: Record<string, number>; // subject -> percentage
    badges: {
        id: string;
        icon: string;
        description: string;
    }[];
}

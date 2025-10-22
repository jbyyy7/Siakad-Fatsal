

// FIX: Removed a circular dependency. The `User` type is defined in this file and does not need to be imported.

export enum UserRole {
  ADMIN = 'Admin',
  TEACHER = 'Guru',
  PRINCIPAL = 'Kepala Sekolah',
  STUDENT = 'Siswa',
  FOUNDATION_HEAD = 'Kepala Yayasan',
  STAFF = 'Staff',
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

// Teacher/Staff Attendance (separate from student attendance)
export interface TeacherAttendanceRecord {
    id?: number;
    date: string;
    teacher_id: string;
    teacherName?: string;
    school_id: string;
    check_in_time?: string; // HH:MM:SS
    check_out_time?: string; // HH:MM:SS
    status: AttendanceStatus;
    notes?: string;
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

// Additional types for better type safety
export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ClassMember {
  id: string;
  classId: string;
  profileId: string;
  role: 'student' | 'teacher';
}

export interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  used: boolean;
}

export interface ClassSchedule {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export interface StudentImportRow {
  identityNumber: string;
  name: string;
  email: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  religion?: string;
  address?: string;
  phoneNumber?: string;
  parentName?: string;
  parentPhoneNumber?: string;
}

export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// QR Attendance types
export interface QRAttendanceSession {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  qrCode: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // meters
  };
}

export interface QRCheckIn {
  id: string;
  sessionId: string;
  studentId: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  status: 'on-time' | 'late' | 'early';
}

// Real-time notification types
export interface RealtimeNotification {
  id: string;
  type: 'announcement' | 'grade' | 'attendance' | 'assignment';
  title: string;
  message: string;
  timestamp: string;
  recipientIds: string[];
  data?: Record<string, unknown>;
  read: boolean;
}

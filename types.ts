

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
  
  // Student Card fields
  photoUrl?: string; // Photo for student card
  bloodType?: string; // A, B, AB, O, A+, B+, AB+, O+, A-, B-, AB-, O-
}

export interface School {
  id: string;
  name: string;
  level: string; // e.g., 'SMA', 'SMP'
  address: string;
  // Location fields for attendance validation
  latitude?: number;
  longitude?: number;
  locationName?: string;
  radius?: number; // radius in meters for geofencing
  locationAttendanceEnabled?: boolean; // Enable/disable location-based attendance
  // Gate attendance settings - Phase 1
  gateAttendanceEnabled?: boolean; // Enable/disable gate check-in/out
  gateQREnabled?: boolean;         // Allow QR scan at gate
  gateFaceEnabled?: boolean;       // Allow face recognition at gate (future)
  gateManualEnabled?: boolean;     // Allow manual input by admin/staff
  // Gate attendance settings - Phase 2
  gateCheckInStart?: string;       // Check-in start time (HH:MM:SS)
  gateCheckInEnd?: string;         // Check-in end time (HH:MM:SS)
  gateLateThreshold?: string;      // Late threshold time (HH:MM:SS) default: 07:30:00
  gateCheckOutStart?: string;      // Check-out start time (HH:MM:SS)
  gateCheckOutEnd?: string;        // Check-out end time (HH:MM:SS)
  gateNotifyParents?: boolean;     // Send notifications to parents
  gateNotifyOnLate?: boolean;      // Send notification if student late
}

export interface Class {
  id: string;
  name: string;
  schoolId: string;
  schoolName?: string;
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  academicYear: string; // e.g., "2024/2025"
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
    // Teacher location when marking attendance
    teacher_latitude?: number;
    teacher_longitude?: number;
    teacher_location_name?: string;
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
    // Location fields
    latitude?: number;
    longitude?: number;
    location_name?: string;
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

// Schedule for class subjects
export interface ClassSchedule {
    id: string;
    class_id: string;
    subject_id: string;
    teacher_id: string;
    day_of_week: number; // 0-6, 0=Sunday
    start_time: string; // HH:MM
    end_time: string; // HH:MM
    room?: string;
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

// Gate Attendance - Check-in/out at school gate
export type GateAttendanceMethod = 'QR' | 'Face' | 'Manual';
export type GateAttendanceStatus = 'inside_school' | 'outside_school';

export interface GateAttendanceRecord {
  id?: number;
  student_id: string;
  studentName?: string;
  school_id: string;
  date: string; // YYYY-MM-DD
  check_in_time?: string; // ISO timestamp
  check_in_method?: GateAttendanceMethod;
  check_in_by?: string; // Admin/Staff user ID who did manual check-in
  check_in_by_name?: string;
  check_out_time?: string; // ISO timestamp
  check_out_method?: GateAttendanceMethod;
  check_out_by?: string; // Admin/Staff user ID who did manual check-out
  check_out_by_name?: string;
  status: GateAttendanceStatus;
  notes?: string;
  created_at?: string;
  // Phase 2 fields
  late_arrival?: boolean;
  late_minutes?: number;
}

// Parent Contact Information (Enhanced with WhatsApp verification)
export interface ParentContact {
  id?: number;
  student_id: string;
  parent_name: string;
  relationship: 'Father' | 'Mother' | 'Guardian';
  phone_number: string;
  email?: string;
  whatsapp_number?: string;
  is_primary: boolean;
  whatsapp_verified?: boolean; // NEW for WhatsApp notifications
  notification_enabled?: boolean; // NEW for opt-in/out
  created_at?: string;
  updated_at?: string;
}

// Gate Attendance Notification
export type GateNotificationType = 'CheckIn' | 'CheckOut' | 'LateArrival';
export type NotificationDeliveryStatus = 'Pending' | 'Sent' | 'Failed';
export type NotificationDeliveryMethod = 'InApp' | 'WhatsApp' | 'Email';

export interface GateAttendanceNotification {
  id?: number;
  gate_attendance_id: number;
  recipient_type: 'Parent' | 'Teacher' | 'Admin';
  recipient_id: string;
  notification_type: GateNotificationType;
  message: string;
  sent_at?: string;
  delivery_status: NotificationDeliveryStatus;
  delivery_method: NotificationDeliveryMethod;
  error_message?: string;
  created_at?: string;
}

// Gate Attendance Analytics
export interface GateAttendanceAnalytics {
  date: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  on_time_count: number;
  average_check_in_time?: string;
  average_check_out_time?: string;
  late_percentage: number;
}

// Late Arrival Report
export interface LateArrivalReport {
  student_id: string;
  student_name: string;
  identity_number: string;
  total_days: number;
  late_days: number;
  late_percentage: number;
  average_late_minutes: number;
  max_late_minutes: number;
}

// ================================================
// ACADEMIC YEAR & SEMESTER TYPES
// ================================================

export interface AcademicYear {
  id: string;
  schoolId: string;
  name: string; // "2024/2025"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Semester {
  id: string;
  academicYearId: string;
  name: string; // "Semester 1", "Semester 2"
  semesterNumber: 1 | 2;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ================================================
// REPORT CARD TYPES (RAPOR DIGITAL)
// ================================================

export interface ReportCard {
  id: string;
  studentId: string;
  classId?: string;
  semesterId: string;
  schoolId?: string;
  
  // Student info snapshot
  studentName: string;
  studentNis: string;
  className?: string;
  
  // Attendance summary
  totalDays: number;
  presentDays: number;
  sickDays: number;
  permissionDays: number;
  absentDays: number;
  
  // Overall performance
  totalScore?: number;
  averageScore?: number;
  rank?: number;
  totalStudents?: number;
  
  // Status
  status: 'Draft' | 'Published' | 'Archived';
  publishedAt?: string;
  publishedBy?: string;
  
  // Teachers
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  principalName?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Relations (populated)
  subjects?: ReportCardSubject[];
  comments?: ReportCardComment[];
  semester?: Semester;
}

export interface ReportCardSubject {
  id: string;
  reportCardId: string;
  subjectId?: string;
  subjectName: string;
  
  // Scores
  knowledgeScore?: number; // Pengetahuan
  skillScore?: number; // Keterampilan
  finalScore?: number; // Nilai Akhir
  grade?: string; // A, B, C, D, E or predicate
  
  // Description
  description?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface ReportCardComment {
  id: string;
  reportCardId: string;
  commentType: 'Attitude' | 'Achievement' | 'Homeroom' | 'Principal';
  comment: string;
  commentedBy?: string;
  commentedByName?: string;
  createdAt: string;
  updatedAt: string;
}

// ================================================
// NOTIFICATION TYPES
// ================================================

export type NotificationRecipientType = 'Parent' | 'Student' | 'Teacher' | 'Staff' | 'Admin';
export type NotificationType = 'GateCheckIn' | 'GateCheckOut' | 'GateLate' | 'ReportCard' | 'Payment' | 'General';
export type NotificationChannel = 'WhatsApp' | 'Email' | 'InApp' | 'SMS';
export type NotificationStatus = 'Pending' | 'Sent' | 'Delivered' | 'Failed';

export interface NotificationLog {
  id: string;
  recipientType: NotificationRecipientType;
  recipientId?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  
  notificationType: NotificationType;
  channel: NotificationChannel;
  
  message: string;
  status: NotificationStatus;
  
  // External service response
  externalId?: string; // Twilio message SID, etc
  errorMessage?: string;
  
  sentAt?: string;
  deliveredAt?: string;
  
  createdAt: string;
  updatedAt: string;
}


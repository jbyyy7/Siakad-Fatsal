
// FIX: Removed self-import of UserRole from './types' to prevent a circular dependency and resolve a name conflict with the enum declaration below.
export enum UserRole {
  STUDENT = 'Student',
  TEACHER = 'Teacher',
  PRINCIPAL = 'Principal',
  FOUNDATION_HEAD = 'Foundation Head',
  ADMIN = 'Admin',
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

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    author: string;
}

export interface JournalEntry {
    subject: string;
    class: string;
    topic: string;
}

export interface TeachingJournal {
    id: number;
    teacherId: string;
    classId: string;
    subjectId: string;
    date: string;
    topic: string;
    className?: string;
    subjectName?: string;
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
    name: string;
    description: string;
}

export interface GamificationProfile {
    progress: Record<string, number>;
    badges: Badge[];
}

export interface Subject {
    id: string;
    name: string;
    schoolId: string;
    schoolName?: string;
}

export interface Class {
    id: string;
    name: string;
    schoolId: string;
    homeroomTeacherId?: string;
    schoolName?: string;
    homeroomTeacherName?: string;
    students?: User[];
}

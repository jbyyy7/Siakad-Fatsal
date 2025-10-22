import { UserRole } from './types';

/**
 * Role definitions and permissions
 */
export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: {
    canManageAllSchools: true,
    canManageUsers: true,
    canViewAllData: true,
    canExportData: true,
  },
  [UserRole.STAFF]: {
    canManageAllSchools: false,
    canManageUsers: true, // Only in their school
    canViewAllData: false, // Only their school
    canExportData: true, // Only their school
    canManageClasses: true,
    canManageSubjects: true,
    canManageAttendance: true,
    canManageGrades: true,
  },
  [UserRole.FOUNDATION_HEAD]: {
    canManageAllSchools: false,
    canManageUsers: false,
    canViewAllData: true,
    canExportData: true,
  },
  [UserRole.PRINCIPAL]: {
    canManageAllSchools: false,
    canManageUsers: false,
    canViewAllData: false, // Only their school
    canExportData: true,
    canManageClasses: true,
    canManageSubjects: true,
  },
  [UserRole.TEACHER]: {
    canManageAllSchools: false,
    canManageUsers: false,
    canViewAllData: false,
    canExportData: false,
    canManageAttendance: true, // Only their classes
    canManageGrades: true, // Only their subjects
  },
  [UserRole.STUDENT]: {
    canManageAllSchools: false,
    canManageUsers: false,
    canViewAllData: false,
    canExportData: false,
  },
};

export const AVAILABLE_ROLES = [
  UserRole.ADMIN,
  UserRole.STAFF,
  UserRole.FOUNDATION_HEAD,
  UserRole.PRINCIPAL,
  UserRole.TEACHER,
  UserRole.STUDENT,
];

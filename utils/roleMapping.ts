import { UserRole } from '../types';

export const toUserRoleEnum = (dbRole: any): UserRole => {
  const roleString = String(dbRole || '').toLowerCase();

  // Handle legacy role names from the database for backward compatibility.
  if (roleString === 'murid') {
      return UserRole.STUDENT; // Maps 'murid' to 'Siswa'
  }
  if (roleString === 'ketua yayasan') {
      return UserRole.FOUNDATION_HEAD; // Maps 'ketua yayasan' to 'Kepala Yayasan'
  }

  // Handle current role names.
  const roleEntry = Object.entries(UserRole).find(([, value]) => value.toLowerCase() === roleString);
  return roleEntry ? (roleEntry[1] as UserRole) : (dbRole as UserRole);
};

export default toUserRoleEnum;

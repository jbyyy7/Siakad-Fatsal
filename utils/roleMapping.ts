import { UserRole } from '../types';

export const toUserRoleEnum = (dbRole: any): UserRole => {
  // If already a valid UserRole enum value, return as is
  if (Object.values(UserRole).includes(dbRole as UserRole)) {
    return dbRole as UserRole;
  }

  const roleString = String(dbRole || '').trim();
  const roleLower = roleString.toLowerCase();

  // Handle legacy role names from the database for backward compatibility
  if (roleLower === 'murid') {
    return UserRole.STUDENT; // Maps 'murid' to 'Siswa'
  }
  if (roleLower === 'ketua yayasan') {
    return UserRole.FOUNDATION_HEAD; // Maps 'ketua yayasan' to 'Kepala Yayasan'
  }

  // Handle current role names (case-insensitive matching)
  const roleEntry = Object.entries(UserRole).find(
    ([, value]) => value.toLowerCase() === roleLower
  );
  
  if (roleEntry) {
    return roleEntry[1] as UserRole;
  }

  // If no match found, log warning and return as-is (will likely cause issues)
  console.warn(`Unknown role from database: "${dbRole}". Available roles:`, Object.values(UserRole));
  return dbRole as UserRole;
};

export default toUserRoleEnum;

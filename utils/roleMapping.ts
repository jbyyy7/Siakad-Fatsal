import { UserRole } from '../types';

export const toUserRoleEnum = (dbRole: any): UserRole => {
  const roleString = String(dbRole || '').trim();

  // Exact match first (case-sensitive)
  if (roleString === 'Admin') return UserRole.ADMIN;
  if (roleString === 'Guru') return UserRole.TEACHER;
  if (roleString === 'Kepala Sekolah') return UserRole.PRINCIPAL;
  if (roleString === 'Siswa') return UserRole.STUDENT;
  if (roleString === 'Kepala Yayasan') return UserRole.FOUNDATION_HEAD;
  if (roleString === 'Staff') return UserRole.STAFF;

  // Legacy support (case-insensitive)
  const roleLower = roleString.toLowerCase();
  if (roleLower === 'murid') return UserRole.STUDENT;
  if (roleLower === 'ketua yayasan' || roleLower === 'yayasan') return UserRole.FOUNDATION_HEAD;
  if (roleLower === 'admin') return UserRole.ADMIN;
  if (roleLower === 'guru') return UserRole.TEACHER;
  if (roleLower === 'kepala sekolah') return UserRole.PRINCIPAL;
  if (roleLower === 'siswa') return UserRole.STUDENT;
  if (roleLower === 'staff') return UserRole.STAFF;

  // Log warning if no match found
  console.error('❌ UNKNOWN ROLE:', {
    receivedRole: dbRole,
    receivedType: typeof dbRole,
    availableRoles: Object.values(UserRole)
  });

  // Default to STUDENT as fallback (better than undefined)
  console.warn('⚠️ Defaulting to STUDENT role due to unknown role:', dbRole);
  return UserRole.STUDENT;
};

export default toUserRoleEnum;


import { supabase } from './supabaseClient';
import { 
  User, UserRole, School, Announcement, Subject, Class, 
  AttendanceRecord, AttendanceStatus, GamificationProfile, TeachingJournal, JournalEntry, Grade
} from '../types';
import { toUserRoleEnum } from '../utils/roleMapping';

// Re-export supabase for direct access
export { supabase } from './supabaseClient';


// Helper to convert snake_case from DB to camelCase for app
const mapUserFromDb = (dbUser: any): User => ({
    id: dbUser.id,
    email: dbUser.email,
    identityNumber: dbUser.identity_number,
    name: dbUser.full_name,
    role: toUserRoleEnum(dbUser.role),
    avatarUrl: dbUser.avatar_url,
    schoolId: dbUser.school_id,
    schoolName: dbUser.school?.name || undefined,
    placeOfBirth: dbUser.place_of_birth,
    dateOfBirth: dbUser.date_of_birth,
    gender: dbUser.gender,
    religion: dbUser.religion,
    address: dbUser.address,
    phoneNumber: dbUser.phone_number,
    parentName: dbUser.parent_name,
    parentPhoneNumber: dbUser.parent_phone_number,
});

// Helper to convert camelCase from app to snake_case for DB
const mapUserToDb = (appUser: any) => ({
    full_name: appUser.name,
    identity_number: appUser.identityNumber,
    role: appUser.role,
    school_id: appUser.schoolId || null,
    avatar_url: appUser.avatarUrl,
    place_of_birth: appUser.placeOfBirth,
    date_of_birth: appUser.dateOfBirth,
    gender: appUser.gender,
    religion: appUser.religion,
    address: appUser.address,
    phone_number: appUser.phoneNumber,
    parent_name: appUser.parentName,
    parent_phone_number: appUser.parentPhoneNumber,
});


const getGradeLetter = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    return 'D';
};


export const dataService = {
  // USER MANAGEMENT
  async getUsers(filters?: { role?: UserRole; schoolId?: string }): Promise<User[]> {
    let query = supabase.from('profiles').select('*, school:schools(name)');
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data.map(mapUserFromDb);
  },

  async createUser(userData: any): Promise<void> {
    // This is a two-step process: create auth user, then create profile.
    // In production, this should be a single transaction using a database function (RPC) for atomicity.
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error("Gagal membuat pengguna otentikasi.");

    const profileData = mapUserToDb(userData);
    
    const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        ...profileData
    });
    
    if (profileError) {
        // Attempt to clean up the created auth user if profile creation fails
        // This requires admin privileges and should ideally be an RPC call.
        console.error("Gagal membuat profil, pengguna auth mungkin yatim piatu:", profileError);
        throw profileError;
    }
  },

  async updateUser(userId: string, userData: any): Promise<void> {
    const dbData = mapUserToDb(userData);
    // Remove fields that shouldn't be updated this way
    delete (dbData as any).role;
    
    const { error } = await supabase.from('profiles').update(dbData).eq('id', userId);
    if (error) throw error;
  },
  
  async deleteUser(userId: string): Promise<void> {
    // Deleting a user requires deleting from both auth.users and public.profiles.
    // This MUST be done via a server-side RPC function with elevated privileges.
    // The function below (`delete_user`) needs to be created in your Supabase SQL Editor.
    const { error } = await supabase.rpc('delete_user', { user_id: userId });
    if (error) {
        console.error("Pastikan Anda telah membuat fungsi 'delete_user' di Supabase SQL Editor.", error);
        throw error;
    }
  },

  // SCHOOL MANAGEMENT
  async getSchools(): Promise<School[]> {
    const { data, error } = await supabase.from('schools').select('*');
    if (error) throw error;
    return data;
  },
  async getSchoolCount(): Promise<number> { 
      const { count, error } = await supabase.from('schools').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
  },
  async createSchool(schoolData: Omit<School, 'id'>): Promise<void> {
      const { error } = await supabase.from('schools').insert(schoolData);
      if (error) throw error;
  },
  async updateSchool(schoolId: string, schoolData: Omit<School, 'id'>): Promise<void> {
      const { error } = await supabase.from('schools').update(schoolData).eq('id', schoolId);
      if (error) throw error;
  },
  async deleteSchool(schoolId: string): Promise<void> {
      const { error } = await supabase.from('schools').delete().eq('id', schoolId);
      if (error) throw error;
  },

  // ANNOUNCEMENTS
  async getAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase.from('announcements').select('*, author:profiles(full_name), school:schools(name)').order('date', { ascending: false });
    if (error) throw error;
    return data.map(a => ({
        ...a,
        author: a.author.full_name,
        schoolName: a.school?.name,
    }));
  },
  async createAnnouncement(data: any): Promise<void> {
      const { error } = await supabase.from('announcements').insert(data);
      if (error) throw error;
  },
  async updateAnnouncement(id: string, data: any): Promise<void> {
      const { error } = await supabase.from('announcements').update(data).eq('id', id);
      if (error) throw error;
  },
  async deleteAnnouncement(id: string): Promise<void> {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
  },

  // STUDENT DATA
  async getGradesForStudent(studentId: string): Promise<{ subject: string; score: number; grade: string; }[]> {
    const { data, error } = await supabase.from('grades').select('score, subject:subjects(name)').eq('student_id', studentId);
    if (error) throw error;
    // Supabase may return joined relation as an array or an object depending on query.
    const getSubjectName = (subjectField: any) => Array.isArray(subjectField) ? subjectField[0]?.name : subjectField?.name;
    return data.map((g: any) => ({
        score: g.score,
        subject: getSubjectName(g.subject) ?? 'Unknown',
        grade: getGradeLetter(g.score),
    }));
  },
  async getAttendanceForStudent(studentId: string): Promise<{ date: string; status: AttendanceStatus }[]> {
      const { data, error } = await supabase.from('attendances').select('date, status').eq('student_id', studentId);
      if (error) throw error;
      return data;
  },

  async getAttendanceSummaryForStudent(studentId: string): Promise<{ hadir: number; sakit: number; izin: number; alpha: number }> {
      const { data, error } = await supabase
          .from('attendances')
          .select('status')
          .eq('student_id', studentId);
      
      if (error) throw error;

      const summary = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
      
      data.forEach((record: any) => {
          const status = record.status.toLowerCase();
          if (status === 'hadir') summary.hadir++;
          else if (status === 'sakit') summary.sakit++;
          else if (status === 'izin') summary.izin++;
          else if (status === 'alpha') summary.alpha++;
      });

      return summary;
  },
  async getTeacherNoteForStudent(studentId: string): Promise<{ note: string; teacherName: string; }> {
      // This is a placeholder as the table structure is not defined.
      return { note: 'Ananda menunjukkan perkembangan yang sangat baik semester ini. Terus tingkatkan!', teacherName: 'Dewi Lestari, S.Pd.' };
  },
  async getClassForStudent(studentId: string): Promise<string | null> { 
    const { data, error } = await supabase.from('class_members').select('class:classes(name)').eq('student_id', studentId).single();
    if (error || !data) return null;
    const classField = (data as any).class;
    const className = Array.isArray(classField) ? classField[0]?.name : classField?.name;
    return className ?? null;
  },

  // GAMIFICATION (MOCK)
  async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
      return { studentId, progress: { 'Matematika': 85, 'Fisika': 92, 'Bahasa': 88 }, badges: [{id: '1', icon: '🏆', description: 'Juara Kelas'}] };
  },
  
  // TEACHER DATA
   async getClasses(filters?: { teacherId?: string, schoolId?: string }): Promise<Class[]> {
  let query = supabase.from('classes').select('*, school:schools(name), homeroom_teacher:profiles(full_name)');
  if (filters?.teacherId) {
    query = query.eq('homeroom_teacher_id', filters.teacherId);
  }
  if (filters?.schoolId) {
    query = query.eq('school_id', filters.schoolId);
  }
  const { data, error } = await query;
  if (error) {
    console.error('[Supabase][getClasses] Error:', error);
    throw error;
  }
  if (!data) {
    console.error('[Supabase][getClasses] Data is null or undefined');
    throw new Error('Data kelas tidak ditemukan');
  }
  return data.map(c => ({
    ...c,
    schoolName: c.school?.name,
    homeroomTeacherName: c.homeroom_teacher?.full_name,
  }));
  },
  async getSubjects(filters?: { schoolId?: string }): Promise<Subject[]> {
      let query = supabase.from('subjects').select('*, school:schools(name)');
      if (filters?.schoolId) {
        query = query.eq('school_id', filters.schoolId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data.map(s => ({
          ...s,
          schoolId: s.school_id,
          schoolName: s.school.name
      }));
  },
  async getSemesters(filters?: { schoolId?: string }): Promise<any[]> {
    let query = supabase.from('semesters').select('*').order('start_date', { ascending: false });
    if (filters?.schoolId) query = query.eq('school_id', filters.schoolId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  async getStudentsInClass(classId: string): Promise<User[]> {
      const { data, error } = await supabase.from('class_members').select('student:profiles(*, school:schools(name))').eq('class_id', classId);
      if (error) throw error;
      return data.map(m => mapUserFromDb(m.student));
  },
  async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
      // Mock, needs real implementation
      return [{ subject: 'Matematika', class: 'MA Kelas 10-A', topic: 'Aljabar Linear' }];
  },
  async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> { return []; },
  async createTeachingJournal(data: any): Promise<void> { console.log("Mock create journal", data); },
  async updateTeachingJournal(id: number, data: any): Promise<void> { console.log("Mock update journal", id, data); },
  async deleteTeachingJournal(id: number): Promise<void> { console.log("Mock delete journal", id); },

  // ATTENDANCE
  async getAttendanceForDate(classId: string, subjectId: string, date: string): Promise<AttendanceRecord[]> { 
    const { data, error } = await supabase.from('attendances').select('*').eq('class_id', classId).eq('subject_id', subjectId).eq('date', date);
    if (error) throw error;
    return data;
  },
  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    const { error } = await supabase.from('attendances').upsert(records, { onConflict: 'date,student_id,class_id,subject_id' });
    if (error) throw error;
  },

  // CLASS & SUBJECT MANAGEMENT
  async getClassMemberships(schoolId: string): Promise<{ student_id: string, class_id: string }[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('id, class_members(student_id)')
      .eq('school_id', schoolId);
  
    if (error) throw error;
  
    const memberships = data.flatMap(c =>
      (c.class_members || []).map((cm: any) => ({ student_id: cm.student_id, class_id: c.id }))
    );
    return memberships;
  },
  async createSubject(data: { name: string, schoolId: string }): Promise<void> { 
    const { error } = await supabase.from('subjects').insert({ name: data.name, school_id: data.schoolId });
    if (error) throw error;
  },
  async updateSubject(id: string, data: { name: string, schoolId: string }): Promise<void> { 
    const { error } = await supabase.from('subjects').update({ name: data.name, school_id: data.schoolId }).eq('id', id);
    if (error) throw error;
  },
  async deleteSubject(id: string): Promise<void> { 
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
  },
  async createClass(data: any): Promise<void> { 
  const { studentIds, ...classData } = data;
  const { data: newClass, error } = await supabase.from('classes').insert({
    name: classData.name,
    school_id: classData.schoolId,
    homeroom_teacher_id: classData.homeroomTeacherId || null
  }).select().single();
  if (error) {
    console.error('[Supabase][createClass] Error:', error);
    throw error;
  }
  if (!newClass) {
    console.error('[Supabase][createClass] Inserted class is null or undefined');
    throw new Error('Kelas gagal dibuat');
  }
  if (studentIds && studentIds.length > 0) {
    const members = studentIds.map((sid: string) => ({ class_id: newClass.id, student_id: sid }));
    const { error: memberError } = await supabase.from('class_members').insert(members);
    if (memberError) {
      console.error('[Supabase][createClass] Error inserting class_members:', memberError);
      throw memberError;
    }
  }
  },
  async updateClass(id: string, data: any): Promise<void> { 
    const { studentIds, ...classData } = data;
    const { error } = await supabase.from('classes').update({
        name: classData.name,
        school_id: classData.schoolId,
        homeroom_teacher_id: classData.homeroomTeacherId || null
    }).eq('id', id);
    if (error) throw error;

    const { error: deleteError } = await supabase.from('class_members').delete().eq('class_id', id);
    if (deleteError) throw deleteError;

    if (studentIds && studentIds.length > 0) {
        const members = studentIds.map((sid: string) => ({ class_id: id, student_id: sid }));
        const { error: memberError } = await supabase.from('class_members').insert(members);
        if (memberError) throw memberError;
    }
  },
  async deleteClass(id: string): Promise<void> { 
    // Assuming ON DELETE CASCADE is set for class_members foreign key
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) throw error;
  },

  // ADMIN REPORTS
  async getAttendanceForAdmin(filters: { date: string, schoolId?: string, classId?: string }): Promise<AttendanceRecord[]> {
    let query = supabase.from('attendances').select('*, student:profiles(full_name), teacher:profiles(full_name), class:classes(name, school_id)')
        .eq('date', filters.date);

    if (filters.classId) {
        query = query.eq('class_id', filters.classId);
    } else if (filters.schoolId) {
        // Filter by school if no specific class is selected
        query = query.eq('class.school_id', filters.schoolId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data.map(rec => ({
        ...rec,
        studentName: rec.student.full_name,
        teacherName: rec.teacher.full_name,
    }));
  },
  
  async getGradesForAdmin(filters: { schoolId?: string, classId?: string, subjectId?: string }): Promise<Grade[]> {
    let query = supabase.from('grades').select('*, student:profiles(full_name)');
    
    if (filters.classId) {
        query = query.eq('class_id', filters.classId);
    }
    if (filters.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
    }
    // Cannot directly filter by schoolId from grades, need a join or different query structure.
    // This simple query assumes classId is provided for school context.

    const { data, error } = await query;
    if (error) throw error;
    return data.map(g => ({ ...g, studentName: g.student.full_name }));
  },

  async saveGradesForStudents(grades: Grade[]): Promise<void> {
    const recordsToSave = grades.map(({ studentName, ...rest }) => rest);
    const { error } = await supabase.from('grades').upsert(recordsToSave, { onConflict: 'student_id,class_id,subject_id'});
    if (error) throw error;
  },

  async saveGrades(grades: any[]): Promise<void> {
    // Alias for saveGradesForStudents - accepts any grade record format
    const { error } = await supabase.from('grades').upsert(grades, { onConflict: 'student_id,subject_id'});
    if (error) throw error;
  },

  async updateAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
     const recordsToSave = records.map(({ studentName, teacherName, ...rest }) => rest);
     const { error } = await supabase.from('attendances').upsert(recordsToSave, { onConflict: 'date,student_id,class_id,subject_id' });
     if (error) throw error;
  },

  // REPORTS (MOCK)
  async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
    return [{ school: 'MA Fathus Salafi', 'Rata-rata Nilai': 88.5 }];
  },
  async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string; avg: number; }[]> {
      return [{ subject: 'Matematika', avg: 85 }, { subject: 'Fisika', avg: 92 }];
  },
  async getAttendanceTrend(schoolId: string): Promise<{ month: string; percentage: number; }[]> {
      return [{ month: 'Juli', percentage: 98 }, { month: 'Agustus', percentage: 99 }];
  },

  // SCHEDULE (MOCK)
  async getClassSchedule(className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
    return {
        'Senin': [{ time: '07:30 - 09:00', subject: 'Matematika' }, { time: '10:00 - 11:30', subject: 'Bahasa Indonesia'}],
        'Selasa': [{ time: '07:30 - 09:00', subject: 'Fisika' }],
    };
  }
};
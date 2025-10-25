import { supabase } from './supabaseClient';
import { 
  User, UserRole, School, Announcement, Subject, Class, 
  AttendanceRecord, AttendanceStatus, GamificationProfile, TeachingJournal, JournalEntry, Grade,
  TeacherAttendanceRecord
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
    identity_number: appUser.identityNumber || null,
    role: appUser.role,
    school_id: appUser.schoolId || null,
    avatar_url: appUser.avatarUrl || null,
    place_of_birth: appUser.placeOfBirth || null,
    date_of_birth: appUser.dateOfBirth || null, // Convert empty string to null
    gender: appUser.gender || null,
    religion: appUser.religion || null,
    address: appUser.address || null,
    phone_number: appUser.phoneNumber || null,
    parent_name: appUser.parentName || null,
    parent_phone_number: appUser.parentPhoneNumber || null,
});

// Helper to convert camelCase School from app to snake_case for DB
const mapSchoolToDb = (appSchool: any) => ({
    name: appSchool.name,
    level: appSchool.level,
    address: appSchool.address || null,
    latitude: appSchool.latitude || null,
    longitude: appSchool.longitude || null,
    location_name: appSchool.locationName || null,
    radius: appSchool.radius || null,
    location_attendance_enabled: appSchool.locationAttendanceEnabled || false,
    // Gate attendance fields
    gate_attendance_enabled: appSchool.gateAttendanceEnabled || false,
    gate_qr_enabled: appSchool.gateQREnabled !== false, // default true
    gate_face_enabled: appSchool.gateFaceEnabled || false,
    gate_manual_enabled: appSchool.gateManualEnabled !== false, // default true
    gate_check_in_start: appSchool.gateCheckInStart || '05:00:00',
    gate_check_in_end: appSchool.gateCheckInEnd || '23:59:59',
    gate_late_threshold: appSchool.gateLateThreshold || '07:30:00',
    gate_check_out_start: appSchool.gateCheckOutStart || '05:00:00',
    gate_check_out_end: appSchool.gateCheckOutEnd || '23:59:59',
    gate_notify_parents: appSchool.gateNotifyParents !== false, // default true
    gate_notify_on_late: appSchool.gateNotifyOnLate !== false, // default true
});

// Helper to convert snake_case School from DB to camelCase for app
const mapSchoolFromDb = (dbSchool: any): School => ({
    id: dbSchool.id,
    name: dbSchool.name,
    level: dbSchool.level,
    address: dbSchool.address,
    latitude: dbSchool.latitude,
    longitude: dbSchool.longitude,
    locationName: dbSchool.location_name,
    radius: dbSchool.radius,
    locationAttendanceEnabled: dbSchool.location_attendance_enabled,
    // Gate attendance fields
    gateAttendanceEnabled: dbSchool.gate_attendance_enabled,
    gateQREnabled: dbSchool.gate_qr_enabled,
    gateFaceEnabled: dbSchool.gate_face_enabled,
    gateManualEnabled: dbSchool.gate_manual_enabled,
    gateCheckInStart: dbSchool.gate_check_in_start,
    gateCheckInEnd: dbSchool.gate_check_in_end,
    gateLateThreshold: dbSchool.gate_late_threshold,
    gateCheckOutStart: dbSchool.gate_check_out_start,
    gateCheckOutEnd: dbSchool.gate_check_out_end,
    gateNotifyParents: dbSchool.gate_notify_parents,
    gateNotifyOnLate: dbSchool.gate_notify_on_late,
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
      console.log('🔍 Filtering users by role:', filters.role);
      query = query.eq('role', filters.role);
    }
    if (filters?.schoolId) {
      console.log('🔍 Filtering users by schoolId:', filters.schoolId);
      query = query.eq('school_id', filters.schoolId);
    }
    const { data, error } = await query;
    if (error) {
      console.error('❌ getUsers error:', error);
      throw error;
    }
    console.log(`✅ getUsers returned ${data?.length || 0} users`);
    return data.map(mapUserFromDb);
  },

  async createUser(userData: any): Promise<void> {
    // DEVELOPMENT MODE: Use a workaround for custom email domains
    // Replace .sch.id with .com temporarily for auth, but keep original in profile
    const originalEmail = userData.email;
    const isCustomDomain = originalEmail.includes('.sch.id');
    const authEmail = isCustomDomain 
      ? originalEmail.replace('.sch.id', '.com')
      : originalEmail;

    // Create auth user with modified email
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: userData.password,
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error("Gagal membuat pengguna otentikasi.");

    const profileData = mapUserToDb(userData);
    
    // Insert profile with ORIGINAL email
    const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: originalEmail, // Use original email in profile
        ...profileData
    });
    
    if (profileError) {
        console.error("Gagal membuat profil:", profileError);
        throw profileError;
    }
  },

  async updateUser(userId: string, userData: any): Promise<void> {
    const dbData = mapUserToDb(userData);
    // Keep role field for updates (Admin can change user roles)
    // Remove email as it's stored separately in auth
    delete (dbData as any).email;
    
    const { error } = await supabase.from('profiles').update(dbData).eq('id', userId);
    if (error) throw error;
  },
  
  async deleteUser(userId: string): Promise<void> {
    // Deleting a user requires deleting from both auth.users and public.profiles.
    // This MUST be done via a server-side RPC function with elevated privileges.
    // The function below (`delete_user`) needs to be created in your Supabase SQL Editor.
    const { error } = await supabase.rpc('delete_user', { uid: userId });
    if (error) {
        console.error("Pastikan Anda telah membuat fungsi 'delete_user' di Supabase SQL Editor.", error);
        throw error;
    }
  },

  // SCHOOL MANAGEMENT
  async getSchools(): Promise<School[]> {
    const { data, error } = await supabase.from('schools').select('*');
    if (error) throw error;
    return data.map(mapSchoolFromDb);
  },
  async getSchoolCount(): Promise<number> { 
      const { count, error } = await supabase.from('schools').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
  },
  async createSchool(schoolData: Omit<School, 'id'>): Promise<void> {
      const dbSchool = mapSchoolToDb(schoolData);
      const { error } = await supabase.from('schools').insert(dbSchool);
      if (error) throw error;
  },
  async updateSchool(schoolId: string, schoolData: Omit<School, 'id'>): Promise<void> {
      const dbSchool = mapSchoolToDb(schoolData);
      const { error } = await supabase.from('schools').update(dbSchool).eq('id', schoolId);
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

  // NOTIFICATIONS
  async getUnreadNotificationsCount(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_unread_notifications_count');
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  async markNotificationAsRead(announcementId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('mark_notification_read', { p_announcement_id: announcementId });
      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllNotificationsAsRead(announcementIds: string[]): Promise<void> {
    try {
      // Mark multiple notifications as read
      for (const id of announcementIds) {
        await this.markNotificationAsRead(id);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  async getUnreadAnnouncements(): Promise<Announcement[]> {
    try {
      // Get all announcements
      const { data: announcements, error: announcementsError } = await supabase
        .from('announcements')
        .select('*, author:profiles(full_name), school:schools(name)')
        .order('date', { ascending: false })
        .limit(10);
      
      if (announcementsError) throw announcementsError;

      // Get user's read notifications
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: readNotifications, error: readError } = await supabase
        .from('user_notifications')
        .select('announcement_id')
        .eq('user_id', user.id)
        .eq('is_read', true);
      
      if (readError) throw readError;

      const readIds = new Set(readNotifications?.map(n => n.announcement_id) || []);
      
      // Filter out read announcements
      return announcements
        .filter(a => !readIds.has(a.id))
        .map(a => ({
          ...a,
          author: a.author?.full_name || 'System',
          schoolName: a.school?.name,
        }));
    } catch (error) {
      console.error('Error getting unread announcements:', error);
      return [];
    }
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

  async getDetailedGradesForStudent(studentId: string, semester?: string): Promise<any[]> {
    let query = supabase
      .from('grades')
      .select(`
        *,
        subject:subjects(id, name),
        class:classes(name)
      `)
      .eq('student_id', studentId);
    
    if (semester) {
      query = query.eq('semester', semester);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('[Supabase][getDetailedGradesForStudent] Error:', error);
      return [];
    }

    return (data || []).map((g: any) => ({
      subject: g.subject?.name || 'Unknown',
      subject_id: g.subject?.id || '',
      score: g.score,
      final_score: g.score,
      grade_letter: getGradeLetter(g.score),
      semester: g.semester,
      notes: g.notes,
      className: g.class?.name || '',
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
    const { data, error } = await supabase.from('class_members').select('class:classes(name)').eq('profile_id', studentId).eq('role', 'student').single();
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
  let query = supabase.from('classes').select(`
    *, 
    school:schools(name), 
    homeroom_teacher:profiles(full_name),
    class_members(profile_id, role)
  `);
  
  // Filter by school if provided
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
  
  let classes = data.map(c => {
    // Extract student IDs from class_members
    console.log(`🔍 [getClasses] Processing class: ${c.name}`);
    console.log(`📊 [getClasses] class_members data:`, c.class_members);
    
    const allMembers = c.class_members || [];
    console.log(`📊 [getClasses] Total members: ${allMembers.length}`);
    
    const students = allMembers.filter((cm: any) => cm.role === 'student');
    console.log(`👥 [getClasses] Students filtered: ${students.length}`);
    console.log(`👥 [getClasses] Students data:`, students);
    
    const studentIds = students.map((cm: any) => cm.profile_id);
    console.log(`✅ [getClasses] Student IDs: ${studentIds.length}`, studentIds);
    
    return {
      id: c.id,
      name: c.name,
      schoolId: c.school_id,
      schoolName: c.school?.name,
      homeroomTeacherId: c.homeroom_teacher_id,
      homeroomTeacherName: c.homeroom_teacher?.full_name,
      academicYear: c.academic_year,
      studentIds: studentIds,
    };
  });
  
  // Filter by teacher if provided (homeroom teacher OR teaching in class_schedules)
  if (filters?.teacherId) {
    // Get class IDs where teacher teaches from class_schedules
    const { data: schedules } = await supabase
      .from('class_schedules')
      .select('class_id')
      .eq('teacher_id', filters.teacherId);
    
    const teachingClassIds = new Set(schedules?.map(s => s.class_id) || []);
    
    // Filter classes: homeroom teacher OR teaches in class_schedules
    classes = classes.filter(c => 
      c.homeroomTeacherId === filters.teacherId || 
      teachingClassIds.has(c.id)
    );
  }
  
  return classes;
  },
  
  async getScheduleForTeacher(teacherId: string, dayOfWeek: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('class_schedules')
      .select(`
        *,
        class:classes(name),
        subject:subjects(name)
      `)
      .eq('teacher_id', teacherId)
      .eq('day_of_week', dayOfWeek);
    
    if (error) {
      console.error('[Supabase][getScheduleForTeacher] Error:', error);
      return [];
    }
    
    return (data || []).map(s => ({
      id: s.id,
      time: `${s.start_time} - ${s.end_time}`,
      subject: s.subject?.name || 'Unknown Subject',
      className: s.class?.name || 'Unknown Class',
      startTime: s.start_time,
      endTime: s.end_time,
    }));
  },

  async getScheduleForStudent(studentId: string, dayOfWeek?: number): Promise<any[]> {
    // First get student's class(es)
    const { data: classMemberships, error: memberError } = await supabase
      .from('class_members')
      .select('class_id')
      .eq('profile_id', studentId)
      .eq('role', 'student');
    
    if (memberError) {
      console.error('[Supabase][getScheduleForStudent] Error fetching class memberships:', memberError);
      return [];
    }

    if (!classMemberships || classMemberships.length === 0) {
      console.warn('[Supabase][getScheduleForStudent] Student not assigned to any class');
      return [];
    }

    const classIds = classMemberships.map(cm => cm.class_id);

    // Get schedules for the student's classes
    let query = supabase
      .from('class_schedules')
      .select(`
        *,
        class:classes(name),
        subject:subjects(name),
        teacher:profiles!class_schedules_teacher_id_fkey(full_name)
      `)
      .in('class_id', classIds);
    
    // Filter by day if provided
    if (dayOfWeek !== undefined) {
      query = query.eq('day_of_week', dayOfWeek);
    }

    query = query.order('day_of_week', { ascending: true })
                 .order('start_time', { ascending: true });

    const { data, error } = await query;
    
    if (error) {
      console.error('[Supabase][getScheduleForStudent] Error fetching schedules:', error);
      return [];
    }
    
    return (data || []).map(s => ({
      id: s.id,
      dayOfWeek: s.day_of_week,
      startTime: s.start_time,
      endTime: s.end_time,
      time: `${s.start_time} - ${s.end_time}`,
      subject: s.subject?.name || 'Unknown Subject',
      subjectName: s.subject?.name || 'Unknown Subject',
      teacher: s.teacher?.full_name || 'Unknown Teacher',
      teacherName: s.teacher?.full_name || 'Unknown Teacher',
      className: s.class?.name || 'Unknown Class',
      room: s.room || '',
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
      console.log('🔍 [getStudentsInClass] Fetching students for class:', classId);
      
      const { data, error } = await supabase
        .from('class_members')
        .select('profile:profiles(*, school:schools(name))')
        .eq('class_id', classId)
        .eq('role', 'student');
      
      if (error) {
        console.error('❌ [getStudentsInClass] Error:', error);
        throw error;
      }
      
      console.log('📊 [getStudentsInClass] Raw data:', data);
      console.log('📊 [getStudentsInClass] Count:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.warn('⚠️ [getStudentsInClass] No students found for class:', classId);
        return [];
      }
      
      const students = data.map(m => {
        console.log('👤 [getStudentsInClass] Mapping profile:', m.profile);
        return mapUserFromDb(m.profile);
      });
      
      console.log('✅ [getStudentsInClass] Returning', students.length, 'students');
      return students;
  },
  async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
      const { data, error } = await supabase
        .from('teaching_journals')
        .select(`
          *,
          class:classes(name),
          subject:subjects(name)
        `)
        .eq('teacher_id', teacherId)
        .eq('date', date);
      
      if (error) {
        console.error('[Supabase][getJournalForTeacher] Error:', error);
        return [];
      }
      
      return (data || []).map(j => ({
        subject: j.subject?.name || 'Unknown Subject',
        class: j.class?.name || 'Unknown Class',
        topic: j.topic || j.description || 'No topic',
      }));
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
      .select('id, class_members(profile_id)')
      .eq('school_id', schoolId);
  
    if (error) throw error;
  
    const memberships = data.flatMap(c =>
      (c.class_members || []).map((cm: any) => ({ student_id: cm.profile_id, class_id: c.id }))
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
    homeroom_teacher_id: classData.homeroomTeacherId || null,
    academic_year: classData.academicYear
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
    const members = studentIds.map((sid: string) => ({ 
      class_id: newClass.id, 
      profile_id: sid,
      role: 'student'
    }));
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
        homeroom_teacher_id: classData.homeroomTeacherId || null,
        academic_year: classData.academicYear
    }).eq('id', id);
    if (error) throw error;

    const { error: deleteError } = await supabase.from('class_members').delete().eq('class_id', id);
    if (deleteError) throw deleteError;

    if (studentIds && studentIds.length > 0) {
        const members = studentIds.map((sid: string) => ({ 
          class_id: id, 
          profile_id: sid,
          role: 'student'
        }));
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
  },

  // TEACHER ATTENDANCE
  async getTeacherAttendance(filters?: { teacherId?: string; schoolId?: string; date?: string }): Promise<TeacherAttendanceRecord[]> {
    let query = supabase.from('teacher_attendance').select('*, teacher:profiles(full_name)');
    if (filters?.teacherId) {
      query = query.eq('teacher_id', filters.teacherId);
    }
    if (filters?.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    }
    if (filters?.date) {
      query = query.eq('date', filters.date);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(a => ({
      ...a,
      teacherName: Array.isArray(a.teacher) ? a.teacher[0]?.full_name : a.teacher?.full_name,
    }));
  },

  async createTeacherAttendance(attendance: Omit<TeacherAttendanceRecord, 'id'>): Promise<void> {
    const { error } = await supabase.from('teacher_attendance').insert(attendance);
    if (error) throw error;
  },

  async updateTeacherAttendance(id: number, updates: Partial<TeacherAttendanceRecord>): Promise<void> {
    const { error } = await supabase.from('teacher_attendance').update(updates).eq('id', id);
    if (error) throw error;
  },

  // CLASS SCHEDULES MANAGEMENT
  async createSchedule(schedule: {
    class_id: string;
    subject_id: string;
    teacher_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room?: string;
  }): Promise<void> {
    const { error } = await supabase.from('class_schedules').insert(schedule);
    if (error) throw error;
  },

  async updateSchedule(id: string, updates: {
    class_id?: string;
    subject_id?: string;
    teacher_id?: string;
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
    room?: string;
  }): Promise<void> {
    const { error } = await supabase.from('class_schedules').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase.from('class_schedules').delete().eq('id', id);
    if (error) throw error;
  },
};

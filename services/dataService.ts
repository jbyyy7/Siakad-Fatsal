
import { supabase } from './supabaseClient';
import { User, School, UserRole, Class, Subject, Announcement, AttendanceRecord, GamificationProfile, TeachingJournal, JournalEntry, AttendanceStatus } from '../types';

// This data service contains a mix of real Supabase calls and mock data for demonstration.
// In a real application, all functions would interact with the Supabase API.

const toUser = (profile: any, schoolName?: string): User => ({
  id: profile.id,
  email: profile.email || 'not-in-profile@email.com',
  identityNumber: profile.identity_number,
  name: profile.full_name,
  role: profile.role,
  avatarUrl: profile.avatar_url,
  schoolId: profile.school_id,
  schoolName: schoolName,
});

export const dataService = {
  // USER MANAGEMENT
  async getUsers(filters?: { role?: UserRole, schoolId?: string }): Promise<User[]> {
      let query = supabase.from('profiles').select(`
        id,
        identity_number,
        full_name,
        role,
        avatar_url,
        school_id,
        schools ( name )
      `);

      if (filters?.role) {
        //FIX: Correctly map the UserRole enum value to the lowercase database value.
        const roleString = Object.entries(UserRole).find(([, val]) => val === filters.role)?.[1].toLowerCase();
        if (roleString) {
          query = query.eq('role', roleString);
        }
      }
      if (filters?.schoolId) {
        query = query.eq('school_id', filters.schoolId);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      return data.map((p: any) => ({
        id: p.id,
        name: p.full_name,
        email: 'loaded@from.db', // Not available in profiles view, would need join on auth.users
        identityNumber: p.identity_number,
        role: Object.values(UserRole).find(val => val.toLowerCase() === p.role.toLowerCase()) || p.role,
        avatarUrl: p.avatar_url,
        schoolId: p.school_id,
        schoolName: p.schools?.name
      }));
  },
  async createUser(userData: any): Promise<any> {
    const { data, error } = await supabase.rpc('create_new_user', {
      p_email: userData.email,
      p_password: userData.password,
      p_full_name: userData.name,
      p_identity_number: userData.identityNumber,
      // FIX: Ensure role is sent in lowercase as expected by the database.
      p_role: userData.role.toLowerCase(),
      p_school_id: userData.schoolId || null,
      p_avatar_url: userData.avatarUrl,
    });
    if (error) throw error;
    return data;
  },
  async updateUser(userId: string, userData: Partial<User>): Promise<any> {
     const updateData: any = {};
     if (userData.name) updateData.full_name = userData.name;
     if (userData.identityNumber) updateData.identity_number = userData.identityNumber;
     if (userData.role) updateData.role = userData.role.toLowerCase();
     if (userData.schoolId !== undefined) updateData.school_id = userData.schoolId;

     const { data, error } = await supabase.from('profiles').update(updateData).eq('id', userId);
     if (error) throw error;
     return data;
  },
  async deleteUser(userId: string): Promise<any> {
    const { data, error } = await supabase.rpc('delete_user_by_id', { user_id_to_delete: userId });
    if (error) throw error;
    return data;
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
    return count || 0;
  },
  async createSchool(schoolData: Omit<School, 'id'>): Promise<any> {
    const { data, error } = await supabase.from('schools').insert([schoolData]).select();
    if (error) throw error;
    return data;
  },
  async updateSchool(schoolId: string, schoolData: Partial<School>): Promise<any> {
    const { data, error } = await supabase.from('schools').update(schoolData).eq('id', schoolId);
    if (error) throw error;
    return data;
  },
  async deleteSchool(schoolId: string): Promise<any> {
    const { data, error } = await supabase.from('schools').delete().eq('id', schoolId);
    if (error) throw error;
    return data;
  },

  // SUBJECT MANAGEMENT
  async getSubjects(filters?: { schoolId?: string }): Promise<Subject[]> {
    let query = supabase.from('subjects').select('*');
    if (filters?.schoolId) {
      query = query.eq('school_id', filters.schoolId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data.map(s => ({ id: s.id, name: s.name, schoolId: s.school_id }));
  },
  async createSubject(subjectData: { name: string; schoolId: string }): Promise<any> {
      const { data, error } = await supabase.from('subjects').insert([{ name: subjectData.name, school_id: subjectData.schoolId }]);
      if (error) throw error;
      return data;
  },
  async updateSubject(subjectId: string, subjectData: { name: string; schoolId: string }): Promise<any> {
      const { data, error } = await supabase.from('subjects').update({ name: subjectData.name, school_id: subjectData.schoolId }).eq('id', subjectId);
      if (error) throw error;
      return data;
  },
  async deleteSubject(subjectId: string): Promise<any> {
      const { data, error } = await supabase.from('subjects').delete().eq('id', subjectId);
      if (error) throw error;
      return data;
  },

  // CLASS MANAGEMENT
  async getClasses(filters?: { teacherId?: string }): Promise<Class[]> {
    let query = supabase.from('classes_view').select('*');
    if (filters?.teacherId) {
        query = query.eq('homeroom_teacher_id', filters.teacherId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      schoolId: c.school_id,
      homeroomTeacherId: c.homeroom_teacher_id,
      homeroomTeacherName: c.homeroom_teacher_name,
    }));
  },
   async getStudentsInClass(classId: string): Promise<User[]> {
      const { data, error } = await supabase.from('class_students_view').select('*').eq('class_id', classId);
      if (error) throw error;
      return data.map(item => ({
        id: item.student_id,
        name: item.full_name,
        email: '',
        identityNumber: item.identity_number,
        role: UserRole.STUDENT,
        avatarUrl: item.avatar_url,
        schoolId: item.school_id
      }));
  },
  async createClass(classData: any): Promise<any> {
    const { data, error } = await supabase.rpc('create_class_with_students', {
      p_name: classData.name,
      p_school_id: classData.schoolId,
      p_homeroom_teacher_id: classData.homeroomTeacherId || null,
      p_student_ids: classData.studentIds
    });
    if (error) throw error;
    return data;
  },
  async updateClass(classId: string, classData: any): Promise<any> {
    const { data, error } = await supabase.rpc('update_class_with_students', {
      p_class_id: classId,
      p_name: classData.name,
      p_school_id: classData.schoolId,
      p_homeroom_teacher_id: classData.homeroomTeacherId || null,
      p_student_ids: classData.studentIds
    });
    if (error) throw error;
    return data;
  },
  async deleteClass(classId: string): Promise<any> {
    const { data, error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) throw error;
    return data;
  },

  // ANNOUNCEMENTS
  async getAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase.from('announcements_view').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data;
  },
  async createAnnouncement(announcementData: any): Promise<any> {
    const { data, error } = await supabase.from('announcements').insert([announcementData]);
    if (error) throw error;
    return data;
  },
  async updateAnnouncement(id: string, announcementData: any): Promise<any> {
    const { data, error } = await supabase.from('announcements').update(announcementData).eq('id', id);
    if (error) throw error;
    return data;
  },
  async deleteAnnouncement(id: string): Promise<any> {
    const { data, error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    return data;
  },

  // STUDENT-FACING DATA (MOCKS)
  async getGradesForStudent(studentId: string): Promise<{ subject: string, score: number, grade: string }[]> {
    console.log("Fetching grades for", studentId)
    return Promise.resolve([
        { subject: 'Matematika', score: 85, grade: 'A-' },
        { subject: 'Bahasa Indonesia', score: 92, grade: 'A' },
        { subject: 'Fisika', score: 78, grade: 'B+' },
        { subject: 'Kimia', score: 81, grade: 'B+' },
    ]);
  },
  async getAttendanceForStudent(studentId: string): Promise<{ date: string, status: AttendanceStatus }[]> {
     console.log("Fetching attendance for", studentId);
     const today = new Date();
     const year = today.getFullYear();
     const month = (today.getMonth() + 1).toString().padStart(2, '0');
     // Mock data for demo
     return Promise.resolve([
        { date: `${year}-${month}-01`, status: 'Hadir' },
        { date: `${year}-${month}-02`, status: 'Hadir' },
        { date: `${year}-${month}-03`, status: 'Sakit' },
        { date: `${year}-${month}-04`, status: 'Hadir' },
        { date: `${year}-${month}-05`, status: 'Hadir' },
     ]);
  },
  async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
    console.log(`Fetching journal for ${teacherId} on ${date}`);
     const { data, error } = await supabase.from('teaching_journals_view')
        .select('subject_name, class_name, topic')
        .eq('teacher_id', teacherId)
        .eq('date', date);
     if (error) throw error;
    return data.map(j => ({ subject: j.subject_name, class: j.class_name, topic: j.topic }));
  },
  async getGamificationProfile(studentId: string): Promise<GamificationProfile> {
    console.log("Fetching gamification profile for", studentId);
    return Promise.resolve({
        progress: { "Matematika": 88, "Fisika": 75, "Biologi": 95 },
        badges: [
            { id: 'b1', icon: '🏆', description: 'Juara Kelas' },
            { id: 'b2', icon: '✍️', description: 'Rajin Mengerjakan Tugas' },
            { id: 'b3', icon: '💯', description: 'Nilai Sempurna Matematika' },
        ]
    });
  },
  async getTeacherNoteForStudent(studentId: string): Promise<{ note: string, teacherName: string }> {
      console.log("Fetching note for", studentId);
      return Promise.resolve({
          note: "Ananda menunjukkan perkembangan yang sangat baik di semester ini. Tetap pertahankan semangat belajarnya dan jangan ragu bertanya jika ada kesulitan.",
          teacherName: "Budi Santoso, S.Pd."
      });
  },
  async getClassForStudent(studentId: string): Promise<string | null> {
    const { data, error } = await supabase.from('class_students_view')
        .select('class_name')
        .eq('student_id', studentId)
        .single();
    if (error || !data) {
        console.error(error);
        return null;
    }
    return data.class_name;
  },
  async getClassSchedule(className: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
      console.log(`Fetching schedule for ${className} at ${schoolId}`);
      // This is complex, so we mock it.
      return Promise.resolve({
        "Senin": [{ time: "07:30 - 09:00", subject: "Matematika" }, { time: "09:30 - 11:00", subject: "Fisika" }],
        "Selasa": [{ time: "07:30 - 09:00", subject: "Bahasa Indonesia" }, { time: "09:30 - 11:00", subject: "Kimia" }],
        "Rabu": [{ time: "07:30 - 09:00", subject: "Biologi" }, { time: "09:30 - 11:00", subject: "Sejarah" }],
        "Kamis": [{ time: "07:30 - 09:00", subject: "Pendidikan Agama" }, { time: "09:30 - 11:00", subject: "Bahasa Inggris" }],
        "Jumat": [{ time: "07:30 - 09:00", subject: "Penjaskes" }, { time: "09:30 - 11:00", subject: "Seni Budaya" }],
      });
  },
  async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
    // Mocked for simplicity
    return Promise.resolve([
        { school: 'MA Fathus Salafi', 'Rata-rata Nilai': 85.5 },
        { school: 'MTs Fathus Salafi', 'Rata-rata Nilai': 82.1 },
        { school: 'MI Fathus Salafi', 'Rata-rata Nilai': 88.3 },
    ]);
  },
  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'date, student_id, class_id, subject_id' });
    if (error) throw error;
  },
  async getAttendanceForDate(classId: string, subjectId: string, date: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase.from('attendance')
        .select('*')
        .eq('class_id', classId)
        .eq('subject_id', subjectId)
        .eq('date', date);
    if (error) throw error;
    return data;
  },
  async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string, avg: number }[]> {
      console.log("Getting avg grades for school", schoolId);
      // Mocked
      return Promise.resolve([
          { subject: 'Matematika', avg: 82 },
          { subject: 'Fisika', avg: 78 },
          { subject: 'Kimia', avg: 80 },
          { subject: 'Biologi', avg: 85 },
          { subject: 'B. Indo', avg: 88 },
      ]);
  },
  async getAttendanceTrend(schoolId: string): Promise<{ month: string, percentage: number }[]> {
      console.log("Getting attendance trend for school", schoolId);
      // Mocked
      return Promise.resolve([
          { month: 'Jan', percentage: 98 },
          { month: 'Feb', percentage: 97 },
          { month: 'Mar', percentage: 98 },
          { month: 'Apr', percentage: 96 },
          { month: 'Mei', percentage: 97 },
          { month: 'Jun', percentage: 99 },
      ]);
  },
  async createTeachingJournal(journalData: any): Promise<any> {
    const { data, error } = await supabase.from('teaching_journals').insert([
        {
            date: journalData.date,
            class_id: journalData.classId,
            subject_id: journalData.subjectId,
            topic: journalData.topic,
            teacher_id: journalData.teacherId,
        }
    ]);
    if (error) throw error;
    return data;
  },
  async updateTeachingJournal(journalId: number, journalData: any): Promise<any> {
    const { data, error } = await supabase.from('teaching_journals').update({
        date: journalData.date,
        class_id: journalData.classId,
        subject_id: journalData.subjectId,
        topic: journalData.topic,
    }).eq('id', journalId);
    if (error) throw error;
    return data;
  },
  async deleteTeachingJournal(journalId: number): Promise<any> {
    const { data, error } = await supabase.from('teaching_journals').delete().eq('id', journalId);
    if (error) throw error;
    return data;
  },
  async getTeachingJournals(teacherId: string): Promise<TeachingJournal[]> {
    const { data, error } = await supabase.from('teaching_journals_view').select('*').eq('teacher_id', teacherId);
    if (error) throw error;
    return data.map(j => ({
        id: j.id,
        date: j.date,
        classId: j.class_id,
        className: j.class_name,
        subjectId: j.subject_id,
        subjectName: j.subject_name,
        topic: j.topic,
        teacherId: j.teacher_id,
    }));
  }
};

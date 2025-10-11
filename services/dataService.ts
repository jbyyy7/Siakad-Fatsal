import { supabase } from './supabaseClient';
import { 
    User, School, UserRole, Announcement, JournalEntry, 
    Badge, GamificationProfile
} from '../types';

// Helper to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Supabase error in ${context}:`, error);
        throw new Error(`Gagal mengambil data dari server (${context}).`);
    }
};

const calculateGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
};

export const dataService = {
    // School data
    async getSchools(): Promise<School[]> {
        const { data, error } = await supabase.from('schools').select('*');
        handleSupabaseError(error, 'getSchools');
        return data || [];
    },

    async getSchoolCount(): Promise<number> {
        const { count, error } = await supabase.from('schools').select('*', { count: 'exact', head: true });
        handleSupabaseError(error, 'getSchoolCount');
        return count || 0;
    },

    // User / Profile data
    async getUsers(filters: { role?: UserRole; schoolId?: string } = {}): Promise<User[]> {
        // Step 1: Fetch all schools once to create an efficient lookup map.
        const { data: schoolsData, error: schoolsError } = await supabase.from('schools').select('id, name');
        handleSupabaseError(schoolsError, 'getUsers -> fetching schools');
        const schoolMap = new Map<string, string>(schoolsData?.map(s => [s.id, s.name]) || []);

        // Step 2: Fetch profiles without the problematic join.
        let query = supabase.from('profiles').select(`
            id,
            identity_number,
            full_name,
            role,
            avatar_url,
            school_id,
            class_level
        `);
        
        if (filters.role) {
            query = query.eq('role', filters.role);
        }
        if (filters.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }

        const { data: profiles, error: profilesError } = await query;
        handleSupabaseError(profilesError, 'getUsers -> fetching profiles');

        // Step 3: Manually "join" the school name on the client side.
        // Email is not reliably available without admin rights, so it's safer to omit it here.
        // It's primarily available on login.
        return (profiles || []).map(profile => ({
            id: profile.id,
            email: '', // Not fetching email here to avoid admin rights requirement
            identityNumber: profile.identity_number,
            name: profile.full_name,
            role: profile.role as UserRole,
            avatarUrl: profile.avatar_url,
            schoolId: profile.school_id,
            schoolName: profile.school_id ? schoolMap.get(profile.school_id) : undefined,
            level: profile.class_level,
        }));
    },
    
    async getUserCount(filters: { role?: UserRole; schoolId?: string } = {}): Promise<number> {
        let query = supabase.from('profiles').select('*', { count: 'exact', head: true });
        if (filters.role) {
            query = query.eq('role', filters.role);
        }
        if (filters.schoolId) {
            query = query.eq('school_id', filters.schoolId);
        }
        const { count, error } = await query;
        handleSupabaseError(error, 'getUserCount');
        return count || 0;
    },

    // Grades
    async getGradesForStudent(studentId: string): Promise<{ subject: string, score: number, grade: string }[]> {
        const { data, error } = await supabase
            .from('grades')
            .select(`
                score,
                subjects ( name )
            `)
            .eq('student_id', studentId);
            
        handleSupabaseError(error, 'getGradesForStudent');
        // @ts-ignore
        return data?.map(g => ({ subject: g.subjects.name, score: g.score, grade: calculateGrade(g.score) })) || [];
    },

    // Teacher Notes
    async getTeacherNoteForStudent(studentId: string): Promise<{ note: string, teacherName: string }> {
        const { data, error } = await supabase
            .from('teacher_notes')
            .select('note, teacher:profiles(full_name)')
            .eq('student_id', studentId)
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error if no note exists
            handleSupabaseError(error, 'getTeacherNoteForStudent');
        }
        
        if (!data) return { note: "Belum ada catatan dari wali kelas.", teacherName: "" };
        
        // @ts-ignore
        return { note: data.note, teacherName: data.teacher?.full_name || "Wali Kelas" };
    },

    // Attendance
    async getAttendanceForStudent(studentId: string): Promise<{ date: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' }[]> {
        const { data, error } = await supabase
            .from('attendances')
            .select('date, status')
            .eq('student_id', studentId);

        handleSupabaseError(error, 'getAttendanceForStudent');
        return data || [];
    },

    // Teacher Journal
    async getJournalForTeacher(teacherId: string, date: string): Promise<JournalEntry[]> {
        const { data, error } = await supabase
            .from('teacher_journals')
            .select('class_id, subject, topic, date')
            .eq('teacher_id', teacherId)
            .eq('date', date);
        
        handleSupabaseError(error, 'getJournalForTeacher');
        // @ts-ignore
        return data?.map(entry => ({...entry, teacherId})) || [];
    },

    // Gamification
    async getGamificationProfile(studentId: string): Promise<GamificationProfile | null> {
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('gamification_profiles')
                .select('points, level')
                .eq('student_id', studentId)
                .single();

            if (profileError && profileError.code !== 'PGRST116') { // Ignore no rows found
                handleSupabaseError(profileError, 'getGamificationProfile (profile)');
            }
            if (!profileData) return null;

            const { data: progressData, error: progressError } = await supabase
                .from('student_progress')
                .select('progress, subjects(name)')
                .eq('student_id', studentId);
            handleSupabaseError(progressError, 'getGamificationProfile (progress)');
            
            const progressMap = (progressData || []).reduce((acc: any, prog: any) => {
                if (prog.subjects) {
                   acc[prog.subjects.name] = prog.progress;
                }
                return acc;
            }, {});

            const { data: badgesData, error: badgesError } = await supabase
                .from('student_badges')
                .select('badges(id, name, description, icon)')
                .eq('student_id', studentId);
            handleSupabaseError(badgesError, 'getGamificationProfile (badges)');

            // @ts-ignore
            const badgesList = (badgesData || []).map((b: any) => b.badges).filter(Boolean);

            return {
                studentId,
                points: profileData.points,
                level: profileData.level,
                progress: progressMap,
                badges: badgesList,
            };
        } catch (e) {
            console.error("Failed to fetch gamification profile:", e);
            // Return a default or empty object to prevent dashboard crash
            return {
                studentId,
                points: 0,
                level: 1,
                progress: {},
                badges: [],
            };
        }
    },


    // Announcements
    async getAnnouncements(): Promise<Announcement[]> {
        const { data, error } = await supabase
            .from('announcements')
            .select(`*, author:profiles(full_name)`)
            .order('created_at', { ascending: false });
        
        handleSupabaseError(error, 'getAnnouncements');
        
        return data?.map(a => ({
            id: a.id,
            title: a.title,
            content: a.content,
            date: new Date(a.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
            // @ts-ignore
            author: a.author?.full_name || 'Admin'
        })) || [];
    },

    // Academic Reports
    async getSchoolPerformance(): Promise<{ school: string, 'Rata-rata Nilai': number }[]> {
         const { data, error } = await supabase.rpc('get_school_average_scores');
         handleSupabaseError(error, 'getSchoolPerformance');
         return data?.map((d: any) => ({ school: d.school_name, 'Rata-rata Nilai': d.average_score })) || [];
    },
    
    async getAverageGradesBySubject(schoolId: string): Promise<{ subject: string, avg: number }[]> {
        const { data, error } = await supabase.rpc('get_average_grades_by_subject', { p_school_id: schoolId });
        handleSupabaseError(error, 'getAverageGradesBySubject');
        return data || [];
    },

    async getAttendanceTrend(schoolId: string): Promise<{ month: string, percentage: number }[]> {
        const { data, error } = await supabase.rpc('get_monthly_attendance_percentage', { p_school_id: schoolId });
        handleSupabaseError(error, 'getAttendanceTrend');
        return data || [];
    },

    // Schedules
    async getClassSchedule(classLevel: string, schoolId: string): Promise<Record<string, {time: string, subject: string}[]>> {
        const { data, error } = await supabase
            .from('class_schedules')
            .select('day_of_week, start_time, end_time, subjects(name)')
            .eq('class_level', classLevel)
            .eq('school_id', schoolId);
        
        handleSupabaseError(error, 'getClassSchedule');

        const scheduleData: Record<string, {time: string, subject: string}[]> = {
            'Senin': [], 'Selasa': [], 'Rabu': [], 'Kamis': [], 'Jumat': []
        };
        
        (data || []).forEach(item => {
            const day = item.day_of_week;
            if (scheduleData[day]) {
                 scheduleData[day].push({
                     time: `${item.start_time.substring(0,5)} - ${item.end_time.substring(0,5)}`,
                     // @ts-ignore
                     subject: item.subjects?.name || 'N/A'
                 })
            }
        });
        
        // Sort times for each day
        for (const day in scheduleData) {
            scheduleData[day].sort((a, b) => a.time.localeCompare(b.time));
        }

        return scheduleData;
    }
};

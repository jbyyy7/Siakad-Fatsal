import React, { useEffect, useState } from 'react';
import { User, Class, Subject, TeacherAttendanceRecord } from '../../types';
import { supabase, dataService } from '../../services/dataService';
import { logger } from '../../utils/logger';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

interface StaffDashboardProps {
  user: User;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function StaffDashboard({ user }: StaffDashboardProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todayTeacherAttendance, setTodayTeacherAttendance] = useState<TeacherAttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user.schoolId]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Load classes and subjects for this school
      const [classesData, subjectsData] = await Promise.all([
        dataService.getClasses(),
        dataService.getSubjects(),
      ]);

      // Filter by school
      const schoolClasses = classesData.filter((c: Class) => c.schoolId === user.schoolId);
      const schoolSubjects = subjectsData.filter((s: Subject) => s.schoolId === user.schoolId);
      
      setClasses(schoolClasses);
      setSubjects(schoolSubjects);

      // Count students in this school
      const { count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', user.schoolId)
        .eq('role', 'Siswa');

      // Count teachers and staff in this school
      const { count: teacherCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', user.schoolId)
        .in('role', ['Guru', 'Kepala Sekolah', 'Staff']);

      // Get today's teacher attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendance } = await supabase
        .from('teacher_attendance')
        .select('*, profiles!teacher_id(name)')
        .eq('school_id', user.schoolId)
        .eq('date', today);

      const attendanceWithNames = attendance?.map(a => ({
        ...a,
        teacherName: a.profiles?.name || 'Unknown',
      })) || [];

      setTodayTeacherAttendance(attendanceWithNames as TeacherAttendanceRecord[]);

      setStats({
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        totalClasses: schoolClasses.length,
        totalSubjects: schoolSubjects.length,
      });

      setLoading(false);
    } catch (error) {
      logger.error('Failed to load staff dashboard data', error);
      toast.error('Gagal memuat data dashboard');
      setLoading(false);
    }
  }

  const attendanceSummary = [
    { name: 'Hadir', value: todayTeacherAttendance.filter(a => a.status === 'Hadir').length },
    { name: 'Sakit', value: todayTeacherAttendance.filter(a => a.status === 'Sakit').length },
    { name: 'Izin', value: todayTeacherAttendance.filter(a => a.status === 'Izin').length },
    { name: 'Alpha', value: todayTeacherAttendance.filter(a => a.status === 'Alpha').length },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard Staff - {user.schoolName}</h2>
        <p className="text-gray-400">Kelola data sekolah Anda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-lg shadow-lg">
          <div className="text-sm text-blue-200 mb-1">Total Siswa</div>
          <div className="text-3xl font-bold">{stats.totalStudents}</div>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-lg shadow-lg">
          <div className="text-sm text-green-200 mb-1">Total Guru & Staff</div>
          <div className="text-3xl font-bold">{stats.totalTeachers}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-lg shadow-lg">
          <div className="text-sm text-purple-200 mb-1">Total Kelas</div>
          <div className="text-3xl font-bold">{stats.totalClasses}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-lg shadow-lg">
          <div className="text-sm text-orange-200 mb-1">Total Mata Pelajaran</div>
          <div className="text-3xl font-bold">{stats.totalSubjects}</div>
        </div>
      </div>

      {/* Teacher Attendance Today */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Absensi Guru & Staff Hari Ini</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={attendanceSummary}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendanceSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-700">
                <tr>
                  <th className="text-left p-2">Nama</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Check In</th>
                </tr>
              </thead>
              <tbody>
                {todayTeacherAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center p-4 text-gray-400">
                      Belum ada data absensi hari ini
                    </td>
                  </tr>
                ) : (
                  todayTeacherAttendance.map((record, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="p-2">{record.teacherName}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          record.status === 'Hadir' ? 'bg-green-600' :
                          record.status === 'Sakit' ? 'bg-blue-600' :
                          record.status === 'Izin' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="p-2">{record.check_in_time || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.hash = '#/manage-users'}
            className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-center transition"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm">Kelola Pengguna</div>
          </button>
          <button
            onClick={() => window.location.hash = '#/manage-classes'}
            className="p-4 bg-green-600 hover:bg-green-700 rounded-lg text-center transition"
          >
            <div className="text-2xl mb-2">🏫</div>
            <div className="text-sm">Kelola Kelas</div>
          </button>
          <button
            onClick={() => window.location.hash = '#/teacher-attendance'}
            className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-center transition"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm">Absensi Guru</div>
          </button>
          <button
            onClick={() => window.location.hash = '#/announcements'}
            className="p-4 bg-orange-600 hover:bg-orange-700 rounded-lg text-center transition"
          >
            <div className="text-2xl mb-2">📢</div>
            <div className="text-sm">Pengumuman</div>
          </button>
        </div>
      </div>

      {/* Classes Overview */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Daftar Kelas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.length === 0 ? (
            <div className="col-span-3 text-center text-gray-400 py-8">
              Belum ada kelas di sekolah ini
            </div>
          ) : (
            classes.map(cls => (
              <div key={cls.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="font-semibold text-lg mb-1">{cls.name}</div>
                <div className="text-sm text-gray-400">
                  Wali Kelas: {cls.homeroomTeacherName || 'Belum ditentukan'}
                </div>
                <div className="text-sm text-gray-400">
                  Siswa: {cls.studentIds?.length || 0}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

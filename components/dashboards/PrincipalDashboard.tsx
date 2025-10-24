

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole } from '../../types';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';
import { BellIcon } from '../icons/BellIcon';

interface PrincipalDashboardProps {
  user: User;
}

interface ClassPerformance {
  className: string;
  studentCount: number;
  averageGrade: number;
  attendanceRate: number;
}

const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({ teacherCount: 0, studentCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [classData, setClassData] = useState<ClassPerformance[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const filters = user.schoolId ? { schoolId: user.schoolId } : {};
        
        const [teachers, students] = await Promise.all([
          dataService.getUsers({ role: UserRole.TEACHER, ...filters }),
          dataService.getUsers({ role: UserRole.STUDENT, ...filters })
        ]);
        
        setStats({
          teacherCount: teachers.length,
          studentCount: students.length
        });

        // Demo class performance data
        const demoClassData: ClassPerformance[] = [
          { className: 'X IPA 1', studentCount: 36, averageGrade: 85.5, attendanceRate: 94.2 },
          { className: 'X IPA 2', studentCount: 35, averageGrade: 83.2, attendanceRate: 92.8 },
          { className: 'XI IPA 1', studentCount: 34, averageGrade: 87.3, attendanceRate: 95.5 },
          { className: 'XI IPA 2', studentCount: 33, averageGrade: 84.8, attendanceRate: 93.1 },
          { className: 'XII IPA 1', studentCount: 32, averageGrade: 88.9, attendanceRate: 96.2 },
          { className: 'XII IPA 2', studentCount: 31, averageGrade: 86.7, attendanceRate: 94.8 },
        ];
        setClassData(demoClassData);

      } catch (error) {
        console.error("Failed to fetch principal dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [user.schoolId]);

  const totalStudents = classData.reduce((sum, cls) => sum + cls.studentCount, 0);
  const overallAvgGrade = (classData.reduce((sum, cls) => sum + cls.averageGrade, 0) / classData.length).toFixed(1);
  const overallAttendance = (classData.reduce((sum, cls) => sum + cls.attendanceRate, 0) / classData.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard Kepala Sekolah</h2>
        <p className="text-gray-600 mt-1">Selamat datang, {user.name}</p>
        <p className="text-sm text-gray-500">{user.schoolName || 'SMA Al-Fatih'}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Siswa</p>
              <p className="text-2xl font-bold text-gray-800">{stats.studentCount}</p>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <AcademicCapIcon className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Guru</p>
              <p className="text-2xl font-bold text-gray-800">{stats.teacherCount}</p>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-7 w-7 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Rata-rata Nilai</p>
              <p className="text-2xl font-bold text-gray-800">{overallAvgGrade}</p>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CalendarIcon className="h-7 w-7 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Kehadiran</p>
              <p className="text-2xl font-bold text-gray-800">{overallAttendance}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/data-guru"
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <AcademicCapIcon className="h-8 w-8 text-brand-600" />
          <div>
            <div className="font-semibold text-gray-800">Data Guru</div>
            <div className="text-xs text-gray-500">Kelola guru</div>
          </div>
        </Link>

        <Link
          to="/data-siswa"
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <UserGroupIcon className="h-8 w-8 text-brand-600" />
          <div>
            <div className="font-semibold text-gray-800">Data Siswa</div>
            <div className="text-xs text-gray-500">Kelola siswa</div>
          </div>
        </Link>

        <Link
          to="/laporan-sekolah"
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <ClipboardDocumentListIcon className="h-8 w-8 text-brand-600" />
          <div>
            <div className="font-semibold text-gray-800">Laporan</div>
            <div className="text-xs text-gray-500">Lihat laporan</div>
          </div>
        </Link>

        <Link
          to="/pengumuman"
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <BellIcon className="h-8 w-8 text-brand-600" />
          <div>
            <div className="font-semibold text-gray-800">Pengumuman</div>
            <div className="text-xs text-gray-500">Buat pengumuman</div>
          </div>
        </Link>
      </div>

      {/* Class Performance */}
      <Card title="Performance Per Kelas" icon={ChartBarIcon} className="shadow-sm border border-gray-200">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Siswa</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rata-rata Nilai</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Kehadiran</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {classData.map((cls) => (
                <tr key={cls.className} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{cls.className}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{cls.studentCount}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold ${
                      cls.averageGrade >= 85 ? 'text-green-600' :
                      cls.averageGrade >= 75 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {cls.averageGrade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold ${
                      cls.attendanceRate >= 95 ? 'text-green-600' :
                      cls.attendanceRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {cls.attendanceRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {cls.averageGrade >= 85 && cls.attendanceRate >= 95 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Excellent</span>
                    ) : cls.averageGrade >= 75 && cls.attendanceRate >= 90 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Good</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Needs Improvement</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {classData.map((cls) => (
            <div key={cls.className} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{cls.className}</h3>
                {cls.averageGrade >= 85 && cls.attendanceRate >= 95 ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Excellent</span>
                ) : cls.averageGrade >= 75 && cls.attendanceRate >= 90 ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Good</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Needs Improvement</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Siswa</div>
                  <div className="font-semibold text-gray-800">{cls.studentCount}</div>
                </div>
                <div>
                  <div className="text-gray-500">Nilai</div>
                  <div className={`font-semibold ${
                    cls.averageGrade >= 85 ? 'text-green-600' :
                    cls.averageGrade >= 75 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {cls.averageGrade}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Hadir</div>
                  <div className={`font-semibold ${
                    cls.attendanceRate >= 95 ? 'text-green-600' :
                    cls.attendanceRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {cls.attendanceRate}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Teacher Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Kehadiran Guru (Minggu Ini)" icon={CalendarIcon} className="shadow-sm border border-gray-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Hadir</span>
              <span className="text-lg font-bold text-green-600">32 guru</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Izin</span>
              <span className="text-lg font-bold text-yellow-600">2 guru</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Alpha</span>
              <span className="text-lg font-bold text-red-600">1 guru</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Persentase Kehadiran</span>
                <span className="text-xl font-bold text-brand-600">91.4%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Aktivitas Terkini" icon={ClipboardDocumentListIcon} className="shadow-sm border border-gray-200">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-brand-600"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">Input nilai ujian tengah semester kelas XII</div>
                <div className="text-xs text-gray-500">2 jam yang lalu</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-brand-600"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">Pertemuan orang tua siswa kelas X</div>
                <div className="text-xs text-gray-500">1 hari yang lalu</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-brand-600"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">Rapat evaluasi kurikulum dengan guru</div>
                <div className="text-xs text-gray-500">2 hari yang lalu</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrincipalDashboard;

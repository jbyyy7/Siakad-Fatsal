
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Announcement, User } from '../../types';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { TrophyIcon } from '../icons/TrophyIcon';
import { ArrowTrendingUpIcon } from '../icons/ArrowTrendingUpIcon';

interface FoundationHeadDashboardProps {
  user: User;
}

interface SchoolStats {
  id: string;
  name: string;
  studentCount: number;
  teacherCount: number;
  averageGrade: number;
  attendanceRate: number;
}

const FoundationHeadDashboard: React.FC<FoundationHeadDashboardProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [schoolsData, setSchoolsData] = useState<SchoolStats[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TODO: Replace with actual API call
        const demoSchoolsData: SchoolStats[] = [
          {
            id: '1',
            name: 'SMA Al-Fatih Jakarta',
            studentCount: 450,
            teacherCount: 35,
            averageGrade: 85.5,
            attendanceRate: 94.2
          },
          {
            id: '2',
            name: 'SMA Al-Fatih Bogor',
            studentCount: 380,
            teacherCount: 28,
            averageGrade: 82.3,
            attendanceRate: 91.8
          },
          {
            id: '3',
            name: 'SMA Al-Fatih Depok',
            studentCount: 420,
            teacherCount: 32,
            averageGrade: 88.7,
            attendanceRate: 95.5
          },
          {
            id: '4',
            name: 'SMA Al-Fatih Tangerang',
            studentCount: 350,
            teacherCount: 26,
            averageGrade: 81.9,
            attendanceRate: 90.3
          },
        ];

        setSchoolsData(demoSchoolsData);
      } catch (error) {
        console.error("Failed to fetch foundation head dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalStudents = schoolsData.reduce((sum, school) => sum + school.studentCount, 0);
  const totalTeachers = schoolsData.reduce((sum, school) => sum + school.teacherCount, 0);
  const averageGradeAll = (schoolsData.reduce((sum, school) => sum + school.averageGrade, 0) / schoolsData.length).toFixed(1);
  const averageAttendanceAll = (schoolsData.reduce((sum, school) => sum + school.attendanceRate, 0) / schoolsData.length).toFixed(1);

  // Sort schools by performance
  const topSchools = [...schoolsData].sort((a, b) => b.averageGrade - a.averageGrade);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Dashboard Ketua Yayasan</h2>
        <p className="text-gray-600 mt-1">Selamat datang, {user.name}</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-100 rounded-lg">
              <BuildingLibraryIcon className="h-8 w-8 text-brand-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sekolah</p>
              <p className="text-2xl font-bold text-gray-800">{schoolsData.length}</p>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Siswa</p>
              <p className="text-2xl font-bold text-gray-800">{totalStudents.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <AcademicCapIcon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pengajar</p>
              <p className="text-2xl font-bold text-gray-800">{totalTeachers}</p>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rata-rata Nilai</p>
              <p className="text-2xl font-bold text-gray-800">{averageGradeAll}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Performing Schools" icon={TrophyIcon} className="shadow-sm border border-gray-200">
          <div className="space-y-4">
            {topSchools.map((school, index) => (
              <div key={school.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate">{school.name}</div>
                  <div className="text-sm text-gray-600">
                    {school.studentCount} siswa • {school.teacherCount} guru
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-brand-600">{school.averageGrade}</div>
                  <div className="text-xs text-gray-500">Rata-rata</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Attendance Overview" icon={ArrowTrendingUpIcon} className="shadow-sm border border-gray-200">
          <div className="space-y-4">
            {schoolsData.map((school) => (
              <div key={school.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 truncate pr-2">{school.name}</span>
                  <span className={`text-sm font-bold ${
                    school.attendanceRate >= 95 ? 'text-green-600' :
                    school.attendanceRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {school.attendanceRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      school.attendanceRate >= 95 ? 'bg-green-500' :
                      school.attendanceRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${school.attendanceRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* School Comparison Table */}
      <Card title="School Comparison" icon={ChartBarIcon} className="shadow-sm border border-gray-200">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sekolah</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Siswa</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Guru</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rata-rata Nilai</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Kehadiran</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schoolsData.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{school.name}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{school.studentCount}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{school.teacherCount}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold ${
                      school.averageGrade >= 85 ? 'text-green-600' :
                      school.averageGrade >= 75 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {school.averageGrade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold ${
                      school.attendanceRate >= 95 ? 'text-green-600' :
                      school.attendanceRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {school.attendanceRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      to={`/school-report?id=${school.id}`}
                      className="text-brand-600 hover:text-brand-700 font-medium text-sm"
                    >
                      Lihat Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-6 py-3 text-gray-800">TOTAL / RATA-RATA</td>
                <td className="px-6 py-3 text-center text-brand-600">{totalStudents}</td>
                <td className="px-6 py-3 text-center text-brand-600">{totalTeachers}</td>
                <td className="px-6 py-3 text-center text-brand-600">{averageGradeAll}</td>
                <td className="px-6 py-3 text-center text-brand-600">{averageAttendanceAll}%</td>
                <td className="px-6 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {schoolsData.map((school) => (
            <div key={school.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-900">{school.name}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Siswa:</span>
                  <span className="ml-2 font-semibold text-gray-800">{school.studentCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Guru:</span>
                  <span className="ml-2 font-semibold text-gray-800">{school.teacherCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Nilai:</span>
                  <span className={`ml-2 font-semibold ${
                    school.averageGrade >= 85 ? 'text-green-600' :
                    school.averageGrade >= 75 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {school.averageGrade}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Kehadiran:</span>
                  <span className={`ml-2 font-semibold ${
                    school.attendanceRate >= 95 ? 'text-green-600' :
                    school.attendanceRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {school.attendanceRate}%
                  </span>
                </div>
              </div>
              <Link
                to={`/school-report?id=${school.id}`}
                className="block text-center py-2 bg-brand-600 text-white rounded-lg font-medium text-sm hover:bg-brand-700"
              >
                Lihat Detail
              </Link>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default FoundationHeadDashboard;

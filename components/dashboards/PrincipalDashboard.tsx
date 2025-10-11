
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole } from '../../types';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { CogIcon } from '../icons/CogIcon';

interface PrincipalDashboardProps {
  user: User;
}

const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({ teacherCount: 0, studentCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user.schoolId) {
        setIsLoading(false);
        return;
      }
      try {
        const [teachers, students] = await Promise.all([
          dataService.getUsers({ role: UserRole.TEACHER, schoolId: user.schoolId }),
          dataService.getUsers({ role: UserRole.STUDENT, schoolId: user.schoolId })
        ]);
        setStats({
          teacherCount: teachers.length,
          studentCount: students.length
        });
      } catch (error) {
        console.error("Failed to fetch principal dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [user.schoolId]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Selamat Datang, Kepala Sekolah {user.name}!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <UserGroupIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Guru</p>
              <p className="text-2xl font-bold text-gray-800">{isLoading ? '...' : stats.teacherCount}</p>
            </div>
          </div>
        </Card>
        <Card>
           <div className="flex items-center">
            <AcademicCapIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Siswa</p>
              <p className="text-2xl font-bold text-gray-800">{isLoading ? '...' : stats.studentCount}</p>
            </div>
          </div>
        </Card>
      </div>
      <div className="mt-8">
        <Card title="Akses Cepat" icon={CogIcon}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/data-guru" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors block">
              <h4 className="font-semibold text-gray-800">Data Guru</h4>
              <p className="text-sm text-gray-600">Lihat dan kelola data guru.</p>
            </Link>
            <Link to="/data-siswa" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors block">
              <h4 className="font-semibold text-gray-800">Data Siswa</h4>
              <p className="text-sm text-gray-600">Lihat dan kelola data siswa.</p>
            </Link>
            <Link to="/laporan-sekolah" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors block">
              <h4 className="font-semibold text-gray-800">Laporan Sekolah</h4>
              <p className="text-sm text-gray-600">Lihat laporan absensi dan nilai.</p>
            </Link>
             <Link to="/pengumuman" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors block">
              <h4 className="font-semibold text-gray-800">Pengumuman Sekolah</h4>
              <p className="text-sm text-gray-600">Buat dan kelola pengumuman.</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrincipalDashboard;

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';

interface PrincipalDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ user, onNavigate }) => {
  const [stats, setStats] = useState({ teacherCount: 0, studentCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user.schoolId) {
      setIsLoading(false);
      return;
    }
    const fetchStats = async () => {
      try {
        const [teacherCount, studentCount] = await Promise.all([
          dataService.getUserCount({ role: UserRole.TEACHER, schoolId: user.schoolId }),
          dataService.getUserCount({ role: UserRole.STUDENT, schoolId: user.schoolId })
        ]);
        setStats({ teacherCount, studentCount });
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
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard {user.schoolName}</h2>
      <p className="text-gray-600 mb-6">Selamat Datang, {user.name}!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <UserGroupIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Jumlah Guru</p>
              <p className="text-2xl font-bold text-gray-800">{isLoading ? '...' : stats.teacherCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <AcademicCapIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Jumlah Siswa</p>
              <p className="text-2xl font-bold text-gray-800">{isLoading ? '...' : stats.studentCount}</p>
            </div>
          </div>
        </Card>
         <Card>
           <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Acara Mendatang</p>
              <p className="text-lg font-semibold text-gray-800 truncate">Ujian Akhir Semester</p>
            </div>
          </div>
        </Card>
      </div>

       <div className="mt-8">
        <Card title="Akses Cepat">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button onClick={() => onNavigate('Data Guru')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
              <h4 className="font-semibold text-gray-800">Data Guru</h4>
              <p className="text-sm text-gray-600">Lihat dan kelola data guru.</p>
            </button>
            <button onClick={() => onNavigate('Data Siswa')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
              <h4 className="font-semibold text-gray-800">Data Siswa</h4>
              <p className="text-sm text-gray-600">Lihat dan kelola data siswa.</p>
            </button>
            <button onClick={() => onNavigate('Laporan Sekolah')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
              <h4 className="font-semibold text-gray-800">Laporan Sekolah</h4>
              <p className="text-sm text-gray-600">Lihat laporan absensi dan nilai.</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
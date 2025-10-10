// FIX: Implemented the PrincipalDashboard component which was a placeholder.
import React from 'react';
import { User } from '../../types';
import Card from '../Card';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { CalendarIcon } from '../icons/CalendarIcon';

interface PrincipalDashboardProps {
  user: User;
}

const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ user }) => {
    // Mock data specific to the principal's school
    const teacherCount = user.schoolId === 'mi_fs' ? 15 : 20;
    const studentCount = user.schoolId === 'mi_fs' ? 150 : 220;

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Dashboard Kepala Sekolah</h2>
      <p className="text-gray-600 mb-8">Selamat datang kembali, {user.name}. Berikut adalah ringkasan untuk {user.schoolName}.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
            <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-blue-500 mr-4"/>
                <div>
                    <p className="text-gray-500">Jumlah Guru</p>
                    <p className="text-2xl font-bold text-gray-800">{teacherCount}</p>
                </div>
            </div>
        </Card>
        <Card>
            <div className="flex items-center">
                <AcademicCapIcon className="h-8 w-8 text-green-500 mr-4"/>
                <div>
                    <p className="text-gray-500">Jumlah Siswa</p>
                    <p className="text-2xl font-bold text-gray-800">{studentCount}</p>
                </div>
            </div>
        </Card>
        <Card>
            <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-red-500 mr-4"/>
                <div>
                    <p className="text-gray-500">Tingkat Kehadiran Hari Ini</p>
                    <p className="text-2xl font-bold text-gray-800">97.5%</p>
                </div>
            </div>
        </Card>
      </div>

       <Card title="Pengumuman Sekolah">
            <p className="text-gray-600 mb-4">Belum ada pengumuman baru.</p>
            <button className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors">
                Buat Pengumuman Baru
            </button>
      </Card>
    </div>
  );
};

export default PrincipalDashboard;

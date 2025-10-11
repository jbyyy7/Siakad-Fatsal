
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole } from '../../types';
import Card from '../Card';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { CogIcon } from '../icons/CogIcon';

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({ userCount: 0, schoolCount: 0, studentCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersData, schoolsData] = await Promise.all([
          dataService.getUsers(),
          dataService.getSchools()
        ]);
        setStats({
          userCount: usersData.length,
          schoolCount: schoolsData.length,
          studentCount: usersData.filter(u => u.role === UserRole.STUDENT).length
        });
      } catch (error) {
        console.error("Failed to fetch admin dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Selamat Datang, Administrator {user.name}!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <UserGroupIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Pengguna</p>
              <p className="text-2xl font-bold text-gray-800">{isLoading ? '...' : stats.userCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <BuildingLibraryIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Sekolah</p>
              <p className="text-2xl font-bold text-gray-800">{isLoading ? '...' : stats.schoolCount}</p>
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
        <Card title="Manajemen Sistem" icon={CogIcon}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/kelola-pengguna" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors block">
              <h4 className="font-semibold text-gray-800">Kelola Pengguna</h4>
              <p className="text-sm text-gray-600">Tambah, edit, dan hapus data pengguna.</p>
            </Link>
            <Link to="/kelola-sekolah" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors block">
              <h4 className="font-semibold text-gray-800">Kelola Sekolah</h4>
              <p className="text-sm text-gray-600">Kelola informasi data sekolah.</p>
            </Link>
             <Link to="/pengaturan-sistem" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors block">
              <h4 className="font-semibold text-gray-800">Pengaturan</h4>
              <p className="text-sm text-gray-600">Atur konfigurasi sistem umum.</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

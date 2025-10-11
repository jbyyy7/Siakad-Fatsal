import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { CogIcon } from '../icons/CogIcon';
import { TagIcon } from '../icons/TagIcon';

interface AdminDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onNavigate }) => {
  const [stats, setStats] = useState({ userCount: 0, schoolCount: 0, subjectCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [userCount, schoolCount, subjectCount] = await Promise.all([
          dataService.getUserCount(),
          dataService.getSchoolCount(),
          dataService.getSubjectCount()
        ]);
        setStats({ userCount, schoolCount, subjectCount });
      } catch (error) {
        console.error("Failed to fetch admin dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard: React.FC<{ label: string; value: number | string; icon: React.FC<any> }> = ({ label, value, icon: Icon }) => (
    <Card>
      <div className="flex items-center">
        <Icon className="h-10 w-10 text-brand-600 mr-4" />
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{isLoading ? '...' : value}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Selamat Datang, {user.name}!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Pengguna" value={stats.userCount} icon={UserGroupIcon} />
        <StatCard label="Total Sekolah" value={stats.schoolCount} icon={BuildingLibraryIcon} />
        <StatCard label="Total Mapel" value={stats.subjectCount} icon={TagIcon} />
        <StatCard label="Versi Sistem" value="1.2.0" icon={CogIcon} />
      </div>

      <div className="mt-8">
        <Card title="Akses Cepat">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => onNavigate('Kelola Sekolah')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
              <h4 className="font-semibold text-gray-800">Kelola Sekolah</h4>
              <p className="text-sm text-gray-600">Tambah, edit, atau hapus data sekolah.</p>
            </button>
            <button onClick={() => onNavigate('Kelola Pengguna')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
              <h4 className="font-semibold text-gray-800">Kelola Pengguna</h4>
              <p className="text-sm text-gray-600">Atur akun untuk semua peran pengguna.</p>
            </button>
            <button onClick={() => onNavigate('Kelola Mata Pelajaran')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
                <h4 className="font-semibold text-gray-800">Kelola Mapel</h4>
                <p className="text-sm text-gray-600">Atur semua mata pelajaran.</p>
            </button>
            <button onClick={() => onNavigate('Pengaturan Sistem')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
              <h4 className="font-semibold text-gray-800">Pengaturan Sistem</h4>
              <p className="text-sm text-gray-600">Konfigurasi umum aplikasi.</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
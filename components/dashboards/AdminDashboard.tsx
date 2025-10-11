import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types';
import Card from '../Card';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { CogIcon } from '../icons/CogIcon';
import { TagIcon } from '../icons/TagIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { dataService } from '../../services/dataService';

interface AdminDashboardProps {
  user: User;
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ComponentType<{ className?: string }> }> = ({ title, value, icon: Icon }) => (
  <Card>
    <div className="flex items-center">
      <Icon className="h-10 w-10 text-brand-600 mr-4" />
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  </Card>
);

const pageToPath = (pageName: string): string => `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({ userCount: '...', schoolCount: '...', subjectCount: '...', classCount: '...' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, schools, subjects, classes] = await Promise.all([
          dataService.getUsers(),
          dataService.getSchools(),
          dataService.getSubjects(),
          dataService.getClasses(),
        ]);
        setStats({
          userCount: users.length.toString(),
          schoolCount: schools.length.toString(),
          subjectCount: subjects.length.toString(),
          classCount: classes.length.toString(),
        });
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        setStats({ userCount: 'Error', schoolCount: 'Error', subjectCount: 'Error', classCount: 'Error' });
      }
    };
    fetchStats();
  }, []);

  const quickAccessItems = [
    { title: 'Kelola Pengguna', description: 'Tambah, edit, dan hapus data pengguna.', icon: UserGroupIcon, page: 'Kelola Pengguna' },
    { title: 'Kelola Sekolah', description: 'Kelola data unit sekolah di bawah yayasan.', icon: BuildingLibraryIcon, page: 'Kelola Sekolah' },
    { title: 'Kelola Mata Pelajaran', description: 'Atur daftar mata pelajaran per sekolah.', icon: TagIcon, page: 'Kelola Mata Pelajaran' },
    { title: 'Kelola Kelas', description: 'Atur kelas, wali kelas, dan siswa.', icon: BookOpenIcon, page: 'Kelola Kelas' },
    { title: 'Pengaturan Sistem', description: 'Konfigurasi umum sistem SIAKAD.', icon: CogIcon, page: 'Pengaturan Sistem' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Selamat Datang, Administrator {user.name}!</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Pengguna" value={stats.userCount} icon={UserGroupIcon} />
        <StatCard title="Total Sekolah" value={stats.schoolCount} icon={BuildingLibraryIcon} />
        <StatCard title="Total Mapel" value={stats.subjectCount} icon={TagIcon} />
        <StatCard title="Total Kelas" value={stats.classCount} icon={BookOpenIcon} />
      </div>

      <Card title="Panel Administrasi">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickAccessItems.map(item => (
            <Link
              key={item.page}
              to={pageToPath(item.page)}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors shadow-sm hover:shadow-md border block"
            >
              <item.icon className="h-8 w-8 text-brand-600 mb-2" />
              <h4 className="font-semibold text-gray-800">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
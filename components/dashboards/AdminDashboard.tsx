import React from 'react';
import { User } from '../../types';
import Card from '../Card';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { CogIcon } from '../icons/CogIcon';
import { TagIcon } from '../icons/TagIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';

interface AdminDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onNavigate }) => {
  const quickAccessItems = [
    { title: 'Kelola Pengguna', description: 'Tambah, edit, dan hapus data pengguna.', icon: UserGroupIcon, page: 'Kelola Pengguna' },
    { title: 'Kelola Sekolah', description: 'Kelola data unit sekolah di bawah yayasan.', icon: BuildingLibraryIcon, page: 'Kelola Sekolah' },
    { title: 'Kelola Mata Pelajaran', description: 'Atur daftar mata pelajaran global.', icon: TagIcon, page: 'Kelola Mata Pelajaran' },
    { title: 'Kelola Kelas', description: 'Atur kelas dan wali kelas.', icon: BookOpenIcon, page: 'Kelola Kelas' },
    { title: 'Pengaturan Sistem', description: 'Konfigurasi umum sistem SIAKAD.', icon: CogIcon, page: 'Pengaturan Sistem' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Selamat Datang, Administrator {user.name}!</h2>
      <Card title="Panel Administrasi">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickAccessItems.map(item => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors shadow-sm hover:shadow-md border"
            >
              <item.icon className="h-8 w-8 text-brand-600 mb-2" />
              <h4 className="font-semibold text-gray-800">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.description}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;

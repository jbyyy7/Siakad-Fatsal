import React from 'react';
import { User } from '../../types';
import Card from '../Card';
import { MOCK_USERS, MOCK_SCHOOLS } from '../../constants';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { CogIcon } from '../icons/CogIcon';

interface AdminDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onNavigate }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Selamat Datang, {user.name}!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <UserGroupIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Pengguna</p>
              <p className="text-2xl font-bold text-gray-800">{MOCK_USERS.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <BuildingLibraryIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Sekolah</p>
              <p className="text-2xl font-bold text-gray-800">{MOCK_SCHOOLS.length}</p>
            </div>
          </div>
        </Card>
        <Card>
           <div className="flex items-center">
            <CogIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Versi Sistem</p>
              <p className="text-2xl font-bold text-gray-800">1.1.0</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card title="Akses Cepat">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button onClick={() => onNavigate('Kelola Sekolah')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
              <h4 className="font-semibold text-gray-800">Kelola Sekolah</h4>
              <p className="text-sm text-gray-600">Tambah, edit, atau hapus data sekolah.</p>
            </button>
            <button onClick={() => onNavigate('Kelola Pengguna')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
              <h4 className="font-semibold text-gray-800">Kelola Pengguna</h4>
              <p className="text-sm text-gray-600">Atur akun untuk semua peran pengguna.</p>
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

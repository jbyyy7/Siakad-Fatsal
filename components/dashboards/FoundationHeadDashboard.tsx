// FIX: Implemented the FoundationHeadDashboard component which was a placeholder. It now shows high-level statistics and navigation relevant to a foundation head.
import React from 'react';
import { User } from '../../types';
import Card from '../Card';
import { MOCK_SCHOOLS } from '../../constants';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { EnvelopeIcon } from '../icons/EnvelopeIcon';

interface FoundationHeadDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

const FoundationHeadDashboard: React.FC<FoundationHeadDashboardProps> = ({ user, onNavigate }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Selamat Datang, {user.name}!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <ChartBarIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Rata-rata Nilai Yayasan</p>
              <p className="text-2xl font-bold text-gray-800">85.5</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <BuildingLibraryIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Jumlah Sekolah</p>
              <p className="text-2xl font-bold text-gray-800">{MOCK_SCHOOLS.length}</p>
            </div>
          </div>
        </Card>
        <Card>
           <div className="flex items-center">
            <EnvelopeIcon className="h-10 w-10 text-brand-600 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Pengumuman Terakhir</p>
              <p className="text-lg font-semibold text-gray-800 truncate">Rapat Awal Tahun</p>
            </div>
          </div>
        </Card>
      </div>
      <div className="mt-8">
        <Card title="Akses Cepat">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button onClick={() => onNavigate('Laporan Akademik')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
              <h4 className="font-semibold text-gray-800">Laporan Akademik</h4>
              <p className="text-sm text-gray-600">Lihat laporan performa akademik.</p>
            </button>
            <button onClick={() => onNavigate('Data Sekolah')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
              <h4 className="font-semibold text-gray-800">Data Sekolah</h4>
              <p className="text-sm text-gray-600">Kelola informasi sekolah di bawah yayasan.</p>
            </button>
            <button onClick={() => onNavigate('Pengumuman')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
              <h4 className="font-semibold text-gray-800">Pengumuman</h4>
              <p className="text-sm text-gray-600">Buat dan lihat pengumuman yayasan.</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FoundationHeadDashboard;

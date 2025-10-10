// FIX: Implemented the FoundationHeadDashboard component which was a placeholder.
import React from 'react';
import { User } from '../../types';
import Card from '../Card';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { MOCK_SCHOOLS } from '../../constants';

interface FoundationHeadDashboardProps {
  user: User;
}

const FoundationHeadDashboard: React.FC<FoundationHeadDashboardProps> = ({ user }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Selamat Datang, {user.name}!</h2>
      <p className="text-gray-600 mb-8">Ringkasan umum Yayasan Fathus Salafi.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <p className="text-lg font-medium">Total Sekolah</p>
          <p className="text-4xl font-bold">4</p>
        </Card>
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
          <p className="text-lg font-medium">Total Guru</p>
          <p className="text-4xl font-bold">58</p>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <p className="text-lg font-medium">Total Siswa</p>
          <p className="text-4xl font-bold">620</p>
        </Card>
      </div>

      <Card title="Data Sekolah di Bawah Yayasan" icon={BuildingLibraryIcon}>
        <ul className="space-y-3">
            {MOCK_SCHOOLS.map(school => (
                <li key={school.id} className="p-3 rounded-lg bg-gray-50 flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-gray-800">{school.name}</p>
                        <p className="text-sm text-gray-500">{school.address}</p>
                    </div>
                    <span className="text-xs font-bold bg-brand-100 text-brand-800 px-2 py-1 rounded-full">{school.level}</span>
                </li>
            ))}
        </ul>
      </Card>
    </div>
  );
};

export default FoundationHeadDashboard;

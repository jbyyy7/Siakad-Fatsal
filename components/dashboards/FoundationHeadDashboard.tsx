// FIX: Implemented the FoundationHeadDashboard component which was a placeholder.
import React from 'react';
import { User } from '../../types';
import Card from '../Card';
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
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Selamat Datang, {user.name}!</h2>
            <p className="text-gray-600 mb-8">Ringkasan data dari seluruh sekolah di bawah naungan Yayasan Fathus Salafi.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <p className="text-lg font-medium">Total Siswa</p>
                    <p className="text-4xl font-bold">1,250</p>
                </Card>
                <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                    <p className="text-lg font-medium">Total Guru</p>
                    <p className="text-4xl font-bold">85</p>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                    <p className="text-lg font-medium">Rata-rata Nilai</p>
                    <p className="text-4xl font-bold">85.6</p>
                </Card>
            </div>

            <div className="mt-8">
                <Card title="Akses Cepat">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <button onClick={() => onNavigate('Laporan Akademik')} className="p-4 flex items-center bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">
                            <ChartBarIcon className="h-6 w-6 mr-3"/> Laporan Akademik
                        </button>
                        <button onClick={() => onNavigate('Data Sekolah')} className="p-4 flex items-center bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">
                            <BuildingLibraryIcon className="h-6 w-6 mr-3"/> Data Sekolah
                        </button>
                        <button onClick={() => onNavigate('Pengumuman')} className="p-4 flex items-center bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">
                            <EnvelopeIcon className="h-6 w-6 mr-3"/> Buat Pengumuman
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default FoundationHeadDashboard;

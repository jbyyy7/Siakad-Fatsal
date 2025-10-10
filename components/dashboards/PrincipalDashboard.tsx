// FIX: Implemented the PrincipalDashboard component which was a placeholder.
import React from 'react';
import { User, UserRole } from '../../types';
import Card from '../Card';
import { MOCK_USERS } from '../../constants';

interface PrincipalDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ user, onNavigate }) => {
    const schoolId = user.schoolId;
    const teachers = MOCK_USERS.filter(u => u.schoolId === schoolId && u.role === UserRole.TEACHER);
    const students = MOCK_USERS.filter(u => u.schoolId === schoolId && u.role === UserRole.STUDENT);

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Dashboard Kepala Sekolah</h2>
            <p className="text-gray-600 mb-8">Ringkasan untuk {user.schoolName}.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card>
                    <p className="text-lg font-medium text-gray-600">Jumlah Guru</p>
                    <p className="text-4xl font-bold text-gray-900">{teachers.length}</p>
                 </Card>
                 <Card>
                    <p className="text-lg font-medium text-gray-600">Jumlah Siswa</p>
                    <p className="text-4xl font-bold text-gray-900">{students.length}</p>
                 </Card>
                 <Card>
                    <p className="text-lg font-medium text-gray-600">Kehadiran Hari Ini</p>
                    <p className="text-4xl font-bold text-green-600">97%</p>
                 </Card>
                 <Card>
                    <p className="text-lg font-medium text-gray-600">Rata-rata Nilai</p>
                    <p className="text-4xl font-bold text-brand-700">88.2</p>
                 </Card>
            </div>
            
            <div className="mt-8">
                 <Card title="Akses Cepat">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onClick={() => onNavigate('Data Guru')} className="p-4 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">Data Guru</button>
                        <button onClick={() => onNavigate('Data Siswa')} className="p-4 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">Data Siswa</button>
                        <button onClick={() => onNavigate('Jadwal Pelajaran')} className="p-4 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">Jadwal Pelajaran</button>
                        <button onClick={() => onNavigate('Laporan Sekolah')} className="p-4 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">Laporan Sekolah</button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PrincipalDashboard;

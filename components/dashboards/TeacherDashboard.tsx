// FIX: Implemented the TeacherDashboard component which was a placeholder. It provides teachers with quick access to input grades, take attendance, and view their class schedules.
import React from 'react';
import { User } from '../../types';
import Card from '../Card';
import { MOCK_JOURNAL } from '../../constants';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { CalendarIcon } from '../icons/CalendarIcon';

interface TeacherDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onNavigate }) => {
  const today = '2024-07-25'; // Mocking date for demo data
  const journalToday = MOCK_JOURNAL[today] || [];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Selamat Datang, {user.name}!</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <Card title="Akses Cepat" icon={ClipboardDocumentListIcon}>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => onNavigate('Input Nilai')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
                  <h4 className="font-semibold text-gray-800">Input Nilai</h4>
                  <p className="text-sm text-gray-600">Masukkan nilai siswa untuk ujian terakhir.</p>
                </button>
                <button onClick={() => onNavigate('Absensi Siswa')} className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
                  <h4 className="font-semibold text-gray-800">Absensi Siswa</h4>
                  <p className="text-sm text-gray-600">Catat kehadiran siswa hari ini.</p>
                </button>
             </div>
           </Card>
           <Card title="Jadwal Mengajar Hari Ini" icon={CalendarIcon}>
                <ul className="space-y-2">
                    <li className="flex justify-between p-2 bg-gray-50 rounded"><span>07:30 - 09:00</span><strong>Matematika - Kelas 10-A</strong></li>
                    <li className="flex justify-between p-2 bg-gray-50 rounded"><span>10:00 - 11:30</span><strong>Matematika - Kelas 10-B</strong></li>
                </ul>
           </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card title="Kelas Saya" icon={UserGroupIcon}>
            <ul className="space-y-2">
                <li className="p-2 bg-brand-50 rounded text-brand-800 font-semibold">MA Kelas 10-A</li>
                <li className="p-2 bg-brand-50 rounded text-brand-800 font-semibold">MA Kelas 10-B</li>
                <li className="p-2 bg-brand-50 rounded text-brand-800 font-semibold">MA Kelas 11-A</li>
            </ul>
            <button onClick={() => onNavigate('Kelas Saya')} className="mt-4 text-sm font-semibold text-brand-600 hover:text-brand-800">Lihat Semua Kelas &rarr;</button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

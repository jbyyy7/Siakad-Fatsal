// FIX: Implemented the TeacherDashboard component which was a placeholder.
import React from 'react';
import { User } from '../../types';
import Card from '../Card';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';
import { MOCK_JOURNAL } from '../../constants';

interface TeacherDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onNavigate }) => {
    const today = '2024-07-25'; // Using a fixed date for consistent mock data
    const todaysJournal = MOCK_JOURNAL[today] || [];

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Selamat Datang, {user.name}!</h2>
            <p className="text-gray-600 mb-8">Berikut adalah ringkasan aktivitas mengajar Anda hari ini.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                     <Card title="Jadwal Mengajar Hari Ini" icon={CalendarIcon}>
                        <ul className="space-y-3">
                            <li className="p-3 bg-blue-50 rounded-lg">10:00 - 11:30: Kelas X-A - Matematika</li>
                            <li className="p-3 bg-blue-50 rounded-lg">13:00 - 14:30: Kelas X-B - Matematika</li>
                        </ul>
                    </Card>
                     <Card title="Jurnal Mengajar Terakhir" icon={ClipboardDocumentListIcon}>
                        {todaysJournal.length > 0 ? (
                            <ul className="space-y-2">
                                {todaysJournal.map((entry, idx) => (
                                    <li key={idx} className="text-gray-700"><strong>{entry.subject}:</strong> {entry.topic}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">Belum ada jurnal mengajar yang diisi untuk hari ini.</p>
                        )}
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-1">
                     <Card title="Akses Cepat">
                         <div className="flex flex-col space-y-3">
                            <button onClick={() => onNavigate('Kelas Saya')} className="w-full text-left p-4 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">Lihat Kelas Saya</button>
                            <button onClick={() => onNavigate('Input Nilai')} className="w-full text-left p-4 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">Input Nilai Siswa</button>
                            <button onClick={() => onNavigate('Absensi Siswa')} className="w-full text-left p-4 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-800 font-semibold transition-colors">Isi Absensi Siswa</button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;

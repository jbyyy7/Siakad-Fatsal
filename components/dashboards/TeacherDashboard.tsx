
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, JournalEntry } from '../../types';
import Card from '../Card';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';

interface TeacherDashboardProps {
  user: User;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
  const [journalToday, setJournalToday] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const fetchJournal = async () => {
      try {
        const journal = await dataService.getJournalForTeacher(user.id, today);
        setJournalToday(journal);
      } catch (error) {
        console.error("Failed to fetch teacher journal:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJournal();
  }, [user.id]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Selamat Datang, {user.name}!</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <Card title="Akses Cepat" icon={ClipboardDocumentListIcon}>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/input-nilai" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors block">
                  <h4 className="font-semibold text-gray-800">Input Nilai</h4>
                  <p className="text-sm text-gray-600">Masukkan nilai siswa untuk ujian terakhir.</p>
                </Link>
                <Link to="/absensi-siswa" className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors block">
                  <h4 className="font-semibold text-gray-800">Absensi Siswa</h4>
                  <p className="text-sm text-gray-600">Catat kehadiran siswa hari ini.</p>
                </Link>
             </div>
           </Card>

           <Card title="Jurnal Mengajar Hari Ini" icon={BookOpenIcon}>
                <div className="flex justify-between items-start">
                    {isLoading ? <p className="text-gray-500">Memuat jurnal...</p> :
                      journalToday.length > 0 ? (
                        <ul className="space-y-3">
                            {journalToday.map((entry, index) => (
                                <li key={index} className="p-3 bg-blue-50 rounded-md border-l-4 border-blue-400">
                                    <p className="font-bold text-blue-800">{entry.subject} - {entry.class}</p>
                                    <p className="text-sm text-blue-700">Materi: {entry.topic}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">Belum ada jurnal mengajar yang diisi untuk hari ini.</p>
                    )}
                    <Link
                        to="/jurnal-mengajar"
                        className="ml-4 flex-shrink-0 px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors"
                    >
                        Isi Jurnal
                    </Link>
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
            <Link to="/kelas-saya" className="mt-4 text-sm font-semibold text-brand-600 hover:text-brand-800 inline-block">Lihat Semua Kelas &rarr;</Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import GamificationSection from '../features/GamificationSection';
import ParentPortalView from '../features/ParentPortalView';
import AIChatAssistant from '../features/AIChatAssistant';
import { SparklesIcon } from '../icons/SparklesIcon';

interface StudentDashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onNavigate }) => {
  const [showParentPortal, setShowParentPortal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [grades, setGrades] = useState<{ subject: string; score: number; grade: string; }[]>([]);
  const [attendancePercentage, setAttendancePercentage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradesData, attendanceData] = await Promise.all([
          dataService.getGradesForStudent(user.id),
          dataService.getAttendanceForStudent(user.id)
        ]);
        
        setGrades(gradesData);

        if (attendanceData.length > 0) {
          const hadirCount = attendanceData.filter(a => a.status === 'Hadir').length;
          setAttendancePercentage(Math.round((hadirCount / attendanceData.length) * 100));
        } else {
          setAttendancePercentage(100);
        }

      } catch (error) {
        console.error("Failed to fetch student dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const recentGrades = grades.slice(0, 3);

  if (showParentPortal) {
    return <ParentPortalView user={user} onBack={() => setShowParentPortal(false)} />;
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Selamat Datang Kembali, {user.name}!</h2>
            <p className="text-gray-600">Siap untuk belajar hari ini?</p>
          </div>
           <button 
              onClick={() => setShowParentPortal(true)}
              className="px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg hover:bg-green-200 transition-colors"
            >
              Portal Orang Tua
            </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GamificationSection studentId={user.id} />
          <Card title="Jadwal Hari Ini">
            <ul className="space-y-2">
                <li className="flex justify-between p-2 bg-gray-50 rounded"><span>07:30 - 09:00</span><strong>Matematika</strong></li>
                <li className="flex justify-between p-2 bg-gray-50 rounded"><span>10:00 - 11:30</span><strong>Bahasa Indonesia</strong></li>
            </ul>
             <button onClick={() => onNavigate('Jadwal Pelajaran')} className="mt-4 text-sm font-semibold text-brand-600 hover:text-brand-800">Lihat Jadwal Lengkap &rarr;</button>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card title="Nilai Terbaru">
            {isLoading ? <p className="text-gray-500">Memuat nilai...</p> : 
              recentGrades.length > 0 ? (
              <ul className="space-y-3">
                {recentGrades.map((grade, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{grade.subject}</span>
                    <span className="font-bold text-lg text-brand-700">{grade.grade}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500">Belum ada nilai.</p>}
            <button onClick={() => onNavigate('Lihat Nilai')} className="mt-4 text-sm font-semibold text-brand-600 hover:text-brand-800">Lihat Semua Nilai &rarr;</button>
          </Card>
          <Card title="Absensi Bulan Ini">
            <div className="text-center">
                <p className="text-4xl font-bold text-gray-800">{isLoading ? '...' : `${attendancePercentage}%`}</p>
                <p className="text-sm text-gray-500">Kehadiran</p>
            </div>
             <button onClick={() => onNavigate('Absensi')} className="mt-4 w-full text-center text-sm font-semibold text-brand-600 hover:text-brand-800">Lihat Detail Absensi</button>
          </Card>
        </div>
      </div>

      <button 
        onClick={() => setShowAIChat(true)}
        className="fixed bottom-6 right-6 bg-brand-600 text-white p-4 rounded-full shadow-lg hover:bg-brand-700 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 z-40"
        aria-label="Buka Asisten AI"
      >
        <SparklesIcon className="h-6 w-6" />
      </button>

      {showAIChat && <AIChatAssistant onClose={() => setShowAIChat(false)} />}
    </div>
  );
};

export default StudentDashboard;
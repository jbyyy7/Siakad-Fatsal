
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types';
import Card from '../Card';
// FIX: Fix import path for dataService
import { dataService } from '../../services/dataService';
import GamificationSection from '../features/GamificationSection';
import ParentPortalView from '../features/ParentPortalView';
import AIChatAssistant from '../features/AIChatAssistant';
import { SparklesIcon } from '../icons/SparklesIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
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
    <div className="relative p-6 max-w-7xl mx-auto">
      {/* Welcome Header with Parent Portal Button */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 text-9xl opacity-10">🎓</div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">🎉 Selamat Datang Kembali, {user.name}!</h2>
          <p className="text-purple-100 mb-4">Siap untuk belajar dan berprestasi hari ini?</p>
          <button 
            onClick={() => setShowParentPortal(true)}
            className="px-5 py-2.5 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-colors shadow-md"
          >
            👪 Portal Orang Tua
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Nilai Rata-rata</p>
              <p className="text-3xl font-bold text-blue-600">85.5</p>
            </div>
            <ChartBarIcon className="h-10 w-10 text-blue-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Kehadiran</p>
              <p className="text-3xl font-bold text-green-600">{isLoading ? '...' : `${attendancePercentage}%`}</p>
            </div>
            <CalendarIcon className="h-10 w-10 text-green-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Tugas Selesai</p>
              <p className="text-3xl font-bold text-purple-600">12/15</p>
            </div>
            <ClipboardDocumentListIcon className="h-10 w-10 text-purple-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-amber-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Poin Badge</p>
              <p className="text-3xl font-bold text-amber-600">1,250</p>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gamification Section */}
          <GamificationSection studentId={user.id} />

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <BookOpenIcon className="h-5 w-5 mr-2" />
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Link to="/lihat-nilai" className="group bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 p-4 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all text-center">
                <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-gray-800 text-sm">Lihat Nilai</p>
              </Link>

              <Link to="/absensi" className="group bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 p-4 rounded-lg border-2 border-transparent hover:border-green-300 transition-all text-center">
                <CalendarIcon className="h-8 w-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-gray-800 text-sm">Absensi</p>
              </Link>

              <Link to="/jadwal-pelajaran" className="group bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 p-4 rounded-lg border-2 border-transparent hover:border-purple-300 transition-all text-center">
                <BookOpenIcon className="h-8 w-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-gray-800 text-sm">Jadwal</p>
              </Link>

              <Link to="/lihat-rapor" className="group bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 p-4 rounded-lg border-2 border-transparent hover:border-amber-300 transition-all text-center">
                <ClipboardDocumentListIcon className="h-8 w-8 text-amber-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-gray-800 text-sm">Rapor</p>
              </Link>

              <Link to="/kartu-pelajar" className="group bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 p-4 rounded-lg border-2 border-transparent hover:border-indigo-300 transition-all text-center">
                <div className="text-3xl mx-auto mb-2 group-hover:scale-110 transition-transform">🪪</div>
                <p className="font-semibold text-gray-800 text-sm">Kartu Pelajar</p>
              </Link>

              <Link to="/pengumuman" className="group bg-gradient-to-br from-rose-50 to-red-50 hover:from-rose-100 hover:to-red-100 p-4 rounded-lg border-2 border-transparent hover:border-rose-300 transition-all text-center">
                <div className="text-3xl mx-auto mb-2 group-hover:scale-110 transition-transform">📢</div>
                <p className="font-semibold text-gray-800 text-sm">Pengumuman</p>
              </Link>
            </div>
          </div>

          {/* Schedule Today */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Jadwal Hari Ini
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-l-4 border-blue-500">
                <div>
                  <p className="text-sm text-gray-600">⏰ 07:30 - 09:00</p>
                  <p className="font-bold text-gray-800">Matematika</p>
                  <p className="text-xs text-gray-500">Guru: Bu Siti</p>
                </div>
                <div className="text-3xl">📐</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
                <div>
                  <p className="text-sm text-gray-600">⏰ 10:00 - 11:30</p>
                  <p className="font-bold text-gray-800">Bahasa Indonesia</p>
                  <p className="text-xs text-gray-500">Guru: Pak Ahmad</p>
                </div>
                <div className="text-3xl">📚</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500">
                <div>
                  <p className="text-sm text-gray-600">⏰ 13:00 - 14:30</p>
                  <p className="font-bold text-gray-800">Fisika</p>
                  <p className="text-xs text-gray-500">Guru: Pak Budi</p>
                </div>
                <div className="text-3xl">🔬</div>
              </div>
            </div>
            <Link to="/jadwal-pelajaran" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-800">
              Lihat Jadwal Lengkap →
            </Link>
          </div>
        </div>

        {/* Right Column - Grades & Attendance */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Grades */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Nilai Terbaru
            </h3>
            {isLoading ? (
              <p className="text-gray-500 text-center py-4">Memuat nilai...</p>
            ) : recentGrades.length > 0 ? (
              <div className="space-y-3">
                {recentGrades.map((grade, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
                    <span className="font-medium text-gray-700">{grade.subject}</span>
                    <span className="font-bold text-xl text-blue-700">{grade.grade}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Belum ada nilai</p>
              </div>
            )}
            <Link to="/lihat-nilai" className="mt-4 block text-center w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors">
              Lihat Semua Nilai
            </Link>
          </div>

          {/* Attendance This Month */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Absensi Bulan Ini
            </h3>
            <div className="text-center my-6">
              <p className="text-6xl font-bold mb-2">{isLoading ? '...' : `${attendancePercentage}%`}</p>
              <p className="text-green-100">Tingkat Kehadiran</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">18</p>
                <p className="text-xs text-green-100">Hadir</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-green-100">Izin</p>
              </div>
            </div>
            <Link to="/absensi" className="mt-4 block text-center w-full py-2 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors">
              Lihat Detail Absensi
            </Link>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              Tugas Mendatang
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-l-4 border-amber-500">
                <p className="font-semibold text-gray-800 text-sm">PR Matematika</p>
                <p className="text-xs text-gray-600">Deadline: Besok, 15:00</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-l-4 border-blue-500">
                <p className="font-semibold text-gray-800 text-sm">Essay Bahasa Indonesia</p>
                <p className="text-xs text-gray-600">Deadline: Jumat, 10:00</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500">
                <p className="font-semibold text-gray-800 text-sm">Laporan Praktikum Fisika</p>
                <p className="text-xs text-gray-600">Deadline: Senin, 08:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Assistant Button */}
      <button 
        onClick={() => setShowAIChat(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-xl hover:from-purple-700 hover:to-pink-700 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 z-40 animate-pulse"
        aria-label="Buka Asisten AI"
      >
        <SparklesIcon className="h-6 w-6" />
      </button>

      {showAIChat && <AIChatAssistant onClose={() => setShowAIChat(false)} />}
    </div>
  );
};

export default StudentDashboard;

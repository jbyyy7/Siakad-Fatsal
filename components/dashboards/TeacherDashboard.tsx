
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
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { PencilSquareIcon } from '../icons/PencilSquareIcon';
import { BeakerIcon } from '../icons/BeakerIcon';

interface TeacherDashboardProps {
  user: User;
}

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  journalToday: number;
  attendanceMarked: number;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
  const [journalToday, setJournalToday] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    totalStudents: 0,
    journalToday: 0,
    attendanceMarked: 0,
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const fetchData = async () => {
      try {
        const journal = await dataService.getJournalForTeacher(user.id, today);
        setJournalToday(journal);
        
        // Fetch classes taught by this teacher
        const classes = await dataService.getClasses();
        const myClasses = classes.filter((c: any) => c.homeroomTeacherId === user.id);
        
        // Count total students
        const totalStudents = myClasses.reduce((acc: number, c: any) => acc + (c.studentIds?.length || 0), 0);
        
        setStats({
          totalClasses: myClasses.length,
          totalStudents,
          journalToday: journal.length,
          attendanceMarked: journal.length, // Simplified - assumes journal entry means attendance marked
        });
      } catch (error) {
        console.error("Failed to fetch teacher dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-6 mb-6 text-white">
        <h2 className="text-3xl font-bold mb-2">👨‍🏫 Selamat Datang, Guru {user.name}!</h2>
        <p className="text-green-100">Kelola pembelajaran dan jadwal mengajar Anda dengan mudah</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Kelas Saya</p>
              <p className="text-3xl font-bold text-blue-600">{isLoading ? '...' : stats.totalClasses}</p>
            </div>
            <UserGroupIcon className="h-10 w-10 text-blue-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Siswa</p>
              <p className="text-3xl font-bold text-purple-600">{isLoading ? '...' : stats.totalStudents}</p>
            </div>
            <AcademicCapIcon className="h-10 w-10 text-purple-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Jurnal Hari Ini</p>
              <p className="text-3xl font-bold text-green-600">{isLoading ? '...' : stats.journalToday}</p>
            </div>
            <BookOpenIcon className="h-10 w-10 text-green-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-amber-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase">Absensi Dicatat</p>
              <p className="text-3xl font-bold text-amber-600">{isLoading ? '...' : stats.attendanceMarked}</p>
            </div>
            <ClipboardDocumentListIcon className="h-10 w-10 text-amber-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <PencilSquareIcon className="h-5 w-5 mr-2" />
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Link to="/input-nilai" className="group bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 p-5 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all">
                <div className="flex items-center mb-2">
                  <ChartBarIcon className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                  <h4 className="ml-2 font-bold text-gray-800">Input Nilai</h4>
                </div>
                <p className="text-sm text-gray-600">Masukkan nilai siswa untuk ujian</p>
              </Link>

              <Link to="/absensi-siswa" className="group bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 p-5 rounded-lg border-2 border-transparent hover:border-green-300 transition-all">
                <div className="flex items-center mb-2">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform" />
                  <h4 className="ml-2 font-bold text-gray-800">Absensi Siswa</h4>
                </div>
                <p className="text-sm text-gray-600">Catat kehadiran siswa hari ini</p>
              </Link>

              <Link to="/jurnal-mengajar" className="group bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 p-5 rounded-lg border-2 border-transparent hover:border-purple-300 transition-all">
                <div className="flex items-center mb-2">
                  <BookOpenIcon className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
                  <h4 className="ml-2 font-bold text-gray-800">Jurnal Mengajar</h4>
                </div>
                <p className="text-sm text-gray-600">Isi jurnal pembelajaran hari ini</p>
              </Link>

              <Link to="/kelola-rapor" className="group bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 p-5 rounded-lg border-2 border-transparent hover:border-amber-300 transition-all">
                <div className="flex items-center mb-2">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-amber-600 group-hover:scale-110 transition-transform" />
                  <h4 className="ml-2 font-bold text-gray-800">Kelola Rapor</h4>
                </div>
                <p className="text-sm text-gray-600">Input dan kelola rapor siswa</p>
              </Link>

              <Link to="/lihat-nilai" className="group bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 p-5 rounded-lg border-2 border-transparent hover:border-indigo-300 transition-all">
                <div className="flex items-center mb-2">
                  <ChartBarIcon className="h-6 w-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <h4 className="ml-2 font-bold text-gray-800">Lihat Nilai</h4>
                </div>
                <p className="text-sm text-gray-600">Monitor nilai semua siswa</p>
              </Link>

              <Link to="/kelas-saya" className="group bg-gradient-to-br from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 p-5 rounded-lg border-2 border-transparent hover:border-teal-300 transition-all">
                <div className="flex items-center mb-2">
                  <UserGroupIcon className="h-6 w-6 text-teal-600 group-hover:scale-110 transition-transform" />
                  <h4 className="ml-2 font-bold text-gray-800">Kelas Saya</h4>
                </div>
                <p className="text-sm text-gray-600">Lihat daftar kelas yang diampu</p>
              </Link>
            </div>
          </div>

          {/* Journal Today */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2" />
                Jurnal Mengajar Hari Ini
              </h3>
              <Link
                to="/jurnal-mengajar"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                + Isi Jurnal
              </Link>
            </div>
            {isLoading ? (
              <p className="text-gray-500">Memuat jurnal...</p>
            ) : journalToday.length > 0 ? (
              <div className="space-y-3">
                {journalToday.map((entry, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                    <p className="font-bold text-blue-800 mb-1">{entry.subject} - {entry.class}</p>
                    <p className="text-sm text-blue-700">📚 Materi: {entry.topic}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <BookOpenIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Belum ada jurnal mengajar yang diisi untuk hari ini</p>
                <Link
                  to="/jurnal-mengajar"
                  className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  Isi Jurnal Sekarang →
                </Link>
              </div>
            )}
          </div>

          {/* Schedule Today */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Jadwal Mengajar Hari Ini
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500">
                <div>
                  <p className="text-sm text-gray-600">⏰ 07:30 - 09:00</p>
                  <p className="font-bold text-gray-800">Matematika - Kelas 10-A</p>
                </div>
                <BookOpenIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-l-4 border-blue-500">
                <div>
                  <p className="text-sm text-gray-600">⏰ 10:00 - 11:30</p>
                  <p className="font-bold text-gray-800">Matematika - Kelas 10-B</p>
                </div>
                <BookOpenIcon className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <Link
              to="/jadwal-pelajaran"
              className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              Lihat Jadwal Lengkap →
            </Link>
          </div>
        </div>

        {/* Right Column - Classes */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Kelas Saya
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                <p className="font-semibold text-blue-800">MA Kelas 10-A</p>
                <p className="text-xs text-blue-600">32 siswa</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                <p className="font-semibold text-purple-800">MA Kelas 10-B</p>
                <p className="text-xs text-purple-600">30 siswa</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                <p className="font-semibold text-green-800">MA Kelas 11-A</p>
                <p className="text-xs text-green-600">28 siswa</p>
              </div>
            </div>
            <Link
              to="/kelas-saya"
              className="mt-4 block text-center w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
            >
              Lihat Semua Kelas
            </Link>
          </div>

          {/* Performance Summary */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-3">📊 Performa Kelas</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-amber-100">Rata-rata Nilai</span>
                <span className="font-bold text-2xl">85.2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-100">Kehadiran</span>
                <span className="font-bold text-2xl">92%</span>
              </div>
            </div>
            <Link
              to="/lihat-nilai"
              className="mt-4 block text-center w-full py-2 bg-white text-orange-600 font-semibold rounded-lg hover:bg-amber-50 transition-colors"
            >
              Lihat Detail
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

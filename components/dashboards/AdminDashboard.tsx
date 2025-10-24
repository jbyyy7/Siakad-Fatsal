
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole } from '../../types';
import Card from '../Card';
import { dataService } from '../../services/dataService';
import { supabase } from '../../services/supabaseClient';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { BuildingLibraryIcon } from '../icons/BuildingLibraryIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import { CogIcon } from '../icons/CogIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { BookOpenIcon } from '../icons/BookOpenIcon';
import { IdentificationIcon } from '../icons/IdentificationIcon';
import { EnvelopeIcon } from '../icons/EnvelopeIcon';

interface AdminDashboardProps {
  user: User;
}

interface DashboardStats {
  // User stats
  totalUsers: number;
  adminCount: number;
  staffCount: number;
  teacherCount: number;
  studentCount: number;
  
  // School stats
  totalSchools: number;
  totalClasses: number;
  totalSubjects: number;
  
  // Attendance stats (today)
  todayGateCheckIns: number;
  todayLateArrivals: number;
  
  // Report Card stats
  totalReportCards: number;
  publishedReportCards: number;
  
  // Notifications
  totalNotifications: number;
  sentNotifications: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    adminCount: 0,
    staffCount: 0,
    teacherCount: 0,
    studentCount: 0,
    totalSchools: 0,
    totalClasses: 0,
    totalSubjects: 0,
    todayGateCheckIns: 0,
    todayLateArrivals: 0,
    totalReportCards: 0,
    publishedReportCards: 0,
    totalNotifications: 0,
    sentNotifications: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const [usersData, schoolsData, classesData, subjectsData] = await Promise.all([
          dataService.getUsers(),
          dataService.getSchools(),
          supabase.from('classes').select('*'),
          supabase.from('subjects').select('*'),
        ]);

        // Gate attendance stats (today)
        const { data: gateToday } = await supabase
          .from('gate_attendance')
          .select('*')
          .eq('date', today);

        // Report card stats
        const { data: reportCards } = await supabase
          .from('report_cards')
          .select('status');

        // Notification stats
        const { data: notifications } = await supabase
          .from('notification_logs')
          .select('status');

        setStats({
          totalUsers: usersData.length,
          adminCount: usersData.filter(u => u.role === UserRole.ADMIN).length,
          staffCount: usersData.filter(u => u.role === UserRole.STAFF).length,
          teacherCount: usersData.filter(u => u.role === UserRole.TEACHER).length,
          studentCount: usersData.filter(u => u.role === UserRole.STUDENT).length,
          totalSchools: schoolsData.length,
          totalClasses: classesData.data?.length || 0,
          totalSubjects: subjectsData.data?.length || 0,
          todayGateCheckIns: gateToday?.length || 0,
          todayLateArrivals: gateToday?.filter(g => g.late_arrival).length || 0,
          totalReportCards: reportCards?.length || 0,
          publishedReportCards: reportCards?.filter(r => r.status === 'Published').length || 0,
          totalNotifications: notifications?.length || 0,
          sentNotifications: notifications?.filter(n => n.status === 'Sent' || n.status === 'Delivered').length || 0,
        });
      } catch (error) {
        console.error("Failed to fetch admin dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
        <h2 className="text-3xl font-bold mb-2">👋 Selamat Datang, Administrator {user.name}!</h2>
        <p className="text-blue-100">Kelola seluruh sistem SIAKAD dengan mudah dan efisien</p>
      </div>

      {/* Primary Stats - Users */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <UserGroupIcon className="h-5 w-5 mr-2" />
          Statistik Pengguna
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Pengguna</p>
                <p className="text-2xl font-bold text-blue-600">{isLoading ? '...' : stats.totalUsers}</p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Admin</p>
                <p className="text-2xl font-bold text-red-600">{isLoading ? '...' : stats.adminCount}</p>
              </div>
              <div className="text-3xl">👨‍💼</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Staff</p>
                <p className="text-2xl font-bold text-orange-600">{isLoading ? '...' : stats.staffCount}</p>
              </div>
              <div className="text-3xl">👔</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Guru</p>
                <p className="text-2xl font-bold text-green-600">{isLoading ? '...' : stats.teacherCount}</p>
              </div>
              <div className="text-3xl">👨‍🏫</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Siswa</p>
                <p className="text-2xl font-bold text-purple-600">{isLoading ? '...' : stats.studentCount}</p>
              </div>
              <AcademicCapIcon className="h-10 w-10 text-purple-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats - School Data */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <BuildingLibraryIcon className="h-5 w-5 mr-2" />
          Data Sekolah & Akademik
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-md p-4 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-cyan-100 uppercase">Sekolah</p>
                <p className="text-3xl font-bold">{isLoading ? '...' : stats.totalSchools}</p>
              </div>
              <BuildingLibraryIcon className="h-12 w-12 text-cyan-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md p-4 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-100 uppercase">Kelas</p>
                <p className="text-3xl font-bold">{isLoading ? '...' : stats.totalClasses}</p>
              </div>
              <IdentificationIcon className="h-12 w-12 text-indigo-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg shadow-md p-4 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-pink-100 uppercase">Mata Pelajaran</p>
                <p className="text-3xl font-bold">{isLoading ? '...' : stats.totalSubjects}</p>
              </div>
              <BookOpenIcon className="h-12 w-12 text-pink-200 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-md p-4 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-100 uppercase">Rapor Terpublikasi</p>
                <p className="text-3xl font-bold">{isLoading ? '...' : stats.publishedReportCards}</p>
                <p className="text-xs text-amber-100 mt-1">dari {stats.totalReportCards} total</p>
              </div>
              <ClipboardDocumentListIcon className="h-12 w-12 text-amber-200 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Activity */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2" />
          Aktivitas Hari Ini
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-5 border-t-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-700">Check-in Gerbang</h4>
              <div className="text-2xl">🚪</div>
            </div>
            <p className="text-4xl font-bold text-green-600 mb-1">{isLoading ? '...' : stats.todayGateCheckIns}</p>
            <p className="text-xs text-gray-500">siswa masuk hari ini</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 border-t-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-700">Keterlambatan</h4>
              <div className="text-2xl">⏰</div>
            </div>
            <p className="text-4xl font-bold text-yellow-600 mb-1">{isLoading ? '...' : stats.todayLateArrivals}</p>
            <p className="text-xs text-gray-500">siswa terlambat hari ini</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 border-t-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-700">Notifikasi Terkirim</h4>
              <EnvelopeIcon className="h-7 w-7 text-blue-400" />
            </div>
            <p className="text-4xl font-bold text-blue-600 mb-1">{isLoading ? '...' : stats.sentNotifications}</p>
            <p className="text-xs text-gray-500">dari {stats.totalNotifications} total notifikasi</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <CogIcon className="h-5 w-5 mr-2" />
          Aksi Cepat
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Link to="/kelola-pengguna" className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 p-5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-300">
            <div className="flex items-center mb-3">
              <UserGroupIcon className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
              <h4 className="ml-3 font-bold text-gray-800">Kelola Pengguna</h4>
            </div>
            <p className="text-sm text-gray-600">Tambah, edit, dan hapus data pengguna sistem</p>
          </Link>

          <Link to="/kelola-sekolah" className="group bg-white hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 p-5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-cyan-300">
            <div className="flex items-center mb-3">
              <BuildingLibraryIcon className="h-8 w-8 text-cyan-600 group-hover:scale-110 transition-transform" />
              <h4 className="ml-3 font-bold text-gray-800">Kelola Sekolah</h4>
            </div>
            <p className="text-sm text-gray-600">Manajemen informasi dan data sekolah</p>
          </Link>

          <Link to="/kelola-kelas" className="group bg-white hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 p-5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-300">
            <div className="flex items-center mb-3">
              <IdentificationIcon className="h-8 w-8 text-indigo-600 group-hover:scale-110 transition-transform" />
              <h4 className="ml-3 font-bold text-gray-800">Kelola Kelas</h4>
            </div>
            <p className="text-sm text-gray-600">Atur kelas dan penempatan siswa</p>
          </Link>

          <Link to="/kelola-mapel" className="group bg-white hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 p-5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-pink-300">
            <div className="flex items-center mb-3">
              <BookOpenIcon className="h-8 w-8 text-pink-600 group-hover:scale-110 transition-transform" />
              <h4 className="ml-3 font-bold text-gray-800">Kelola Mapel</h4>
            </div>
            <p className="text-sm text-gray-600">Manajemen mata pelajaran sekolah</p>
          </Link>

          <Link to="/kartu-pelajar" className="group bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 p-5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-300">
            <div className="flex items-center mb-3">
              <div className="text-3xl group-hover:scale-110 transition-transform">🪪</div>
              <h4 className="ml-3 font-bold text-gray-800">Kartu Pelajar</h4>
            </div>
            <p className="text-sm text-gray-600">Generate kartu identitas siswa digital</p>
          </Link>

          <Link to="/tahun-ajaran" className="group bg-white hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 p-5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-300">
            <div className="flex items-center mb-3">
              <CalendarIcon className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform" />
              <h4 className="ml-3 font-bold text-gray-800">Tahun Ajaran</h4>
            </div>
            <p className="text-sm text-gray-600">Kelola tahun ajaran dan semester</p>
          </Link>

          <Link to="/kelola-rapor" className="group bg-white hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 p-5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-amber-300">
            <div className="flex items-center mb-3">
              <ClipboardDocumentListIcon className="h-8 w-8 text-amber-600 group-hover:scale-110 transition-transform" />
              <h4 className="ml-3 font-bold text-gray-800">Kelola Rapor</h4>
            </div>
            <p className="text-sm text-gray-600">Input dan manajemen rapor siswa</p>
          </Link>

          <Link to="/absensi-gerbang" className="group bg-white hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 p-5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-teal-300">
            <div className="flex items-center mb-3">
              <div className="text-3xl group-hover:scale-110 transition-transform">🚪</div>
              <h4 className="ml-3 font-bold text-gray-800">Absensi Gerbang</h4>
            </div>
            <p className="text-sm text-gray-600">Monitoring check-in/out siswa real-time</p>
          </Link>

          <Link to="/analytics-gerbang" className="group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 p-5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-300">
            <div className="flex items-center mb-3">
              <ChartBarIcon className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
              <h4 className="ml-3 font-bold text-gray-800">Analytics Gerbang</h4>
            </div>
            <p className="text-sm text-gray-600">Analisis statistik absensi gerbang</p>
          </Link>

          <Link to="/pantau-absensi" className="group bg-white hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 p-5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-violet-300">
            <div className="flex items-center mb-3">
              <CalendarIcon className="h-8 w-8 text-violet-600 group-hover:scale-110 transition-transform" />
              <h4 className="ml-3 font-bold text-gray-800">Pantau Absensi</h4>
            </div>
            <p className="text-sm text-gray-600">Monitor kehadiran siswa per kelas</p>
          </Link>

          <Link to="/pantau-nilai" className="group bg-white hover:bg-gradient-to-br hover:from-rose-50 hover:to-red-50 p-5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-rose-300">
            <div className="flex items-center mb-3">
              <ClipboardDocumentListIcon className="h-8 w-8 text-rose-600 group-hover:scale-110 transition-transform" />
              <h4 className="ml-3 font-bold text-gray-800">Pantau Nilai</h4>
            </div>
            <p className="text-sm text-gray-600">Monitoring nilai siswa semua sekolah</p>
          </Link>

          <Link to="/pengaturan-sistem" className="group bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 p-5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-gray-400">
            <div className="flex items-center mb-3">
              <CogIcon className="h-8 w-8 text-gray-600 group-hover:scale-110 transition-transform" />
              <h4 className="ml-3 font-bold text-gray-800">Pengaturan</h4>
            </div>
            <p className="text-sm text-gray-600">Konfigurasi dan setting sistem</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, UserRole } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { BuildingLibraryIcon } from './icons/BuildingLibraryIcon';
import { TagIcon } from './icons/TagIcon';
import { IdentificationIcon } from './icons/IdentificationIcon';
import { CogIcon } from './icons/CogIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ArrowRightOnRectangleIcon } from './icons/ArrowRightOnRectangleIcon';

interface SidebarProps {
  user: User;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  end?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, children, end = false }) => {
  const baseClasses = "flex items-center px-4 py-3 text-sm font-medium text-gray-200 rounded-lg transition-all duration-200";
  const hoverClasses = "hover:bg-brand-700 hover:text-white hover:pl-5";
  const activeClasses = "bg-brand-800 text-white border-l-4 border-yellow-400 pl-4";

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `${baseClasses} ${hoverClasses} ${isActive ? activeClasses : ''}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="ml-3 truncate">{children}</span>
    </NavLink>
  );
};


const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, setOpen }) => {

  const adminLinks = (
    <>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Manajemen</div>
      <NavItem to="/kelola-pengguna" icon={<UserGroupIcon className="h-5 w-5" />}>Kelola Pengguna</NavItem>
      <NavItem to="/kelola-sekolah" icon={<BuildingLibraryIcon className="h-5 w-5" />}>Kelola Sekolah</NavItem>
      <NavItem to="/kelola-mapel" icon={<TagIcon className="h-5 w-5" />}>Kelola Mapel</NavItem>
      <NavItem to="/kelola-kelas" icon={<IdentificationIcon className="h-5 w-5" />}>Kelola Kelas</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Monitoring</div>
      <NavItem to="/monitoring-akademik" icon={<ChartBarIcon className="h-5 w-5" />}>Monitoring Akademik</NavItem>
      <NavItem to="/teacher-attendance" icon={<CalendarIcon className="h-5 w-5" />}>Absensi Guru</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Gate System</div>
      <NavItem to="/absensi-gerbang" icon={<ArrowRightOnRectangleIcon className="h-5 w-5" />}>Absensi Gerbang</NavItem>
      <NavItem to="/analytics-gerbang" icon={<ChartBarIcon className="h-5 w-5" />}>Analytics Gerbang</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Akademik</div>
      <NavItem to="/kartu-pelajar" icon={<IdentificationIcon className="h-5 w-5" />}>Kartu Pelajar</NavItem>
      <NavItem to="/tahun-ajaran" icon={<CalendarIcon className="h-5 w-5" />}>Tahun Ajaran</NavItem>
      <NavItem to="/kelola-rapor" icon={<ClipboardDocumentListIcon className="h-5 w-5" />}>Kelola Rapor</NavItem>
      <NavItem to="/lihat-rapor" icon={<BookOpenIcon className="h-5 w-5" />}>Lihat Rapor</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Sistem</div>
      <NavItem to="/pengaturan-sistem" icon={<CogIcon className="h-5 w-5" />}>Pengaturan Sistem</NavItem>
    </>
  );

  const staffLinks = (
    <>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Manajemen</div>
      <NavItem to="/manage-users" icon={<UserGroupIcon className="h-5 w-5" />}>Kelola Pengguna</NavItem>
      <NavItem to="/manage-classes" icon={<IdentificationIcon className="h-5 w-5" />}>Kelola Kelas</NavItem>
      <NavItem to="/manage-subjects" icon={<TagIcon className="h-5 w-5" />}>Kelola Mapel</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Absensi & Nilai</div>
      <NavItem to="/student-attendance" icon={<CalendarIcon className="h-5 w-5" />}>Absensi Siswa</NavItem>
      <NavItem to="/teacher-attendance" icon={<CalendarIcon className="h-5 w-5" />}>Absensi Guru</NavItem>
      <NavItem to="/absensi-saya" icon={<ClipboardDocumentListIcon className="h-5 w-5" />}>Absensi Saya</NavItem>
      <NavItem to="/grades" icon={<ClipboardDocumentListIcon className="h-5 w-5" />}>Nilai</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Gate & Rapor</div>
      <NavItem to="/absensi-gerbang" icon={<ArrowRightOnRectangleIcon className="h-5 w-5" />}>Absensi Gerbang</NavItem>
      <NavItem to="/analytics-gerbang" icon={<ChartBarIcon className="h-5 w-5" />}>Analytics Gerbang</NavItem>
      <NavItem to="/kartu-pelajar" icon={<IdentificationIcon className="h-5 w-5" />}>Kartu Pelajar</NavItem>
      <NavItem to="/tahun-ajaran" icon={<CalendarIcon className="h-5 w-5" />}>Tahun Ajaran</NavItem>
      <NavItem to="/kelola-rapor" icon={<ClipboardDocumentListIcon className="h-5 w-5" />}>Kelola Rapor</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Komunikasi</div>
      <NavItem to="/announcements" icon={<EnvelopeIcon className="h-5 w-5" />}>Pengumuman</NavItem>
    </>
  );

  const foundationHeadLinks = (
    <>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Laporan & Data</div>
      <NavItem to="/laporan-akademik" icon={<ChartBarIcon className="h-5 w-5" />}>Laporan Akademik</NavItem>
      <NavItem to="/data-sekolah" icon={<BuildingLibraryIcon className="h-5 w-5" />}>Data Sekolah</NavItem>
      <NavItem to="/analytics-dashboard" icon={<ChartBarIcon className="h-5 w-5" />}>Analytics</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Komunikasi</div>
      <NavItem to="/pengumuman" icon={<EnvelopeIcon className="h-5 w-5" />}>Pengumuman Global</NavItem>
    </>
  );

  const principalLinks = (
    <>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Data Sekolah</div>
      <NavItem to="/data-guru" icon={<UserGroupIcon className="h-5 w-5" />}>Data Guru</NavItem>
      <NavItem to="/data-siswa" icon={<AcademicCapIcon className="h-5 w-5" />}>Data Siswa</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Laporan & Absensi</div>
      <NavItem to="/laporan-sekolah" icon={<ChartBarIcon className="h-5 w-5" />}>Laporan Sekolah</NavItem>
      <NavItem to="/teacher-attendance" icon={<CalendarIcon className="h-5 w-5" />}>Absensi Guru</NavItem>
      <NavItem to="/absensi-saya" icon={<ClipboardDocumentListIcon className="h-5 w-5" />}>Absensi Saya</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Komunikasi</div>
      <NavItem to="/pengumuman" icon={<EnvelopeIcon className="h-5 w-5" />}>Pengumuman Sekolah</NavItem>
    </>
  );

  const teacherLinks = (
    <>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Pengajaran</div>
      <NavItem to="/kelas-saya" icon={<UserGroupIcon className="h-5 w-5" />}>Kelas Saya</NavItem>
      <NavItem to="/jurnal-mengajar" icon={<BookOpenIcon className="h-5 w-5" />}>Jurnal Mengajar</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Penilaian</div>
      <NavItem to="/input-nilai" icon={<PencilSquareIcon className="h-5 w-5" />}>Input Nilai</NavItem>
      <NavItem to="/absensi-siswa" icon={<CalendarIcon className="h-5 w-5" />}>Absensi Siswa</NavItem>
      <NavItem to="/absensi-saya" icon={<ClipboardDocumentListIcon className="h-5 w-5" />}>Absensi Saya</NavItem>
      <NavItem to="/kelola-rapor" icon={<ClipboardDocumentListIcon className="h-5 w-5" />}>Kelola Rapor</NavItem>
    </>
  );

  const studentLinks = (
    <>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Akademik</div>
      <NavItem to="/lihat-nilai" icon={<AcademicCapIcon className="h-5 w-5" />}>Lihat Nilai</NavItem>
      <NavItem to="/jadwal-pelajaran" icon={<CalendarIcon className="h-5 w-5" />}>Jadwal Pelajaran</NavItem>
      <NavItem to="/rapor-saya" icon={<BookOpenIcon className="h-5 w-5" />}>Rapor Saya</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">Kehadiran</div>
      <NavItem to="/absensi" icon={<ClipboardDocumentListIcon className="h-5 w-5" />}>Absensi Saya</NavItem>
      <NavItem to="/qr-gerbang" icon={<ArrowRightOnRectangleIcon className="h-5 w-5" />}>QR Code Gerbang</NavItem>
      
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mt-4 mb-2">E-Learning</div>
      <NavItem to="/materi-pelajaran" icon={<BookOpenIcon className="h-5 w-5" />}>Materi Pelajaran</NavItem>
      <NavItem to="/tugas-saya" icon={<ClipboardDocumentListIcon className="h-5 w-5" />}>Tugas Saya</NavItem>
    </>
  );

  const renderLinksByRole = () => {
    switch (user.role) {
      case UserRole.ADMIN: return adminLinks;
      case UserRole.STAFF: return staffLinks;
      case UserRole.FOUNDATION_HEAD: return foundationHeadLinks;
      case UserRole.PRINCIPAL: return principalLinks;
      case UserRole.TEACHER: return teacherLinks;
      case UserRole.STUDENT: return studentLinks;
      default: return null;
    }
  };

  const sidebarClasses = `fixed inset-y-0 left-0 bg-gradient-to-b from-brand-900 to-brand-950 w-72 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 lg:relative lg:translate-x-0 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
  const overlayClasses = `fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;

  return (
    <>
        <div className={sidebarClasses}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-brand-800 flex-shrink-0">
            <div className="flex items-center text-white">
              <AcademicCapIcon className="h-8 w-8 mr-3 text-yellow-400" />
              <div className="flex flex-col">
                <span className="text-lg font-bold">SIAKAD</span>
                <span className="text-xs text-gray-300">Fathus Salafi</span>
              </div>
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={() => setOpen(false)}
              className="lg:hidden text-gray-300 hover:text-white p-1 rounded-lg hover:bg-brand-800 transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-brand-700 scrollbar-track-brand-900">
            <NavItem to="/" icon={<HomeIcon className="h-5 w-5" />} end={true}>Dashboard</NavItem>
            <NavItem to="/pengaturan-akun" icon={<UserCircleIcon className="h-5 w-5" />}>Pengaturan Akun</NavItem>
            
            <div className="my-3 border-t border-brand-800"></div>
            
            {renderLinksByRole()}
          </nav>

          {/* Footer with user info */}
          <div className="px-4 py-3 border-t border-brand-800 bg-brand-950 flex-shrink-0">
            <div className="flex items-center text-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-brand-900 font-bold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user.name}</p>
                <p className="text-gray-400 text-xs truncate">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
        <div className={overlayClasses} onClick={() => setOpen(false)}></div>
    </>
  );
};

export default Sidebar;
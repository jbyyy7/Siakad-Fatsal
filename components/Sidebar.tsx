
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
import { SparklesIcon } from './icons/SparklesIcon';

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
  const baseClasses = "flex items-center px-3 py-2.5 text-sm font-medium text-gray-200 rounded-lg";
  const hoverClasses = "hover:bg-brand-700 hover:text-white";
  const activeClasses = "bg-brand-800 text-white";

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `${baseClasses} ${hoverClasses} ${isActive ? activeClasses : ''}`}
    >
      {icon}
      <span className="ml-3">{children}</span>
    </NavLink>
  );
};


const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, setOpen }) => {

  const adminLinks = (
    <>
      <NavItem to="/kelola-pengguna" icon={<UserGroupIcon className="h-5 w-5" />}>Kelola Pengguna</NavItem>
      <NavItem to="/kelola-sekolah" icon={<BuildingLibraryIcon className="h-5 w-5" />}>Kelola Sekolah</NavItem>
      <NavItem to="/kelola-mapel" icon={<TagIcon className="h-5 w-5" />}>Kelola Mapel</NavItem>
      <NavItem to="/kelola-kelas" icon={<IdentificationIcon className="h-5 w-5" />}>Kelola Kelas</NavItem>
      <NavItem to="/pantau-absensi" icon={<CalendarIcon className="h-5 w-5" />}>Pantau Absensi</NavItem>
      <NavItem to="/pantau-nilai" icon={<ClipboardDocumentListIcon className="h-5 w-5" />}>Pantau Nilai</NavItem>
      <hr className="my-2 border-gray-600" />
      <NavItem to="/pengaturan-sistem" icon={<CogIcon className="h-5 w-5" />}>Pengaturan</NavItem>
    </>
  );

  const foundationHeadLinks = (
    <>
      <NavItem to="/laporan-akademik" icon={<ChartBarIcon className="h-5 w-5" />}>Laporan Akademik</NavItem>
      <NavItem to="/data-sekolah" icon={<BuildingLibraryIcon className="h-5 w-5" />}>Data Sekolah</NavItem>
      <NavItem to="/pengumuman" icon={<EnvelopeIcon className="h-5 w-5" />}>Pengumuman</NavItem>
    </>
  );

  const principalLinks = (
    <>
      <NavItem to="/data-guru" icon={<UserGroupIcon className="h-5 w-5" />}>Data Guru</NavItem>
      <NavItem to="/data-siswa" icon={<AcademicCapIcon className="h-5 w-5" />}>Data Siswa</NavItem>
      <NavItem to="/laporan-sekolah" icon={<ChartBarIcon className="h-5 w-5" />}>Laporan Sekolah</NavItem>
      <NavItem to="/pengumuman" icon={<EnvelopeIcon className="h-5 w-5" />}>Pengumuman</NavItem>
    </>
  );

  const teacherLinks = (
    <>
      <NavItem to="/input-nilai" icon={<PencilSquareIcon className="h-5 w-5" />}>Input Nilai</NavItem>
      <NavItem to="/absensi-siswa" icon={<CalendarIcon className="h-5 w-5" />}>Absensi Siswa</NavItem>
      <NavItem to="/kelas-saya" icon={<UserGroupIcon className="h-5 w-5" />}>Kelas Saya</NavItem>
      <NavItem to="/jurnal-mengajar" icon={<BookOpenIcon className="h-5 w-5" />}>Jurnal Mengajar</NavItem>
    </>
  );

  const studentLinks = (
    <>
      <NavItem to="/lihat-nilai" icon={<AcademicCapIcon className="h-5 w-5" />}>Lihat Nilai</NavItem>
      <NavItem to="/jadwal-pelajaran" icon={<CalendarIcon className="h-5 w-5" />}>Jadwal Pelajaran</NavItem>
      <NavItem to="/absensi" icon={<ClipboardDocumentListIcon className="h-5 w-5" />}>Absensi Saya</NavItem>
    </>
  );

  const renderLinksByRole = () => {
    switch (user.role) {
      case UserRole.ADMIN: return adminLinks;
      case UserRole.FOUNDATION_HEAD: return foundationHeadLinks;
      case UserRole.PRINCIPAL: return principalLinks;
      case UserRole.TEACHER: return teacherLinks;
      case UserRole.STUDENT: return studentLinks;
      default: return null;
    }
  };

  const sidebarClasses = `fixed inset-y-0 left-0 bg-brand-900 w-64 p-4 transform transition-transform duration-300 ease-in-out z-30 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
  const overlayClasses = `fixed inset-0 bg-black opacity-50 z-20 md:hidden ${isOpen ? 'block' : 'hidden'}`;

  return (
    <>
        <div className={sidebarClasses}>
          <div className="flex items-center justify-center text-white mb-6">
            <SparklesIcon className="h-8 w-8 mr-2" />
            <span className="text-xl font-bold">SIAKAD</span>
          </div>
          <nav className="space-y-2">
              <NavItem to="/" icon={<HomeIcon className="h-5 w-5" />} end={true}>Dashboard</NavItem>
              {renderLinksByRole()}
          </nav>
        </div>
        <div className={overlayClasses} onClick={() => setOpen(false)}></div>
    </>
  );
};

export default Sidebar;

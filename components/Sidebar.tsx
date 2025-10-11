import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { User, UserRole } from '../types';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { HomeIcon } from './icons/HomeIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { BuildingLibraryIcon } from './icons/BuildingLibraryIcon';
import { CogIcon } from './icons/CogIcon';
import { IdentificationIcon } from './icons/IdentificationIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { XIcon } from './icons/XIcon';
import { TagIcon } from './icons/TagIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';

interface SidebarProps {
  user: User;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{ to: string, icon: React.ReactNode, children: React.ReactNode }> = ({ to, icon, children }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-brand-700 text-white shadow-sm'
          : 'text-gray-200 hover:bg-brand-700 hover:text-white'
      }`
    }
  >
    {icon}
    <span className="ml-3">{children}</span>
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, setOpen }) => {
  const adminLinks = (
    <>
      <NavItem to="/kelola-pengguna" icon={<UserGroupIcon className="h-5 w-5" />}>Kelola Pengguna</NavItem>
      <NavItem to="/kelola-sekolah" icon={<BuildingLibraryIcon className="h-5 w-5" />}>Kelola Sekolah</NavItem>
      <NavItem to="/kelola-mapel" icon={<TagIcon className="h-5 w-5" />}>Kelola Mapel</NavItem>
      <NavItem to="/kelola-kelas" icon={<IdentificationIcon className="h-5 w-5" />}>Kelola Kelas</NavItem>
      <NavItem to="/pantau-absensi" icon={<CalendarIcon className="h-5 w-5" />}>Pantau Absensi</NavItem>
      <NavItem to="/pantau-nilai" icon={<PencilSquareIcon className="h-5 w-5" />}>Pantau Nilai</NavItem>
      <NavItem to="/pengaturan-sistem" icon={<CogIcon className="h-5 w-5" />}>Pengaturan Sistem</NavItem>
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
      <NavItem to="/lihat-nilai" icon={<PencilSquareIcon className="h-5 w-5" />}>Lihat Nilai</NavItem>
      <NavItem to="/jadwal-pelajaran" icon={<CalendarIcon className="h-5 w-5" />}>Jadwal Pelajaran</NavItem>
      <NavItem to="/absensi" icon={<CalendarIcon className="h-5 w-5" />}>Absensi Saya</NavItem>
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

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
      ></div>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-brand-800 text-white flex flex-col transition-transform transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-brand-700">
          <Link to="/" className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-white" />
            <span className="ml-3 text-xl font-bold">SIAKAD</span>
          </Link>
          <button onClick={() => setOpen(false)} className="md:hidden p-1 rounded-full hover:bg-brand-700">
            <XIcon className="h-6 w-6"/>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-2">
          <NavItem to="/" icon={<HomeIcon className="h-5 w-5" />}>Dashboard</NavItem>
          {renderLinksByRole()}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

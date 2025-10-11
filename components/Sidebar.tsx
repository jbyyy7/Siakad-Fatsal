
import React from 'react';
import { User, UserRole } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { CogIcon } from './icons/CogIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { BuildingLibraryIcon } from './icons/BuildingLibraryIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { IdentificationIcon } from './icons/IdentificationIcon';
import { TagIcon } from './icons/TagIcon';
import { XIcon } from './icons/XIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { PencilIcon } from './icons/PencilIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';


interface SidebarProps {
  user: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-brand-700 text-white shadow'
        : 'text-gray-200 hover:bg-brand-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-4">{label}</span>
  </button>
);

const getNavLinks = (role: UserRole) => {
    const baseLinks = [{ label: 'Dashboard', icon: <HomeIcon className="w-5 h-5" /> }];
    
    switch (role) {
        case UserRole.STUDENT:
            return [
                ...baseLinks,
                { label: 'Jadwal Pelajaran', icon: <ClipboardDocumentListIcon className="w-5 h-5" /> },
                { label: 'Lihat Nilai', icon: <AcademicCapIcon className="w-5 h-5" /> },
                { label: 'Absensi', icon: <IdentificationIcon className="w-5 h-5" /> },
            ];
        case UserRole.TEACHER:
            return [
                ...baseLinks,
                { label: 'Jurnal Mengajar', icon: <PencilSquareIcon className="w-5 h-5" /> },
                { label: 'Input Nilai', icon: <PencilIcon className="w-5 h-5" /> },
                { label: 'Absensi Siswa', icon: <IdentificationIcon className="w-5 h-5" /> },
                { label: 'Kelas Saya', icon: <UserGroupIcon className="w-5 h-5" /> },
            ];
        case UserRole.PRINCIPAL:
             return [
                ...baseLinks,
                { label: 'Data Guru', icon: <UserGroupIcon className="w-5 h-5" /> },
                { label: 'Data Siswa', icon: <AcademicCapIcon className="w-5 h-5" /> },
                { label: 'Laporan Sekolah', icon: <ChartBarIcon className="w-5 h-5" /> },
            ];
        case UserRole.FOUNDATION_HEAD:
            return [
                ...baseLinks,
                { label: 'Laporan Akademik', icon: <ChartBarIcon className="w-5 h-5" /> },
                { label: 'Data Sekolah', icon: <BuildingLibraryIcon className="w-5 h-5" /> },
                { label: 'Pengumuman', icon: <EnvelopeIcon className="w-5 h-5" /> },
            ];
        case UserRole.ADMIN:
            return [
                ...baseLinks,
                { label: 'Kelola Pengguna', icon: <UserGroupIcon className="w-5 h-5" /> },
                { label: 'Kelola Sekolah', icon: <BuildingLibraryIcon className="w-5 h-5" /> },
                { label: 'Kelola Mata Pelajaran', icon: <TagIcon className="w-5 h-5" /> },
                { label: 'Kelola Kelas', icon: <BookOpenIcon className="w-5 h-5" /> },
                { label: 'Pengaturan Sistem', icon: <CogIcon className="w-5 h-5" /> },
            ];
        default:
            return baseLinks;
    }
}

const Sidebar: React.FC<SidebarProps> = ({ user, currentPage, onNavigate, isOpen, setIsOpen }) => {
  const navLinks = getNavLinks(user.role);

  return (
    <>
      {/* Overlay for mobile */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={() => setIsOpen(false)}></div>
      
      <aside className={`fixed md:relative inset-y-0 left-0 bg-brand-900 text-white w-64 space-y-6 py-4 px-2 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col`}>
        <div className="px-4">
            <div className="flex justify-between items-center">
                <a href="#" className="flex items-center space-x-2">
                    <AcademicCapIcon className="h-8 w-8 text-white" />
                    <span className="text-xl font-bold">SIAKAD</span>
                </a>
                <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-md hover:bg-brand-800">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            <p className="text-xs text-brand-300 mt-1">Sistem Informasi Akademik</p>
        </div>

        <nav className="flex-1">
          <ul className="space-y-2">
            {navLinks.map(({ label, icon }) => (
              <li key={label}>
                <NavLink
                  label={label}
                  icon={icon}
                  isActive={currentPage === label}
                  onClick={() => onNavigate(label)}
                />
              </li>
            ))}
          </ul>
        </nav>
        
         <div className="px-4 py-2 border-t border-brand-800">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-brand-300">{user.role}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

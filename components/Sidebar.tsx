import React, { Fragment } from 'react';
import { User, UserRole } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { CogIcon } from './icons/CogIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { BuildingLibraryIcon } from './icons/BuildingLibraryIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';
import { XIcon } from './icons/XIcon';
import { TagIcon } from './icons/TagIcon';

interface SidebarProps {
  user: User;
  activePage: string;
  onNavigate: (page: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const getNavItems = (role: UserRole) => {
    const baseItems = [
        { name: 'Dashboard', icon: HomeIcon, href: '#' },
    ];
    
    switch (role) {
        case UserRole.ADMIN:
            return [
                ...baseItems,
                { name: 'Kelola Sekolah', icon: BuildingLibraryIcon, href: '#' },
                { name: 'Kelola Pengguna', icon: UserGroupIcon, href: '#' },
                { name: 'Kelola Mata Pelajaran', icon: TagIcon, href: '#' },
                { name: 'Pengaturan Sistem', icon: CogIcon, href: '#' },
            ];
        case UserRole.FOUNDATION_HEAD:
            return [
                ...baseItems,
                { name: 'Laporan Akademik', icon: ChartBarIcon, href: '#' },
                { name: 'Data Sekolah', icon: BuildingLibraryIcon, href: '#' },
                { name: 'Pengumuman', icon: EnvelopeIcon, href: '#' },
            ];
        case UserRole.PRINCIPAL:
            return [
                ...baseItems,
                { name: 'Data Guru', icon: UserGroupIcon, href: '#' },
                { name: 'Data Siswa', icon: AcademicCapIcon, href: '#' },
                { name: 'Jadwal Pelajaran', icon: ClipboardDocumentListIcon, href: '#' },
                { name: 'Laporan Sekolah', icon: ChartBarIcon, href: '#' },
            ];
        case UserRole.TEACHER:
            return [
                ...baseItems,
                { name: 'Kelas Saya', icon: BuildingLibraryIcon, href: '#' },
                { name: 'Input Nilai', icon: ClipboardDocumentListIcon, href: '#' },
                { name: 'Absensi Siswa', icon: UserGroupIcon, href: '#' },
            ];
        case UserRole.STUDENT:
            return [
                ...baseItems,
                ...baseItems,
                { name: 'Jadwal Pelajaran', icon: ClipboardDocumentListIcon, href: '#' },
                { name: 'Lihat Nilai', icon: ChartBarIcon, href: '#' },
                { name: 'Absensi', icon: UserGroupIcon, href: '#' },
            ];
        default:
            return baseItems;
    }
};

const Sidebar: React.FC<SidebarProps> = ({ user, activePage, onNavigate, isSidebarOpen, setIsSidebarOpen }) => {
    const navItems = getNavItems(user.role);

    const handleNavigate = (page: string) => {
        onNavigate(page);
        setIsSidebarOpen(false); // Close sidebar on navigation
    }

    const SidebarContent = () => (
        <div className="flex flex-col w-64">
            <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-brand-800 text-white">
                <div className="flex items-center">
                    <AcademicCapIcon className="h-8 w-8 mr-2"/>
                    <span className="font-semibold text-lg">SIAKAD</span>
                </div>
                 {/* Close button for mobile */}
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="md:hidden p-1 text-brand-200 hover:text-white"
                    aria-label="Close sidebar"
                >
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto bg-brand-900">
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navItems.map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            onClick={(e) => {
                                e.preventDefault();
                                handleNavigate(item.name);
                            }}
                            className={`
                                ${activePage === item.name ? 'bg-brand-700 text-white' : 'text-brand-100 hover:bg-brand-800 hover:text-white'}
                                group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer
                            `}
                        >
                            <item.icon className="mr-3 flex-shrink-0 h-6 w-6 text-brand-300" />
                            {item.name}
                        </a>
                    ))}
                </nav>
            </div>
        </div>
    );

    return (
        <Fragment>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:flex-shrink-0">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 flex z-40 md:hidden ${isSidebarOpen ? '' : 'pointer-events-none'}`}>
                {/* Overlay */}
                <div 
                    className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>

                {/* Sidebar Panel */}
                <div className={`relative flex-1 flex flex-col max-w-xs w-full transform transition-transform ease-in-out duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <SidebarContent />
                </div>
            </div>
        </Fragment>
    );
};

export default Sidebar;
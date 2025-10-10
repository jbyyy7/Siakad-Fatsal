import React from 'react';
import { User, UserRole } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { CogIcon } from './icons/CogIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { BuildingLibraryIcon } from './icons/BuildingLibraryIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';

interface SidebarProps {
  user: User;
  activePage: string;
  onNavigate: (page: string) => void;
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
                { name: 'Jadwal Pelajaran', icon: ClipboardDocumentListIcon, href: '#' },
                { name: 'Lihat Nilai', icon: ChartBarIcon, href: '#' },
                { name: 'Absensi', icon: UserGroupIcon, href: '#' },
            ];
        default:
            return baseItems;
    }
};

const Sidebar: React.FC<SidebarProps> = ({ user, activePage, onNavigate }) => {
    const navItems = getNavItems(user.role);

    return (
        <div className="hidden md:flex md:flex-shrink-0">
            <div className="flex flex-col w-64">
                <div className="flex items-center h-16 flex-shrink-0 px-4 bg-brand-800 text-white">
                    <AcademicCapIcon className="h-8 w-8 mr-2"/>
                    <span className="font-semibold text-lg">SIAKAD</span>
                </div>
                <div className="flex-1 flex flex-col overflow-y-auto bg-brand-900">
                    <nav className="flex-1 px-2 py-4 space-y-1">
                        {navItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onNavigate(item.name);
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
        </div>
    );
};

export default Sidebar;
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Announcement } from '../types';
import { LogoutIcon } from './icons/LogoutIcon';
import { MenuIcon } from './icons/MenuIcon';
import { BellIcon } from './icons/BellIcon';
import { dataService } from '../services/dataService';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onMenuClick: () => void;
}

const pathToPage = (path: string): string => {
    if (path === '/') return 'Dashboard';
    // Hapus garis miring di awal, ganti tanda hubung dengan spasi, dan kapitalisasi setiap kata
    return path.substring(1).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const Header: React.FC<HeaderProps> = ({ user, onLogout, onMenuClick }) => {
  const location = useLocation();
  const pageTitle = pathToPage(location.pathname);
  const [showNotifications, setShowNotifications] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch announcements when notification dropdown is opened
  useEffect(() => {
    if (showNotifications && announcements.length === 0) {
      fetchAnnouncements();
    }
  }, [showNotifications]);

  const fetchAnnouncements = async () => {
    setIsLoadingAnnouncements(true);
    try {
      const data = await dataService.getAnnouncements();
      // Get latest 5 announcements
      setAnnouncements(data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      setAnnouncements([]);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
            setShowNotifications(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationRef]);


  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 lg:px-6 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
      <div className="flex items-center flex-1 min-w-0">
         {/* Hamburger Menu Button for Mobile */}
        <button
            onClick={onMenuClick}
            className="lg:hidden mr-3 p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Open sidebar"
        >
            <MenuIcon className="h-6 w-6" />
        </button>
        <h1 className="text-lg lg:text-xl font-semibold text-gray-800 truncate">{pageTitle}</h1>
      </div>
      
      <div className="flex items-center gap-1 lg:gap-2">
        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            aria-label="Notifikasi"
          >
            <BellIcon className="h-5 w-5 lg:h-6 lg:w-6" />
            {/* Only show badge if there are unread notifications */}
            {announcements.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[90vh] flex flex-col animate-fade-in-up origin-top-right">
              <div className="p-4 font-semibold text-gray-900 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <span>Pengumuman Terbaru</span>
                <span className="text-xs font-normal text-gray-500">{announcements.length} item</span>
              </div>
              
              {isLoadingAnnouncements ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-3"></div>
                  <p className="text-sm">Memuat pengumuman...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">Belum ada pengumuman</p>
                  <p className="text-xs mt-1">Pengumuman baru akan muncul di sini</p>
                </div>
              ) : (
                <ul className="flex-1 overflow-y-auto">
                  {announcements.map((announcement) => (
                    <li 
                      key={announcement.id} 
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <p className="text-sm text-gray-900 font-medium line-clamp-2 mb-1">
                        {announcement.title}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(announcement.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="p-3 border-t border-gray-200 text-center bg-gray-50 rounded-b-xl flex-shrink-0">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    window.location.hash = '#/announcements';
                  }}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium hover:underline"
                >
                  Lihat Semua Pengumuman →
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* User Info - Hidden on small screens */}
        <div className="hidden md:flex flex-col items-end mx-3 min-w-0">
            <span className="font-semibold text-gray-900 text-sm truncate max-w-[150px] lg:max-w-none">{user.name}</span>
            <span className="text-xs text-gray-500 truncate max-w-[150px] lg:max-w-none">{user.role}{user.schoolName ? ` - ${user.schoolName}` : ''}</span>
        </div>
        
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img className="h-9 w-9 lg:h-10 lg:w-10 rounded-full object-cover ring-2 ring-gray-200" src={user.avatarUrl} alt={user.name} />
          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          aria-label="Logout"
          title="Keluar"
        >
          <LogoutIcon className="h-5 w-5 lg:h-6 lg:w-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
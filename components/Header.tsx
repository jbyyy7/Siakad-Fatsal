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
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center">
         {/* Hamburger Menu Button for Mobile */}
        <button
            onClick={onMenuClick}
            className="md:hidden mr-4 p-1 text-gray-500 hover:text-gray-800"
            aria-label="Open sidebar"
        >
            <MenuIcon className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-700">{pageTitle}</h1>
      </div>
      <div className="flex items-center">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            aria-label="Notifikasi"
          >
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20 animate-fade-in-up origin-top-right">
              <div className="p-3 font-semibold text-gray-800 border-b">
                Pengumuman Terbaru
              </div>
              
              {isLoadingAnnouncements ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mx-auto mb-2"></div>
                  Memuat pengumuman...
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">Belum ada pengumuman</p>
                </div>
              ) : (
                <ul className="py-1 max-h-80 overflow-y-auto">
                  {announcements.map((announcement) => (
                    <li 
                      key={announcement.id} 
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    >
                      <p className="text-sm text-gray-800 font-medium line-clamp-2">
                        {announcement.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
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
              
              <div className="p-2 border-t text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    window.location.hash = '#/announcements';
                  }}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  Lihat Semua Pengumuman
                </button>
              </div>
            </div>
          )}

        </div>
        
        <div className="hidden sm:flex flex-col items-end mx-4">
            <span className="font-semibold text-gray-800">{user.name}</span>
            <span className="text-sm text-gray-500">{user.role}{user.schoolName ? ` - ${user.schoolName}` : ''}</span>
        </div>
        <img className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl} alt="User Avatar" />
        <button
          onClick={onLogout}
          className="ml-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          aria-label="Logout"
        >
          <LogoutIcon className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
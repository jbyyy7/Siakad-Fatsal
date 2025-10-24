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
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch announcements when notification dropdown is opened
  useEffect(() => {
    if (showNotifications && announcements.length === 0) {
      fetchAnnouncements();
    }
  }, [showNotifications]);

  const fetchUnreadCount = async () => {
    try {
      const count = await dataService.getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchAnnouncements = async () => {
    setIsLoadingAnnouncements(true);
    try {
      const data = await dataService.getUnreadAnnouncements();
      setAnnouncements(data.slice(0, 5));
      setUnreadCount(data.length);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      setAnnouncements([]);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  const handleMarkAsRead = async (announcementId: string) => {
    try {
      await dataService.markNotificationAsRead(announcementId);
      // Update local state
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const announcementIds = announcements.map(a => a.id);
      await dataService.markAllNotificationsAsRead(announcementIds);
      setAnnouncements([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
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
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-red-500 text-white text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[90vh] flex flex-col animate-fade-in-up origin-top-right">
              <div className="p-4 font-semibold text-gray-900 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span>Notifikasi</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {announcements.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
                  >
                    Tandai Semua Dibaca
                  </button>
                )}
              </div>
              
              {isLoadingAnnouncements ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-3"></div>
                  <p className="text-sm">Memuat notifikasi...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">Tidak ada notifikasi baru</p>
                  <p className="text-xs mt-1">Semua notifikasi sudah dibaca</p>
                </div>
              ) : (
                <ul className="flex-1 overflow-y-auto">
                  {announcements.map((announcement) => (
                    <li 
                      key={announcement.id} 
                      className="group px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors relative"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                        </div>
                        <div className="flex-1 min-w-0">
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
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(announcement.id);
                          }}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded hover:bg-brand-50"
                          title="Tandai sudah dibaca"
                        >
                          ✓
                        </button>
                      </div>
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
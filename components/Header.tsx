import React from 'react';
import { User } from '../types';
import { LogoutIcon } from './icons/LogoutIcon';
import { MenuIcon } from './icons/MenuIcon';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  pageTitle: string;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, pageTitle, onMenuClick }) => {
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
        <div className="hidden sm:flex flex-col items-end mr-4">
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
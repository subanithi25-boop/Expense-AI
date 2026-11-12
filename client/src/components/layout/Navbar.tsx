
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Search,
  Sun,
  Moon,
  Bell,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resolveNotificationPath } from '../../pages/NotificationsPage';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const { currentUser, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead
  } = useNotifications();

  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close notification menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notifMenuRef.current &&
        !notifMenuRef.current.contains(e.target as Node)
      ) {
        setShowNotifMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchQuery(e.target.value);

    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/expenses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-[#131B2E] border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">

      {/* Global Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="relative w-80 max-w-full"
      >
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search expenses, merchants, reports..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifMenuRef}>

          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />

            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1a233b] rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">

              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">

                <span className="font-semibold text-xs text-slate-900 dark:text-white">
                  Notifications ({unreadCount})
                </span>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
                  >
                    Mark all read
                  </button>
                )}

              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">

                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer ${
                        !n.read
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                          : ''
                      }`}
                      onClick={() => {
                        markAsRead(n.id);

                        const dest = resolveNotificationPath(n);

                        if (dest) navigate(dest);

                        setShowNotifMenu(false);
                      }}
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>{n.title}</span>

                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        )}
                      </div>

                      <p className="text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}

              </div>

              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-center">

                <button
                  onClick={() => {
                    navigate('/dashboard/notifications');
                    setShowNotifMenu(false);
                  }}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  View All Notifications
                </button>

              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">

          <img
            src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={currentUser?.name || 'User'}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />

          <div className="hidden md:block text-left">

            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {currentUser?.name || 'User'}
            </div>

            <div className="text-[10px] text-slate-400 capitalize">
              {role} {currentUser?.department ? `• ${currentUser.department}` : ''}
            </div>

          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-1"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
};

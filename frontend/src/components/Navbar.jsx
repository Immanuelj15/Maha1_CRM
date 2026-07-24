import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useNotificationStore } from '../store/notificationStore';
import { 
  Bell, Sun, Moon, Search, LogOut, User, 
  Menu, ShieldAlert, Calendar, Trophy, CreditCard 
} from 'lucide-react';

export default function Navbar({ onMobileMenuToggle, onSearchClick }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useSettingsStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 45s for live updates
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event': return <Calendar size={16} className="text-primary" />;
      case 'vessel': return <Trophy size={16} className="text-secondary" />;
      case 'payment': return <CreditCard size={16} className="text-success" />;
      default: return <ShieldAlert size={16} className="text-warning" />;
    }
  };

  return (
    <header className="sticky top-0 z-10 w-full h-[73px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between">
      {/* Left controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl focus:outline-none"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Bar Trigger */}
        <div 
          onClick={onSearchClick}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all duration-200 w-[240px] text-xs select-none"
        >
          <Search size={14} />
          <span>Search or type Ctrl + K</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Search trigger on very small screens */}
        <button 
          onClick={onSearchClick} 
          className="sm:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
        >
          <Search size={18} />
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all duration-200 focus:outline-none"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all duration-200 focus:outline-none"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute right-0 mt-2 w-[320px] max-h-[420px] overflow-y-auto rounded-premium glass-card shadow-premium p-4 z-20 border border-slate-200/50 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead} 
                        className="text-[11px] text-primary dark:text-secondary hover:underline font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 mt-2">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map(item => (
                        <div 
                          key={item._id}
                          onClick={() => {
                            if (item.status === 'unread') markAsRead(item._id);
                          }}
                          className={`p-3 rounded-xl transition-all duration-200 cursor-pointer flex gap-3 ${
                            item.status === 'unread' 
                              ? 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-70'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {getNotificationIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                              {item.message}
                            </p>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 block">
                              {item.date}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropper */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-xs font-bold font-sans">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
            </div>
            <span className="hidden sm:block text-xs font-medium truncate max-w-[100px] text-slate-700 dark:text-slate-300">
              {user?.username || 'Admin'}
            </span>
          </button>

          {/* Profile Menu Dropdown */}
          <AnimatePresence>
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute right-0 mt-2 w-[200px] rounded-premium glass-card shadow-premium p-2 z-20"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-100">
                      {user?.username || 'Chef Admin'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user?.email || 'admin@catermaster.com'}
                    </p>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        window.location.href = '/settings';
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-left"
                    >
                      <User size={14} />
                      Profile & Settings
                    </button>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs hover:bg-danger/5 text-danger font-medium text-left"
                    >
                      <LogOut size={14} />
                      Log out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UserPlus, Calendar, Carrot,
  DollarSign, Briefcase, Trophy, FileText,
  CreditCard, BarChart3, Settings, Menu, X, ChevronLeft, ChevronRight,
  Utensils, ShoppingBag
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import logoImg from '../assets/logo.png';

const navItems = [
  { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { path: '/customers', name: 'Customers', icon: Users },
  { path: '/new-customer', name: 'New Customer', icon: UserPlus },
  { path: '/events', name: 'Events', icon: Calendar },
  { path: '/menu', name: 'Menu', icon: Utensils },
  { path: '/vegetables', name: 'Vegetables', icon: Carrot },
  { path: '/groceries', name: 'Groceries', icon: ShoppingBag },
  { path: '/expenses', name: 'Expenses', icon: DollarSign },
  { path: '/labour', name: 'Labour', icon: Briefcase },
  { path: '/vessels', name: 'Vessels', icon: Trophy },
  { path: '/invoices', name: 'Invoices', icon: FileText },
  { path: '/payments', name: 'Payments', icon: CreditCard },
  { path: '/settings', name: 'Settings', icon: Settings },
];

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const { settings } = useSettingsStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className={`hidden md:flex flex-col h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 relative z-20 transition-all duration-300`}
        animate={{ width: isCollapsed ? '70px' : '260px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-primary text-white p-1 rounded-full border border-white dark:border-slate-800 shadow-md hover:bg-primary-hover focus:outline-none"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Branding header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 overflow-hidden h-[73px]">
          <img src={logoImg} alt="Logo" className="w-8 h-8 rounded-full object-contain bg-white border border-slate-200 dark:border-slate-800 flex-shrink-0" />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate"
            >
              {settings?.businessName || "Maha's Kitchen"}
            </motion.span>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary dark:text-secondary font-semibold border-l-4 border-primary'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                }`
              }
            >
              <item.icon size={20} className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm truncate"
                >
                  {item.name}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>
      </motion.aside>

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black z-30 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 bottom-0 left-0 w-[260px] bg-white dark:bg-slate-900 shadow-2xl z-40 p-5 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <img src={logoImg} alt="Logo" className="w-8 h-8 rounded-full object-contain bg-white border border-slate-200 dark:border-slate-800 flex-shrink-0" />
                  <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {settings?.businessName || "Maha's Kitchen"}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 focus:outline-none"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary dark:text-secondary font-semibold border-l-4 border-primary'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                      }`
                    }
                  >
                    <item.icon size={20} />
                    <span className="text-sm">{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

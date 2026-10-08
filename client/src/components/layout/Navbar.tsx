import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '../common/Button';
import { Plus, Target, Menu, X, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onOpenFocusMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu, onOpenFocusMode }) => {
  const { user, logout } = useAuth();
  const { setIsCreateModalOpen } = useTasks();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo & Mobile menu button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  ORBIT
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                    OS
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-medium">
                  Personal Work OS
                </span>
              </div>
            </Link>
          </div>

          {/* Right section: Quick actions, Theme, User profile */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Focus Mode button */}
            <button
              onClick={onOpenFocusMode}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              title="Launch Distraction-Free Focus Mode (Shortcut: F)"
            >
              <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Focus Mode</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded text-slate-500">
                F
              </kbd>
            </button>

            {/* Quick Task Create button */}
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
              className="shadow-sm"
              title="Create New Task (Shortcut: N)"
            >
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">New</span>
              <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.2 text-[10px] font-mono bg-indigo-800/60 text-white/90 rounded">
                N
              </kbd>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500 focus:outline-none transition-all"
                aria-label="User account menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-40 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out of ORBIT</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

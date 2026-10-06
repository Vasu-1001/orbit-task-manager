import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Radar,
  Calendar,
  Layers,
  Keyboard,
  Clock,
  AlertCircle,
  Flame,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobileMenu?: () => void;
  onOpenFocusMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobileMenu, onOpenFocusMode }) => {
  const { stats, updateFilter, setViewMode } = useTasks();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/tasks',
      label: 'All Tasks',
      icon: CheckSquare,
      badge: stats?.total,
    },
  ];

  return (
    <aside className="w-64 h-full flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 select-none">
      <div className="space-y-6">
        {/* Navigation Links */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Workspace
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobileMenu}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Quick Focus Mode action in sidebar */}
          <button
            onClick={() => {
              if (onCloseMobileMenu) onCloseMobileMenu();
              onOpenFocusMode();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-indigo-500" />
              <span>Focus Mode</span>
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              Live
            </span>
          </button>
        </div>

        {/* Workspace Quick Filters */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Priority Filters
          </p>

          <NavLink
            to="/tasks"
            onClick={() => {
              updateFilter('priority', 'urgent');
              if (onCloseMobileMenu) onCloseMobileMenu();
            }}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Urgent Priority</span>
            </div>
          </NavLink>

          <NavLink
            to="/tasks"
            onClick={() => {
              updateFilter('status', 'in_progress');
              if (onCloseMobileMenu) onCloseMobileMenu();
            }}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              <span>In Progress</span>
            </div>
            {stats?.inProgress ? (
              <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold">
                {stats.inProgress}
              </span>
            ) : null}
          </NavLink>

          <NavLink
            to="/tasks"
            onClick={() => {
              setViewMode('radar');
              if (onCloseMobileMenu) onCloseMobileMenu();
            }}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Radar className="w-3.5 h-3.5 text-amber-500" />
              <span>Deadline Radar</span>
            </div>
            {stats?.overdue ? (
              <span className="text-[11px] text-rose-500 font-bold">
                {stats.overdue} overdue
              </span>
            ) : null}
          </NavLink>
        </div>
      </div>

      {/* Footer shortcut hints */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Power Shortcuts</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>New Task</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">
              N
            </kbd>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>Focus Mode</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">
              F
            </kbd>
          </div>
        </div>
      </div>
    </aside>
  );
};

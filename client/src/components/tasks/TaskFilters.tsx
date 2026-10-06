import React from 'react';
import { useTasks } from '../../context/TaskContext';
import { Input } from '../common/Input';
import {
  Search,
  X,
  LayoutGrid,
  List,
  Radar,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import type { ViewMode, TaskStatus, TaskPriority } from '../../types';

export const TaskFilters: React.FC = () => {
  const { filters, updateFilter, resetFilters, viewMode, setViewMode, stats } = useTasks();

  const statusOptions: { label: string; value: TaskStatus | 'all'; count?: number }[] = [
    { label: 'All Tasks', value: 'all', count: stats?.total },
    { label: 'Pending', value: 'pending', count: stats?.pending },
    { label: 'In Progress', value: 'in_progress', count: stats?.inProgress },
    { label: 'Completed', value: 'completed', count: stats?.completed },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search tasks by title or keyword..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            rightIcon={
              filters.search ? (
                <button
                  onClick={() => updateFilter('search', '')}
                  className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null
            }
          />
        </div>

        {/* View Mode Toggle & Sort Options */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 shadow-sm text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sortBy || 'created_at'}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="created_at">Created Date</option>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title (A-Z)</option>
            </select>

            <button
              onClick={() =>
                updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
              }
              className="px-1 py-0.5 rounded text-[11px] font-mono hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              title="Toggle sort order"
            >
              {filters.sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Dense List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'radar'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Deadline Radar View"
            >
              <Radar className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Resets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statusOptions.map((opt) => {
            const isActive = (filters.status || 'all') === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateFilter('status', opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{opt.label}</span>
                {opt.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Priority Filter and Reset */}
        <div className="flex items-center gap-2">
          <select
            value={filters.priority || 'all'}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔥 Urgent Priority</option>
            <option value="high">⚡ High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {(filters.search ||
            (filters.status && filters.status !== 'all') ||
            (filters.priority && filters.priority !== 'all')) && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

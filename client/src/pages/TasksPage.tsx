import React from 'react';
import { useTasks } from '../context/TaskContext';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskListItem } from '../components/tasks/TaskListItem';
import { DeadlineRadar } from '../components/tasks/DeadlineRadar';
import { Button } from '../components/common/Button';
import { TaskCardSkeleton } from '../components/common/Skeleton';
import { Plus, CheckSquare, Sparkles } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { tasks, isLoading, viewMode, setIsCreateModalOpen, resetFilters, filters } = useTasks();

  const isFiltered =
    Boolean(filters.search) ||
    (filters.status && filters.status !== 'all') ||
    (filters.priority && filters.priority !== 'all');

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Title & Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <span>Task Workspace</span>
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Filter, prioritize, and track all deliverables across your personal OS.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
          className="shadow-sm"
        >
          <span>Create Task</span>
          <kbd className="hidden md:inline-block ml-1.5 px-1.5 py-0.2 text-[10px] font-mono bg-indigo-800/60 text-white/90 rounded">
            N
          </kbd>
        </Button>
      </div>

      {/* Filter and View Controls Toolbar */}
      <TaskFilters />

      {/* Content Rendering by View Mode */}
      {isLoading && tasks.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckSquare className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isFiltered ? 'No tasks match your filters' : 'Your workspace is clear'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {isFiltered
                ? 'Try adjusting your search keyword, status, or priority filters.'
                : 'Plan your next milestone, attach mockups, and track target deadlines.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            {isFiltered ? (
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Reset all filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create a task
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'radar' ? (
        <DeadlineRadar tasks={tasks} />
      ) : viewMode === 'list' ? (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskListItem key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

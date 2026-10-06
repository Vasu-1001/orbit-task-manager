import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { StatCard } from '../components/dashboard/StatCard';
import { TaskCard } from '../components/tasks/TaskCard';
import { FocusModeModal } from '../components/focus/FocusModeModal';
import { Button } from '../components/common/Button';
import { StatCardSkeleton, TaskCardSkeleton } from '../components/common/Skeleton';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Flame,
  ArrowRight,
  Plus,
  Layers,
  Sparkles,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { tasks, stats, isLoading, setIsCreateModalOpen, updateFilter, setViewMode } = useTasks();
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);

  // Take the 6 most recent tasks
  const recentTasks = tasks.slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Welcome Hero Banner */}
      <WelcomeBanner onOpenFocusMode={() => setIsFocusModeOpen(true)} />

      {/* Primary KPI Telemetry Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Workspace Overview</span>
          </h2>
          <span className="text-xs text-slate-400">Real-time metrics</span>
        </div>

        {isLoading && !stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Workload"
              value={stats?.total || 0}
              subtitle="All registered tasks"
              icon={Layers}
              variant="default"
              onClick={() => updateFilter('status', 'all')}
            />

            <StatCard
              title="In Progress"
              value={stats?.inProgress || 0}
              subtitle="Active work in flight"
              icon={Clock}
              variant="sky"
              onClick={() => updateFilter('status', 'in_progress')}
            />

            <StatCard
              title="Overdue Risk"
              value={stats?.overdue || 0}
              subtitle="Passed target deadline"
              icon={AlertCircle}
              variant={stats?.overdue && stats.overdue > 0 ? 'rose' : 'default'}
              trend={stats?.overdue && stats.overdue > 0 ? 'Action required' : 'Clear'}
              onClick={() => setViewMode('radar')}
            />

            <StatCard
              title="Completed"
              value={stats?.completed || 0}
              subtitle={`${stats?.completionRate || 0}% overall velocity`}
              icon={CheckCircle2}
              variant="emerald"
              onClick={() => updateFilter('status', 'completed')}
            />
          </div>
        )}
      </section>

      {/* Secondary Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Next 24 Hours
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {stats?.dueSoon || 0} tasks due soon
              </p>
            </div>
          </div>
          <Link
            to="/tasks"
            onClick={() => setViewMode('radar')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View Radar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pending Queue
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {stats?.pending || 0} tasks ready for pickup
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFocusModeOpen(true)}
          >
            Start Focus
          </Button>
        </div>
      </div>

      {/* Recent Tasks Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recent Activity & Tasks
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest items created or updated across your personal work OS
            </p>
          </div>

          <Link
            to="/tasks"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>See all {tasks.length} tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading && tasks.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Your workspace is empty
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Organize projects, plan deliverables, attach screenshots, and track deadlines.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create your first task
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      {/* Focus Mode Overlay */}
      <FocusModeModal
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
      />
    </div>
  );
};

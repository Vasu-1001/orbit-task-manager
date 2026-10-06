import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { Button } from '../common/Button';
import { Plus, Target, Sparkles, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface WelcomeBannerProps {
  onOpenFocusMode: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onOpenFocusMode }) => {
  const { user } = useAuth();
  const { stats, setIsCreateModalOpen } = useTasks();

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const completionRate = stats?.completionRate || 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-800/40 mb-8">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>{today}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {greeting}, {user?.name?.split(' ')[0] || 'Operator'}!
          </h1>

          <p className="text-sm text-indigo-200/90 leading-relaxed">
            {stats?.overdue && stats.overdue > 0
              ? `You have ${stats.overdue} overdue ${
                  stats.overdue === 1 ? 'task' : 'tasks'
                } requiring immediate focus, and ${stats.dueSoon} due in the next 24 hours.`
              : stats?.dueSoon && stats.dueSoon > 0
              ? `You have ${stats.dueSoon} upcoming ${
                  stats.dueSoon === 1 ? 'deadline' : 'deadlines'
                } in the next 24 hours. Let's make steady progress today.`
              : 'All your deadlines are clear! Keep up the momentum and conquer your goals.'}
          </p>

          {/* Real Velocity / Completion Progress Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-200 mb-1.5">
              <span>Sprint Completion Velocity</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-indigo-950/80 border border-indigo-800/40 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick CTA Actions */}
        <div className="flex flex-wrap sm:flex-col items-stretch gap-2.5 w-full md:w-auto shrink-0">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white text-indigo-900 hover:bg-indigo-50 border-transparent font-semibold shadow-md"
          >
            Create Task
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={<Target className="w-4 h-4 text-indigo-300" />}
            onClick={onOpenFocusMode}
            className="border-indigo-400/40 text-white hover:bg-indigo-800/40 font-medium"
          >
            Launch Focus Mode
          </Button>
        </div>
      </div>
    </div>
  );
};

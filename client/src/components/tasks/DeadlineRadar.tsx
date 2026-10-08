import React from 'react';
import type { Task } from '../../types';
import { TaskCard } from './TaskCard';
import { isToday, isPast, differenceInCalendarDays } from 'date-fns';
import { AlertCircle, Clock, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';

interface DeadlineRadarProps {
  tasks: Task[];
}

export const DeadlineRadar: React.FC<DeadlineRadarProps> = ({ tasks }) => {
  const now = new Date();

  // Group tasks into time horizons
  const overdue: Task[] = [];
  const dueToday: Task[] = [];
  const dueThisWeek: Task[] = [];
  const dueLater: Task[] = [];
  const noDeadline: Task[] = [];
  const completed: Task[] = [];

  for (const t of tasks) {
    if (t.status === 'completed') {
      completed.push(t);
      continue;
    }

    if (!t.due_date) {
      noDeadline.push(t);
      continue;
    }

    const dueDate = new Date(t.due_date);
    if (isPast(dueDate) && !isToday(dueDate)) {
      overdue.push(t);
    } else if (isToday(dueDate)) {
      dueToday.push(t);
    } else {
      const days = differenceInCalendarDays(dueDate, now);
      if (days <= 7) {
        dueThisWeek.push(t);
      } else {
        dueLater.push(t);
      }
    }
  }

  const sections = [
    {
      title: 'Overdue Hazards',
      count: overdue.length,
      icon: AlertCircle,
      accent: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      tasks: overdue,
      description: 'Tasks that passed their scheduled completion date.',
    },
    {
      title: 'Due Today (Critical Focus)',
      count: dueToday.length,
      icon: Clock,
      accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      tasks: dueToday,
      description: 'Priority tasks scheduled for completion before end of day.',
    },
    {
      title: 'Due in Next 7 Days',
      count: dueThisWeek.length,
      icon: Calendar,
      accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      tasks: dueThisWeek,
      description: 'Upcoming workload over the next week.',
    },
    {
      title: 'Upcoming & Backlog',
      count: dueLater.length + noDeadline.length,
      icon: ChevronRight,
      accent: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20',
      tasks: [...dueLater, ...noDeadline],
      description: 'Scheduled for future dates or general backlog items.',
    },
  ];

  return (
    <div className="space-y-8">
      {sections.map((sec) => (
        <section key={sec.title} className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className={`p-1.5 rounded-lg border ${sec.accent}`}>
                <sec.icon className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{sec.title}</span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {sec.count}
                  </span>
                </h3>
              </div>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">{sec.description}</p>
          </div>

          {sec.tasks.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">No active tasks in this horizon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sec.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
};

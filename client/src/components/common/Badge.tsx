import React from 'react';
import type { TaskStatus, TaskPriority } from '../../types';
import { AlertCircle, Clock, CheckCircle2, Flame, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import type { DueUrgency } from '../../utils/date';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs = {
    pending: {
      label: 'Pending',
      bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      icon: Clock,
      dot: 'bg-amber-500',
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
      icon: Clock,
      dot: 'bg-sky-500',
    },
    completed: {
      label: 'Completed',
      bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
      dot: 'bg-emerald-500',
    },
  };

  const config = configs[status];
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1.5' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const configs = {
    low: {
      label: 'Low',
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      icon: ArrowDown,
    },
    medium: {
      label: 'Medium',
      bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
      icon: ArrowRight,
    },
    high: {
      label: 'High',
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
      icon: ArrowUp,
    },
    urgent: {
      label: 'Urgent',
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
      icon: Flame,
    },
  };

  const config = configs[priority];
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

interface UrgencyBadgeProps {
  urgency: DueUrgency;
  text?: string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency, text }) => {
  if (urgency === 'none') return null;

  if (urgency === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <AlertCircle className="w-3 h-3" />
        {text || 'Overdue'}
      </span>
    );
  }

  if (urgency === 'due-today') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Clock className="w-3 h-3" />
        {text || 'Due Today'}
      </span>
    );
  }

  return null;
};

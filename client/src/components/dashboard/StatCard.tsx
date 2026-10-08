import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'amber' | 'sky' | 'emerald' | 'rose';
  trend?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  onClick,
}) => {
  const variantStyles = {
    default: {
      border: 'border-slate-200 dark:border-slate-800',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
    amber: {
      border: 'border-amber-200/80 dark:border-amber-950/60',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    },
    sky: {
      border: 'border-sky-200/80 dark:border-sky-950/60',
      iconBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
    },
    emerald: {
      border: 'border-emerald-200/80 dark:border-emerald-950/60',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    },
    rose: {
      border: 'border-rose-200/80 dark:border-rose-950/60',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-2xl border ${style.border} p-3.5 sm:p-5 shadow-subtle hover:shadow-premium transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
        <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {title}
        </span>
        <div className={`p-1.5 sm:p-2 rounded-xl shrink-0 ${style.iconBg}`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-1">
        <span className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </span>
        {trend && (
          <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';

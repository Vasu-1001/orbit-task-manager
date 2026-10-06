import { format, isToday, isTomorrow, isYesterday, isPast, differenceInCalendarDays } from 'date-fns';

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'No deadline';
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy');
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'No deadline';
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy · h:mm a');
}

export type DueUrgency = 'overdue' | 'due-today' | 'due-tomorrow' | 'upcoming' | 'none';

export function getDueStatus(dateString: string | null | undefined, isCompleted = false): DueUrgency {
  if (!dateString || isCompleted) return 'none';
  const date = new Date(dateString);

  if (isPast(date) && !isToday(date)) return 'overdue';
  if (isToday(date)) return 'due-today';
  if (isTomorrow(date)) return 'due-tomorrow';
  return 'upcoming';
}

export function formatRelativeDueDate(dateString: string | null | undefined, isCompleted = false): string {
  if (!dateString) return 'No deadline';
  if (isCompleted) return `Completed · ${formatDate(dateString)}`;

  const date = new Date(dateString);
  const now = new Date();

  if (isToday(date)) return 'Due today';
  if (isTomorrow(date)) return 'Due tomorrow';
  if (isYesterday(date)) return 'Overdue (Yesterday)';

  const daysDiff = differenceInCalendarDays(date, now);

  if (daysDiff < 0) {
    return `Overdue by ${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? 'day' : 'days'}`;
  }

  if (daysDiff <= 7) {
    return `Due in ${daysDiff} days (${format(date, 'EEE')})`;
  }

  return format(date, 'MMM d, yyyy');
}

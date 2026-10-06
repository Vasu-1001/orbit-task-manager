import React, { useState } from 'react';
import type { Task } from '../../types';
import { useTasks } from '../../context/TaskContext';
import { StatusBadge, PriorityBadge, UrgencyBadge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatRelativeDueDate, getDueStatus } from '../../utils/date';
import {
  Calendar,
  MoreVertical,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';

interface TaskListItemProps {
  task: Task;
}

export const TaskListItem: React.FC<TaskListItemProps> = ({ task }) => {
  const { toggleTaskStatus, setSelectedTask, setIsDetailsModalOpen, setIsEditModalOpen, deleteTask } =
    useTasks();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const urgency = getDueStatus(task.due_date, task.status === 'completed');
  const isCompleted = task.status === 'completed';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      setIsConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        onClick={() => {
          setSelectedTask(task);
          setIsDetailsModalOpen(true);
        }}
        className={`group flex items-center justify-between gap-4 p-3.5 sm:px-4 rounded-xl border transition-all duration-150 cursor-pointer ${
          isCompleted
            ? 'border-emerald-200/60 dark:border-emerald-950/40 bg-emerald-50/10 dark:bg-emerald-950/5'
            : urgency === 'overdue'
            ? 'border-rose-200/80 dark:border-rose-900/40 bg-rose-50/10 dark:bg-rose-950/5'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800'
        }`}
      >
        {/* Left: Checkbox & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskStatus(task.id);
            }}
            className="shrink-0 p-1 rounded-md text-slate-400 hover:text-indigo-600 transition-colors"
            title="Toggle task completion status"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white dark:text-slate-900" />
            ) : task.status === 'in_progress' ? (
              <Clock className="w-5 h-5 text-sky-500" />
            ) : (
              <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold truncate transition-colors ${
                  isCompleted
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {task.title}
              </span>
              {task.image_url && (
                <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" title="Has attachment" />
              )}
            </div>

            {task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Middle/Right: Badges & Deadlines */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <StatusBadge status={task.status} size="sm" />
            <PriorityBadge priority={task.priority} size="sm" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline truncate max-w-[120px]">
              {formatRelativeDueDate(task.due_date, isCompleted)}
            </span>
            <UrgencyBadge urgency={urgency} />
          </div>

          {/* Context Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white dark:bg-slate-850 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-30 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setSelectedTask(task);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                    Edit Task
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsConfirmOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${task.title}"?`}
        isConfirming={isDeleting}
      />
    </>
  );
};

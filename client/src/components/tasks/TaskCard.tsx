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

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
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
        className={`group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-5 shadow-subtle hover:shadow-premium hover:-translate-y-0.5 ${
          isCompleted
            ? 'border-emerald-200/80 dark:border-emerald-950/60 bg-emerald-50/20 dark:bg-emerald-950/10'
            : urgency === 'overdue'
            ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
            : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
        }`}
      >
        {/* Card Header: Badges and Quick Actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={task.status} size="sm" />
            <PriorityBadge priority={task.priority} size="sm" />
          </div>

          {/* Quick Context Menu */}
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Task options"
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

        {/* Task Title & Description */}
        <div className="space-y-2 mb-4">
          <h4
            className={`text-base font-semibold tracking-tight transition-colors line-clamp-2 ${
              isCompleted
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Task Image Preview (if present) */}
        {task.image_url && (
          <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 max-h-36 relative">
            <img
              src={task.image_url}
              alt={task.title}
              className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-medium text-white flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              <span>Attachment</span>
            </div>
          </div>
        )}

        {/* Card Footer: Due Date and Inline Status Switcher */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[140px]">
              {formatRelativeDueDate(task.due_date, isCompleted)}
            </span>
            <UrgencyBadge urgency={urgency} />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskStatus(task.id);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isCompleted
                ? 'text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-950/60'
                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
            }`}
            title={
              isCompleted
                ? 'Mark as Pending'
                : task.status === 'in_progress'
                ? 'Mark as Completed'
                : 'Mark as In Progress'
            }
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white dark:text-slate-900" />
            ) : task.status === 'in_progress' ? (
              <Clock className="w-4 h-4 text-sky-500" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500" />
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${task.title}"? Any associated cloud attachments will also be cleaned up.`}
        isConfirming={isDeleting}
      />
    </>
  );
};

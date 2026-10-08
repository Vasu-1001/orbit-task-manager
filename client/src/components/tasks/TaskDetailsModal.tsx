import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StatusBadge, PriorityBadge, UrgencyBadge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatDateTime, getDueStatus, formatRelativeDueDate } from '../../utils/date';
import {
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export const TaskDetailsModal: React.FC = () => {
  const {
    isDetailsModalOpen,
    setIsDetailsModalOpen,
    selectedTask,
    setIsEditModalOpen,
    toggleTaskStatus,
    deleteTask,
  } = useTasks();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  if (!selectedTask) return null;

  const isCompleted = selectedTask.status === 'completed';
  const urgency = getDueStatus(selectedTask.due_date, isCompleted);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(selectedTask.id);
      setIsConfirmOpen(false);
      setIsDetailsModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedTask.title}
        maxWidth="xl"
      >
        <div className="space-y-6">
          {/* Metadata chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedTask.status} />
              <PriorityBadge priority={selectedTask.priority} />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDateTime(selectedTask.due_date)}</span>
              <UrgencyBadge urgency={urgency} text={formatRelativeDueDate(selectedTask.due_date, isCompleted)} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Description
            </h4>
            {selectedTask.description ? (
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedTask.description}
              </p>
            ) : (
              <p className="text-sm italic text-slate-400 dark:text-slate-500">
                No description provided for this task.
              </p>
            )}
          </div>

          {/* Cloudinary Image Attachment Preview */}
          {selectedTask.image_url && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Attachment Preview
                </h4>
                <a
                  href={selectedTask.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Full Size</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div
                onClick={() => setIsImageZoomed(!isImageZoomed)}
                className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-zoom-in bg-slate-100 dark:bg-slate-800/60 group"
              >
                <img
                  src={selectedTask.image_url}
                  alt={selectedTask.title}
                  loading="lazy"
                  decoding="async"
                  className={`w-full object-contain transition-all duration-300 ${
                    isImageZoomed ? 'max-h-[600px]' : 'max-h-72'
                  }`}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Created: {new Date(selectedTask.created_at).toLocaleDateString()}</span>
            <span>Last Updated: {new Date(selectedTask.updated_at).toLocaleDateString()}</span>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              variant={isCompleted ? 'secondary' : 'primary'}
              size="sm"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => toggleTaskStatus(selectedTask.id)}
            >
              {isCompleted ? 'Mark Pending' : 'Mark Completed'}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Edit2 className="w-4 h-4" />}
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setIsEditModalOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => setIsConfirmOpen(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${selectedTask.title}"?`}
        isConfirming={isDeleting}
      />
    </>
  );
};

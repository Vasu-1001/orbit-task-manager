import React, { useState, useEffect, useRef } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import type { TaskStatus, TaskPriority } from '../../types';
import { api } from '../../services/api';
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const TaskModal: React.FC = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedTask,
    createTask,
    updateTask,
  } = useTasks();

  const { error: toastError } = useToast();

  const isEditing = isEditModalOpen && Boolean(selectedTask);
  const isOpen = isCreateModalOpen || isEditModalOpen;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);

  // Image Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string }>({});

  // Populate fields when editing or resetting
  useEffect(() => {
    if (isEditing && selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || '');
      setStatus(selectedTask.status);
      setPriority(selectedTask.priority);
      setImageUrl(selectedTask.image_url);
      setImagePublicId(selectedTask.image_public_id);

      if (selectedTask.due_date) {
        // Format ISO date to yyyy-MM-ddTHH:mm for datetime-local input
        const date = new Date(selectedTask.due_date);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
          date.getDate()
        )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        setDueDate(formatted);
      } else {
        setDueDate('');
      }
    } else {
      setTitle('');
      setDescription('');
      setStatus('pending');
      setPriority('medium');
      setDueDate('');
      setImageUrl(null);
      setImagePublicId(null);
    }

    setFormErrors({});
    setUploadError(null);
    setUploadProgress(null);
  }, [isEditing, selectedTask, isOpen]);

  const handleClose = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Image file change handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be smaller than 5 MB.');
      return;
    }

    // Validate image type (accept all image types)
    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|gif|svg|bmp|tiff?|ico|avif|heic|heif)$/i.test(file.name);
    if (!isImage) {
      setUploadError('Please select a valid image file (all image formats supported).');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(25);

    try {
      setUploadProgress(60);
      const res = await api.tasks.uploadImage(file);
      setUploadProgress(100);
      setImageUrl(res.url);
      setImagePublicId(res.publicId);
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed.');
      toastError(err.message, 'Upload Error');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 1000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImagePublicId(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setFormErrors({ title: 'Task title is required' });
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        image_url: imageUrl,
        image_public_id: imagePublicId,
      };

      if (isEditing && selectedTask) {
        await updateTask(selectedTask.id, payload);
      } else {
        await createTask(payload);
      }

      handleClose();
    } catch (err: any) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Task' : 'Create New Task'}
      description={
        isEditing
          ? 'Update details, timeline, and attachments for this task.'
          : 'Define task goals, deadlines, and attach reference files.'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <Input
          label="Task Title *"
          placeholder="e.g. Implement OAuth Flow or Write Weekly Report"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (formErrors.title) setFormErrors({});
          }}
          error={formErrors.title}
          autoFocus
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Add context, acceptance criteria, or key references..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        {/* Status, Priority & Due Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Completed', value: 'completed' },
            ]}
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Urgent', value: 'urgent' },
            ]}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 text-sm py-2 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Cloudinary Image Attachment Section */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Task Image Attachment (Cloudinary)
          </label>

          {imageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2">
              <div className="flex items-center gap-3">
                <img
                  src={imageUrl}
                  alt="Attachment preview"
                  className="w-20 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    Attached Cloud Asset
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Uploaded & optimized</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Remove image attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="task-file-upload"
              />
              <label
                htmlFor="task-file-upload"
                className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  isUploading
                    ? 'border-indigo-400 bg-indigo-50/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <UploadCloud className="w-6 h-6 text-indigo-500 mb-1" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {isUploading ? 'Uploading image to Cloudinary...' : 'Upload screenshot or mockups'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  All image formats supported (PNG, JPG, SVG, WEBP, GIF, etc.) up to 5 MB
                </span>
              </label>

              {/* Upload Progress Bar */}
              {uploadProgress !== null && (
                <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{uploadError}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting || isUploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isUploading}
          >
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Task, TaskStats, TaskFilterParams, ViewMode } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface TaskContextType {
  tasks: Task[];
  stats: TaskStats | null;
  isLoading: boolean;
  filters: TaskFilterParams;
  setFilters: React.Dispatch<React.SetStateAction<TaskFilterParams>>;
  updateFilter: (key: keyof TaskFilterParams, value: any) => void;
  resetFilters: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  isDetailsModalOpen: boolean;
  setIsDetailsModalOpen: (open: boolean) => void;
  fetchTasks: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, taskData: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
}

const defaultFilters: TaskFilterParams = {
  status: 'all',
  priority: 'all',
  search: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<TaskFilterParams>(defaultFilters);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('orbit_view_mode') as ViewMode) || 'grid';
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.tasks.getStats();
      setStats(res.stats);
    } catch (err: any) {
      console.warn('Could not fetch stats:', err.message);
    }
  }, [isAuthenticated]);

  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await api.tasks.getAll(filters);
      setTasks(res.tasks);
      // Simultaneously refresh stats
      fetchStats();
    } catch (err: any) {
      toastError(err.message, 'Failed to Load Tasks');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, filters, fetchStats, toastError]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    } else {
      setTasks([]);
      setStats(null);
    }
  }, [isAuthenticated, filters, fetchTasks]);

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('orbit_view_mode', mode);
  };

  const updateFilter = (key: keyof TaskFilterParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const createTask = async (taskData: Partial<Task>): Promise<Task> => {
    try {
      const res = await api.tasks.create(taskData);
      setTasks((prev) => [res.task, ...prev]);
      fetchStats();
      success('Task created successfully!', 'Task Added');
      setIsCreateModalOpen(false);
      return res.task;
    } catch (err: any) {
      toastError(err.message, 'Could Not Create Task');
      throw err;
    }
  };

  const updateTask = async (id: string, taskData: Partial<Task>): Promise<Task> => {
    try {
      const res = await api.tasks.update(id, taskData);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
      if (selectedTask?.id === id) {
        setSelectedTask(res.task);
      }
      fetchStats();
      success('Task updated successfully.', 'Updated');
      setIsEditModalOpen(false);
      return res.task;
    } catch (err: any) {
      toastError(err.message, 'Update Failed');
      throw err;
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    try {
      await api.tasks.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTask?.id === id) {
        setSelectedTask(null);
        setIsDetailsModalOpen(false);
      }
      fetchStats();
      success('Task removed from your workspace.', 'Deleted');
    } catch (err: any) {
      toastError(err.message, 'Deletion Failed');
      throw err;
    }
  };

  const toggleTaskStatus = async (id: string): Promise<void> => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    let nextStatus: Task['status'];
    if (task.status === 'pending') nextStatus = 'in_progress';
    else if (task.status === 'in_progress') nextStatus = 'completed';
    else nextStatus = 'pending';

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    );

    try {
      await api.tasks.update(id, { status: nextStatus });
      fetchStats();
    } catch (err: any) {
      // Revert optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: task.status } : t))
      );
      toastError(err.message, 'Status Change Failed');
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        stats,
        isLoading,
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        viewMode,
        setViewMode: handleSetViewMode,
        selectedTask,
        setSelectedTask,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        isDetailsModalOpen,
        setIsDetailsModalOpen,
        fetchTasks,
        fetchStats,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};

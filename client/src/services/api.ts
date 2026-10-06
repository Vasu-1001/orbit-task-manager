import type { Task, TaskStats, TaskFilterParams, User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('orbit_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('orbit_token', token);
    } else {
      localStorage.removeItem('orbit_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Support HttpOnly cookies
      });

      // Special handling for 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = data.details
          ? data.details.map((d: any) => d.message).join(', ')
          : data.message || data.error || `Request failed with status ${response.status}`;
        
        const error: any = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data as T;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Unable to connect to the ORBIT API server. Please check your network connection.');
      }
      throw err;
    }
  }

  // Authentication Endpoints
  auth = {
    register: (name: string, email: string, password: string) =>
      this.request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),

    login: (email: string, password: string) =>
      this.request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    logout: () =>
      this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
      }),

    me: () =>
      this.request<{ user: User }>('/auth/me', {
        method: 'GET',
      }),
  };

  // Task Endpoints
  tasks = {
    getAll: (filters?: TaskFilterParams) => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.priority && filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const qs = params.toString() ? `?${params.toString()}` : '';
      return this.request<{ tasks: Task[] }>(`/tasks${qs}`, {
        method: 'GET',
      });
    },

    getById: (id: string) =>
      this.request<{ task: Task }>(`/tasks/${id}`, {
        method: 'GET',
      }),

    create: (taskData: Partial<Task>) =>
      this.request<{ message: string; task: Task }>('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      }),

    update: (id: string, taskData: Partial<Task>) =>
      this.request<{ message: string; task: Task }>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(taskData),
      }),

    delete: (id: string) =>
      this.request<{ message: string; task: Task }>(`/tasks/${id}`, {
        method: 'DELETE',
      }),

    getStats: () =>
      this.request<{ stats: TaskStats }>('/tasks/stats', {
        method: 'GET',
      }),

    uploadImage: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      return this.request<{ message: string; url: string; publicId: string }>('/tasks/upload-image', {
        method: 'POST',
        body: formData,
      });
    },
  };
}

export const api = new ApiClient();

import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title cannot exceed 255 characters'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional()
    .nullable(),
  status: z
    .enum(['pending', 'in_progress', 'completed'], {
      errorMap: () => ({ message: "Status must be 'pending', 'in_progress', or 'completed'" }),
    })
    .default('pending')
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'], {
      errorMap: () => ({ message: "Priority must be 'low', 'medium', 'high', or 'urgent'" }),
    })
    .default('medium')
    .optional(),
  due_date: z
    .string()
    .datetime({ message: 'Due date must be a valid ISO 8601 date string' })
    .optional()
    .nullable(),
  image_url: z
    .string()
    .url('Image URL must be a valid URL')
    .or(z.string().startsWith('data:image/'))
    .optional()
    .nullable(),
  image_public_id: z
    .string()
    .optional()
    .nullable(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title cannot exceed 255 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, 'Description cannot exceed 5000 characters')
    .optional()
    .nullable(),
  status: z
    .enum(['pending', 'in_progress', 'completed'], {
      errorMap: () => ({ message: "Status must be 'pending', 'in_progress', or 'completed'" }),
    })
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'], {
      errorMap: () => ({ message: "Priority must be 'low', 'medium', 'high', or 'urgent'" }),
    })
    .optional(),
  due_date: z
    .string()
    .datetime({ message: 'Due date must be a valid ISO 8601 date string' })
    .optional()
    .nullable(),
  image_url: z
    .string()
    .url('Image URL must be a valid URL')
    .or(z.string().startsWith('data:image/'))
    .optional()
    .nullable(),
  image_public_id: z
    .string()
    .optional()
    .nullable(),
});

export const taskQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'all']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'all']).optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['due_date', 'created_at', 'priority', 'title']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryParams = z.infer<typeof taskQuerySchema>;

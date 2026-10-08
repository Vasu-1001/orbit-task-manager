import { query } from '../db/pool';
import { Task, TaskStats } from '../types';
import { CreateTaskInput, UpdateTaskInput, TaskQueryParams } from '../validators/task.validator';
import { CloudinaryService } from './cloudinary.service';

export class TaskService {
  /**
   * List tasks for the authenticated user with search, filter, and sort
   */
  static async getTasks(ownerId: string, params: TaskQueryParams): Promise<Task[]> {
    let sql = 'SELECT * FROM tasks WHERE owner_id = $1';
    const values: any[] = [ownerId];
    let paramIndex = 2;

    // Filter by status
    if (params.status && params.status !== 'all') {
      sql += ` AND status = $${paramIndex}`;
      values.push(params.status);
      paramIndex++;
    }

    // Filter by priority
    if (params.priority && params.priority !== 'all') {
      sql += ` AND priority = $${paramIndex}`;
      values.push(params.priority);
      paramIndex++;
    }

    // Search keyword in title or description
    if (params.search && params.search.trim() !== '') {
      sql += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      values.push(`%${params.search.trim()}%`);
      paramIndex++;
    }

    // Sorting
    const allowedSortFields = ['due_date', 'created_at', 'priority', 'title'];
    const sortBy = allowedSortFields.includes(params.sortBy || '') ? params.sortBy : 'created_at';
    const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

    if (sortBy === 'due_date') {
      // Put null due dates at the end
      sql += ` ORDER BY due_date IS NULL, due_date ${sortOrder}, created_at DESC`;
    } else {
      sql += ` ORDER BY ${sortBy} ${sortOrder}`;
    }

    const res = await query<Task>(sql, values);
    return res.rows;
  }

  /**
   * Get single task by ID (Enforcing User Isolation)
   */
  static async getTaskById(ownerId: string, taskId: string): Promise<Task> {
    const res = await query<Task>(
      'SELECT * FROM tasks WHERE id = $1 AND owner_id = $2',
      [taskId, ownerId]
    );

    if (res.rows.length === 0) {
      const err: any = new Error('Task not found.');
      err.statusCode = 404;
      throw err;
    }

    return res.rows[0];
  }

  /**
   * Create new task for authenticated user
   */
  static async createTask(ownerId: string, data: CreateTaskInput): Promise<Task> {
    const res = await query<Task>(
      `INSERT INTO tasks (title, description, status, priority, due_date, image_url, image_public_id, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.title,
        data.description || null,
        data.status || 'pending',
        data.priority || 'medium',
        data.due_date ? new Date(data.due_date) : null,
        data.image_url || null,
        data.image_public_id || null,
        ownerId,
      ]
    );

    return res.rows[0];
  }

  /**
   * Update existing task (Enforcing User Isolation)
   */
  static async updateTask(ownerId: string, taskId: string, data: UpdateTaskInput): Promise<Task> {
    // 1. Verify existence and ownership
    const existing = await this.getTaskById(ownerId, taskId);

    // If an existing image was removed or replaced, delete old asset from Cloudinary
    if (
      existing.image_public_id &&
      data.image_public_id !== undefined &&
      data.image_public_id !== existing.image_public_id
    ) {
      CloudinaryService.deleteImage(existing.image_public_id).catch((err) => {
        console.warn('[Cloudinary Warning] Cleanup failed:', err.message);
      });
    }

    // Prepare fields to update
    const title = data.title !== undefined ? data.title : existing.title;
    const description = data.description !== undefined ? data.description : existing.description;
    const status = data.status !== undefined ? data.status : existing.status;
    const priority = data.priority !== undefined ? data.priority : existing.priority;
    const dueDate = data.due_date !== undefined ? (data.due_date ? new Date(data.due_date) : null) : existing.due_date;
    const imageUrl = data.image_url !== undefined ? data.image_url : existing.image_url;
    const imagePublicId = data.image_public_id !== undefined ? data.image_public_id : existing.image_public_id;

    const res = await query<Task>(
      `UPDATE tasks
       SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, image_url = $6, image_public_id = $7
       WHERE id = $8 AND owner_id = $9
       RETURNING *`,
      [title, description, status, priority, dueDate, imageUrl, imagePublicId, taskId, ownerId]
    );

    // If due date was updated, reset reminder_sent_at to allow a new reminder for the updated deadline
    if (data.due_date !== undefined) {
      await query('UPDATE tasks SET reminder_sent_at = NULL WHERE id = $1 AND owner_id = $2', [taskId, ownerId]);
    }

    return res.rows[0];
  }

  /**
   * Delete task (Enforcing User Isolation and asset cleanup)
   */
  static async deleteTask(ownerId: string, taskId: string): Promise<Task> {
    // 1. Verify existence and ownership
    const existing = await this.getTaskById(ownerId, taskId);

    // 2. Remove Cloudinary media asset if associated
    if (existing.image_public_id) {
      CloudinaryService.deleteImage(existing.image_public_id).catch((err) => {
        console.warn('[Cloudinary Warning] Asset cleanup failed on delete:', err.message);
      });
    }

    // 3. Delete database record
    const res = await query<Task>(
      'DELETE FROM tasks WHERE id = $1 AND owner_id = $2 RETURNING *',
      [taskId, ownerId]
    );

    return res.rows[0];
  }

  /**
   * Aggregate task statistics for authenticated user
   */
  static async getStats(ownerId: string): Promise<TaskStats> {
    const tasksRes = await query<Task>(
      'SELECT status, due_date FROM tasks WHERE owner_id = $1',
      [ownerId]
    );

    const tasks = tasksRes.rows;
    const total = tasks.length;
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;
    let dueSoon = 0;

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (const t of tasks) {
      if (t.status === 'pending') pending++;
      else if (t.status === 'in_progress') inProgress++;
      else if (t.status === 'completed') completed++;

      if (t.status !== 'completed' && t.due_date) {
        const due = new Date(t.due_date);
        if (due < now) {
          overdue++;
        } else if (due <= in24Hours) {
          dueSoon++;
        }
      }
    }

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      dueSoon,
      completionRate,
    };
  }
}

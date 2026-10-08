import { Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { CloudinaryService } from '../services/cloudinary.service';
import { AuthenticatedRequest } from '../types';

export class TaskController {
  /**
   * GET /tasks/
   * List all tasks belonging to the authenticated user with optional filter/search/sort
   */
  static async getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const tasks = await TaskService.getTasks(ownerId, req.query as any);
      res.status(200).json({ tasks });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tasks/:id/
   * Retrieve a single task by ID (Enforces User Isolation)
   */
  static async getTaskById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const { id } = req.params;
      const task = await TaskService.getTaskById(ownerId, id);
      res.status(200).json({ task });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tasks/
   * Create a new task (Associates with Authenticated User)
   */
  static async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const task = await TaskService.createTask(ownerId, req.body);
      res.status(201).json({
        message: 'Task created successfully',
        task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /tasks/:id/
   * Update task by ID (Enforces User Isolation)
   */
  static async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const { id } = req.params;
      const task = await TaskService.updateTask(ownerId, id, req.body);
      res.status(200).json({
        message: 'Task updated successfully',
        task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /tasks/:id/
   * Delete task by ID (Enforces User Isolation & Media Cleanup)
   */
  static async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const { id } = req.params;
      const task = await TaskService.deleteTask(ownerId, id);
      res.status(200).json({
        message: 'Task deleted successfully',
        task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tasks/stats/
   * Aggregate statistics for authenticated user's workspace
   */
  static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!.id;
      const stats = await TaskService.getStats(ownerId);
      res.status(200).json({ stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tasks/upload-image/
   * Upload an image attachment securely to Cloudinary
   */
  static async uploadImage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'BadRequest',
          message: 'No image file provided in form-data.',
        });
        return;
      }

      const result = await CloudinaryService.uploadImage(
        req.file.buffer,
        'orbit_tasks',
        req.file.mimetype || 'image/jpeg'
      );

      res.status(200).json({
        message: 'Image uploaded successfully',
        url: result.url,
        publicId: result.publicId,
      });
    } catch (error) {
      next(error);
    }
  }
}

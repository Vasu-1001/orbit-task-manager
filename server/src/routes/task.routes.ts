import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from '../validators/task.validator';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// All task endpoints require active authentication
router.use(authenticate);

// Aggregated metrics and workspace stats
router.get('/stats', TaskController.getStats);

// Upload task image attachment
router.post('/upload-image', upload.single('image'), TaskController.uploadImage);

// Task CRUD
router.get('/', validateQuery(taskQuerySchema), TaskController.getTasks);
router.post('/', validateBody(createTaskSchema), TaskController.createTask);
router.get('/:id', TaskController.getTaskById);
router.put('/:id', validateBody(updateTaskSchema), TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);

export default router;

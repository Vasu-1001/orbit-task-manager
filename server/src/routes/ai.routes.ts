import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { aiChatSchema } from '../validators/ai.validator';
import { aiLimiter } from '../middleware/rateLimit';

const router = Router();

// Enforce JWT authentication on all AI routes
router.use(authenticate);

// Enforce AI rate limiting
router.use(aiLimiter);

// POST /api/ai/chat
router.post('/chat', validateBody(aiChatSchema), AiController.chat);
router.post('/', validateBody(aiChatSchema), AiController.chat);

export default router;

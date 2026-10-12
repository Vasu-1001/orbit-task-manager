import { Response, NextFunction } from 'express';
import { AiService } from '../services/ai.service';
import { AuthenticatedRequest } from '../types';

export class AiController {
  /**
   * POST /api/ai/chat
   * Process a message from the authenticated user with task context and Gemini AI
   */
  static async chat(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { message, history } = req.body;

      const result = await AiService.generateChatResponse(user, message, history || []);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import { TaskService } from './task.service';
import { AuthUser } from '../types';
import { AiChatMessage } from '../validators/ai.validator';

export interface AiChatResponse {
  reply: string;
  model: string;
}

// Regex to detect common medical/health queries for instant zero-latency refusal
const MEDICAL_TOPIC_REGEX =
  /\b(fever|headache|cough|cold|flu|infection|illness|sick|symptom|symptoms|medicine|medication|tablet|pill|paracetamol|ibuprofen|antibiotic|prescription|nausea|vomiting|stomach\s*ache|body\s*pain|doctor|hospital|clinic|treatment|cure|disease|virus|covid)\b/i;

export class AiService {
  /**
   * Generates a context-aware AI chat response powered by Google Gemini.
   * Strictly enforces user data isolation and task-management domain boundaries.
   */
  static async generateChatResponse(
    user: AuthUser,
    message: string,
    history: AiChatMessage[] = []
  ): Promise<AiChatResponse> {
    const trimmedMessage = message.trim();

    // 1. Instant Fast-Path: Reject medical & health questions immediately (< 1ms)
    if (MEDICAL_TOPIC_REGEX.test(trimmedMessage)) {
      return {
        reply: [
          `I am your **ORBIT Task Manager Assistant**.`,
          ``,
          `⚠️ I am specialized strictly in managing your tasks, deadlines, priorities, and workspace productivity. I **cannot provide medical or health advice**.`,
          ``,
          `If you are experiencing a fever or feeling unwell, please prioritize your health, rest, and consult a qualified medical professional.`,
          ``,
          `Would you like me to help you reschedule or postpone any upcoming tasks so you can rest?`,
        ].join('\n'),
        model: 'orbit-guardrail-filter',
      };
    }

    // 2. Fetch authenticated user's tasks and stats (strictly isolated by user.id)
    const [tasks, stats] = await Promise.all([
      TaskService.getTasks(user.id, { sortBy: 'created_at', sortOrder: 'desc' }),
      TaskService.getStats(user.id),
    ]);

    // 3. Sanitize task payload — include only non-sensitive operational fields
    const now = new Date();
    const sanitizedTasks = tasks.map((t) => {
      let isOverdue = false;
      let dueDateStr = 'None';

      if (t.due_date) {
        const d = new Date(t.due_date);
        isOverdue = d < now && t.status !== 'completed';
        dueDateStr = d.toISOString().split('T')[0];
      }

      return {
        id: t.id,
        title: t.title,
        description: t.description ? (t.description.length > 120 ? `${t.description.slice(0, 120)}...` : t.description) : null,
        status: t.status,
        priority: t.priority,
        dueDate: dueDateStr,
        isOverdue,
      };
    });

    const activeModel = config.gemini.model || 'gemini-flash-lite-latest';

    // 4. Graceful fallback if GEMINI_API_KEY is not configured
    if (!config.gemini.isConfigured || !config.gemini.apiKey.trim()) {
      const fallbackReply = [
        `Hello ${user.name}! I am **ORBIT AI**, your personal work operating system assistant.`,
        '',
        `⚠️ The Gemini API key (\`GEMINI_API_KEY\`) is not yet configured in the backend environment. Please set \`GEMINI_API_KEY\` in your \`.env\` file or hosting dashboard to enable full AI responses.`,
        '',
        `Here is a summary of your workspace based on your live database tasks:`,
        `- **Total Tasks:** ${stats.total}`,
        `- **Pending:** ${stats.pending}`,
        `- **In Progress:** ${stats.inProgress}`,
        `- **Completed:** ${stats.completed}`,
        `- **Overdue:** ${stats.overdue}`,
        `- **Due within 24h:** ${stats.dueSoon}`,
        `- **Completion Rate:** ${stats.completionRate}%`,
        '',
        sanitizedTasks.length === 0
          ? 'You currently have no tasks created. Press **N** or click **+ New Task** to create your first task!'
          : `You have ${sanitizedTasks.length} active task(s). Once the API key is configured, I can help you prioritize, schedule, and break them down into action steps!`,
      ].join('\n');

      return {
        reply: fallbackReply,
        model: 'orbit-local-fallback',
      };
    }

    // 5. Construct System Instruction with Strict Task-Management Guardrails
    const systemInstruction = `You are ORBIT AI, the personal productivity and task management assistant embedded in ORBIT — Personal Work OS.
You are assisting the user "${user.name}".
Current date/time: ${now.toUTCString()}.

AUTHENTICATED USER WORKSPACE SNAPSHOT:
- Total Tasks: ${stats.total} | Pending: ${stats.pending} | In Progress: ${stats.inProgress} | Completed: ${stats.completed} | Overdue: ${stats.overdue} | Due Soon (<24h): ${stats.dueSoon} | Velocity: ${stats.completionRate}%

CURRENT TASKS:
${sanitizedTasks.length === 0 ? 'No tasks currently exist in this user account.' : JSON.stringify(sanitizedTasks, null, 2)}

CRITICAL DOMAIN GUARDRAILS & RESTRICTIONS (ZERO TOLERANCE FOR OFF-TOPIC QUESTIONS):
1. STRICT TASK MANAGEMENT SCOPE:
   - You MUST ONLY answer questions directly related to task management, task priorities, schedules, deadlines, daily time-blocking, work planning, and ORBIT features.
   - YOU ARE STRICTLY FORBIDDEN from answering any off-topic questions, including:
     * Medical, illness, or health topics (fever, medicine, diagnosis, health advice).
     * Cooking, recipes, food preparation.
     * General trivia, history, geography, entertainment, movies, sports, politics, weather.
     * Coding challenges or writing code unrelated to the user's tasks.
     * Casual chit-chat or personal advice unrelated to workspace productivity.
   - If the user asks ANY off-topic or medical question, REFUSE IMMEDIATELY AND POLITELY:
     "I am the ORBIT Task Manager Assistant. I am specialized strictly in managing your tasks, deadlines, priorities, and workspace productivity. I cannot answer general or medical questions. How can I help you organize or prioritize your tasks today?"
2. CONCISE & FAST RESPONSES:
   - Keep all responses short, direct, and fast to read (2-4 bullet points or 1-2 concise paragraphs).
   - Never write long essays or rambling introductions. Get straight to the point.
3. READ-ONLY RESTRICTION:
   - You are in READ-ONLY mode. You cannot directly modify or delete tasks in the database.
   - Never claim you updated, created, or deleted a task. Guide the user on how they can perform the action in ORBIT.
4. ZERO TASKS HANDLING:
   - If the user has 0 tasks, inform them their list is empty and suggest clicking "+ New Task" or pressing 'N'.`;

    // 6. Sanitize and prepare conversation history
    const recentHistory = history.slice(-6);
    const formattedHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const item of recentHistory) {
      if (item.content && item.content.trim()) {
        formattedHistory.push({
          role: item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.content.trim() }],
        });
      }
    }

    while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
      formattedHistory.shift();
    }

    // 7. Invoke Gemini API with Ultra-Fast Generation Config
    try {
      const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
      const model = genAI.getGenerativeModel({
        model: activeModel,
        systemInstruction,
        generationConfig: {
          temperature: 0.2, // Low temperature for fastest, most deterministic output
          maxOutputTokens: 350, // Short responses return in ~1-2 seconds
        },
      });

      const chat = model.startChat({
        history: formattedHistory,
      });

      const result = await chat.sendMessage(trimmedMessage);
      const response = await result.response;
      const text = response.text();

      return {
        reply: text,
        model: activeModel,
      };
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      console.error('[Gemini AI Service Error]', errorMessage);

      // Handle common Gemini API errors gracefully
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        const error: any = new Error('The Gemini AI service quota limit has been reached. Please try again in a few moments.');
        error.statusCode = 429;
        throw error;
      }

      if (errorMessage.toLowerCase().includes('api key') || errorMessage.includes('API_KEY_INVALID')) {
        const error: any = new Error('The configured Gemini API key is invalid. Please verify GEMINI_API_KEY in the server configuration.');
        error.statusCode = 502;
        throw error;
      }

      if (errorMessage.includes('deadline') || errorMessage.toLowerCase().includes('timeout')) {
        const error: any = new Error('The request to Gemini AI timed out. Please try again.');
        error.statusCode = 504;
        throw error;
      }

      const error: any = new Error('Unable to complete AI request at this time. Please try again shortly.');
      error.statusCode = 503;
      throw error;
    }
  }
}

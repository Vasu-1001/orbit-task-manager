import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { initDb, memoryStore, query } from '../src/db/pool';

// Mock Google Gemini SDK in unit/integration tests to eliminate latency and rate-limit risks
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockImplementation((options: any) => ({
        startChat: vi.fn().mockImplementation(() => ({
          sendMessage: vi.fn().mockImplementation(async (_msg: string) => {
            const systemInstruction = options?.systemInstruction || '';
            const isZeroTasks = systemInstruction.includes('No tasks currently exist');
            const reply = isZeroTasks
              ? 'You currently have no tasks created. Press N or click + New Task to create one!'
              : 'You have 1 urgent task: Launch Q4 Product Roadmap. I suggest prioritizing this first today.';

            return {
              response: {
                text: () => reply,
              },
            };
          }),
        })),
      })),
    })),
  };
});

const app = createApp();

describe('AI Chatbot API Endpoints (/api/ai/chat)', () => {
  let userToken: string;
  let otherUserToken: string;
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testUser = {
    name: 'AI Tester',
    email: `ai-tester-${uniqueId}@example.com`,
    password: 'Password123!',
  };
  const otherUser = {
    name: 'Other AI User',
    email: `other-ai-${uniqueId}@example.com`,
    password: 'Password123!',
  };

  beforeAll(async () => {
    await initDb();
    memoryStore.reset();

    // Register test user
    const authRes = await request(app)
      .post('/auth/register')
      .send(testUser);
    expect(authRes.status).toBe(201);
    userToken = authRes.body.token;

    // Register other user
    const otherRes = await request(app)
      .post('/auth/register')
      .send(otherUser);
    expect(otherRes.status).toBe(201);
    otherUserToken = otherRes.body.token;

    // Create a task for testUser
    await request(app)
      .post('/tasks/')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Launch Q4 Product Roadmap',
        description: 'Complete sprint planning and resource allocation.',
        status: 'pending',
        priority: 'urgent',
        due_date: new Date(Date.now() + 86400000).toISOString(),
      });
  });

  afterAll(async () => {
    try {
      await query('DELETE FROM users WHERE email IN ($1, $2)', [
        testUser.email.toLowerCase(),
        otherUser.email.toLowerCase(),
      ]);
    } catch {
      // In-memory fallback cleanup
    }
  });

  it('POST /api/ai/chat - rejects request without authentication token with 401', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'What tasks do I have pending?' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Unauthorized');
  });

  it('POST /api/ai/chat - rejects empty prompt message with 400', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ message: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });

  it('POST /api/ai/chat - rejects message exceeding 2000 characters with 400', async () => {
    const longMessage = 'a'.repeat(2001);
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ message: longMessage });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });

  it('POST /api/ai/chat - accepts valid request and returns structured reply and model info', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        message: 'Can you summarize what tasks I should focus on today?',
        history: [],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body).toHaveProperty('model');
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply).toContain('Launch Q4 Product Roadmap');
  });

  it('POST /api/ai/chat - handles conversation history correctly without errors', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        message: 'Could you break down that first task into 3 sub-tasks?',
        history: [
          { role: 'user', content: 'What are my pending tasks?' },
          { role: 'model', content: 'You have 1 pending task: Launch Q4 Product Roadmap.' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
  });

  it('POST /api/ai/chat - ensures user isolation: other user with 0 tasks receives empty task context', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        message: 'Do I have any tasks?',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    // The other user has 0 tasks; the reply should not reference User A's task
    expect(res.body.reply).not.toContain('Launch Q4 Product Roadmap');
    expect(res.body.reply).toContain('no tasks created');
  });

  it('POST /api/ai/chat - rejects medical/health off-topic queries and redirects to task management', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        message: 'I have a high fever, what medicine should I take?',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body.reply).toContain('cannot provide medical or health advice');
    expect(res.body.reply).toContain('ORBIT Task Manager Assistant');
  });
});


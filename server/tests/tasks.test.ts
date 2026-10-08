import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { initDb, memoryStore, query } from '../src/db/pool';

const app = createApp();

describe('Task CRUD API Endpoints', () => {
  let authToken: string;
  let createdTaskId: string;
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const testUser = {
    name: 'Task Tester',
    email: `tester-${uniqueId}@example.com`,
    password: 'Password123!',
  };

  beforeAll(async () => {
    await initDb();
    memoryStore.reset();

    // Register a fresh unique user for this test run
    const authRes = await request(app)
      .post('/auth/register')
      .send(testUser);

    expect(authRes.status).toBe(201);
    authToken = authRes.body.token;
  });

  afterAll(async () => {
    try {
      await query('DELETE FROM users WHERE email = $1', [testUser.email.toLowerCase()]);
    } catch {
      // Ignore cleanup error if memory fallback
    }
  });

  it('POST /tasks/ - creates a new task with valid fields', async () => {
    const res = await request(app)
      .post('/tasks/')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Complete System Architecture Review',
        description: 'Verify database indexing, rate limiters, and error handling.',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('task');
    expect(res.body.task.title).toBe('Complete System Architecture Review');
    expect(res.body.task.status).toBe('pending');
    expect(res.body.task.priority).toBe('high');
    createdTaskId = res.body.task.id;
  });

  it('POST /tasks/ - rejects creation when title is empty', async () => {
    const res = await request(app)
      .post('/tasks/')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '   ',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  it('POST /tasks/ - rejects invalid status enum', async () => {
    const res = await request(app)
      .post('/tasks/')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Task with bad status',
        status: 'not_a_valid_status',
      });

    expect(res.status).toBe(400);
  });

  it('GET /tasks/ - retrieves task list for authenticated user', async () => {
    const res = await request(app)
      .get('/tasks/')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tasks');
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  it('GET /tasks/:id/ - retrieves a specific task by ID', async () => {
    const res = await request(app)
      .get(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.task.id).toBe(createdTaskId);
  });

  it('PUT /tasks/:id/ - updates task fields and status', async () => {
    const res = await request(app)
      .put(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'in_progress',
        priority: 'urgent',
      });

    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('in_progress');
    expect(res.body.task.priority).toBe('urgent');
  });

  it('GET /tasks/stats - computes task dashboard statistics', async () => {
    const res = await request(app)
      .get('/tasks/stats')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats).toHaveProperty('total');
    expect(res.body.stats).toHaveProperty('inProgress');
    expect(res.body.stats.inProgress).toBe(1);
  });

  it('DELETE /tasks/:id/ - deletes task record', async () => {
    const res = await request(app)
      .delete(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);

    // Verify subsequent lookup returns 404
    const getRes = await request(app)
      .get(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.status).toBe(404);
  });
});

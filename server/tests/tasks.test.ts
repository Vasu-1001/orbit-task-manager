import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { initDb, memoryStore } from '../src/db/pool';

const app = createApp();

describe('Task CRUD API Endpoints', () => {
  let authToken: string;
  let createdTaskId: string;

  beforeAll(async () => {
    await initDb();
    memoryStore.reset();

    // Register and login a user for testing
    const authRes = await request(app)
      .post('/auth/register')
      .send({
        name: 'Task Tester',
        email: 'tester@example.com',
        password: 'Password123!',
      });

    authToken = authRes.body.token;
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

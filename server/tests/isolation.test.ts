import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { initDb, memoryStore } from '../src/db/pool';

const app = createApp();

describe('Multi-User Data Isolation & Security Constraints', () => {
  let userAToken: string;
  let userBToken: string;
  let userATaskId: string;

  beforeAll(async () => {
    await initDb();
    memoryStore.reset();

    // 1. Create User A
    const resA = await request(app)
      .post('/auth/register')
      .send({
        name: 'User Alpha',
        email: 'alpha@example.com',
        password: 'PasswordAlpha123!',
      });
    userAToken = resA.body.token;

    // 2. Create User B
    const resB = await request(app)
      .post('/auth/register')
      .send({
        name: 'User Beta',
        email: 'beta@example.com',
        password: 'PasswordBeta123!',
      });
    userBToken = resB.body.token;

    // 3. User A creates a confidential task
    const taskRes = await request(app)
      .post('/tasks/')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: "User A's Confidential Task",
        description: 'Contains sensitive proprietary plans.',
        status: 'pending',
        priority: 'urgent',
      });
    userATaskId = taskRes.body.task.id;
  });

  it("User B CANNOT read User A's task (GET /tasks/:id returns 404)", async () => {
    const res = await request(app)
      .get(`/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
  });

  it("User B CANNOT update User A's task (PUT /tasks/:id returns 404)", async () => {
    const res = await request(app)
      .put(`/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        title: 'Tampered by User B!',
        status: 'completed',
      });

    expect(res.status).toBe(404);

    // Verify task in DB was NOT changed
    const verifyRes = await request(app)
      .get(`/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(verifyRes.body.task.title).toBe("User A's Confidential Task");
    expect(verifyRes.body.task.status).toBe('pending');
  });

  it("User B CANNOT delete User A's task (DELETE /tasks/:id returns 404)", async () => {
    const res = await request(app)
      .delete(`/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);

    // Verify task still exists for User A
    const verifyRes = await request(app)
      .get(`/tasks/${userATaskId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.task.id).toBe(userATaskId);
  });

  it("User B's task list (GET /tasks/) does NOT leak User A's tasks", async () => {
    const res = await request(app)
      .get('/tasks/')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBe(0);
  });

  it("Client cannot forge owner_id in task creation payload", async () => {
    const dummyOwnerId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .post('/tasks/')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        title: 'Task with spoofed owner',
        owner_id: dummyOwnerId,
      });

    expect(res.status).toBe(201);
    // Verified task must be owned by authenticated user (User B), never the spoofed ID
    expect(res.body.task.owner_id).not.toBe(dummyOwnerId);
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { initDb, memoryStore } from '../src/db/pool';

const app = createApp();

describe('Authentication API Endpoints', () => {
  beforeAll(async () => {
    await initDb();
    memoryStore.reset();
  });

  const testUser = {
    name: 'Sarah Connor',
    email: 'sarah.connor@example.com',
    password: 'SecurePassword123!',
  };

  it('POST /auth/register - successfully registers a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.name).toBe(testUser.name);
    expect(res.body).toHaveProperty('token');
    // Ensure password_hash is not leaked
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('POST /auth/register - rejects duplicate email address with 409 Conflict', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /auth/register - validates payload and rejects short password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123', // too short, no letters
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  it('POST /auth/login - successfully logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
  });

  it('POST /auth/login - rejects incorrect password with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
  });

  it('GET /auth/me - returns user profile with valid Bearer token', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(testUser.email.toLowerCase());
  });

  it('GET /auth/me - rejects request with missing token (401)', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });
});

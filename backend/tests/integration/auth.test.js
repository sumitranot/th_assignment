import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { TEST_PASSWORD } from '../setup/testDb.js';

describe('Integration: Authentication API', () => {
  it('POST /api/auth/login returns token and user profile on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'alice',
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toEqual({
      id: expect.any(String),
      username: 'alice',
      name: 'Alice Submitter',
      role: 'submitter',
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/login returns 401 with standard envelope on incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'alice',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'unauthorized',
        message: 'Invalid credentials',
      },
    });
  });

  it('POST /api/auth/login returns 401 on non-existent username (constant error)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'nonexistent-user',
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
    expect(res.body.error.message).toBe('Invalid credentials');
  });

  it('POST /api/auth/login returns 400 when username or password missing', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: '',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
    expect(res.body.error.details).toHaveProperty('username');
    expect(res.body.error.details).toHaveProperty('password');
  });

  it('GET /api/auth/me returns active user details when authenticated', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      username: 'riley',
      password: TEST_PASSWORD,
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: expect.any(String),
      username: 'riley',
      name: 'Riley Reviewer',
      role: 'reviewer',
    });
  });

  it('GET /api/auth/me returns 401 when token is missing', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('GET /api/auth/me returns 401 when token is invalid or malformed', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.payload');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
    expect(res.body.error.message).toContain('Invalid authentication token');
  });

  it('GET /api/auth/me returns 401 when token is expired', async () => {
    const expiredToken = jwt.sign(
      { id: 'some-id', username: 'alice', role: 'submitter' },
      env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
    expect(res.body.error.message).toContain('expired');
  });
});

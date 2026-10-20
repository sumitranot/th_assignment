import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';

describe('Integration: Error Envelope & Global Handlers', () => {
  it('returns standard error envelope on 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-endpoint');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: 'not_found',
        message: expect.stringContaining('/api/unknown-endpoint'),
      },
    });
  });

  it('returns standard error envelope on 400 for malformed JSON request bodies', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ "invalidJson": broken, }');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'validation_error',
        message: 'Malformed JSON payload in request body',
      },
    });
  });

  it('standard error envelope structure is consistent across all error codes', async () => {
    // 401 Unauthorized
    const res401 = await request(app).get('/api/documents');
    expect(res401.status).toBe(401);
    expect(res401.body.error).toHaveProperty('code');
    expect(res401.body.error).toHaveProperty('message');

    // 404 Not Found
    const res404 = await request(app).get('/api/non-existent');
    expect(res404.status).toBe(404);
    expect(res404.body.error).toHaveProperty('code');
    expect(res404.body.error).toHaveProperty('message');
  });
});

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { TEST_PASSWORD } from '../setup/testDb.js';

describe('Integration: Concurrent Status Review Decisions', () => {
  it('guarantees race-safety: when two reviewers decide the same pending document simultaneously, exactly one succeeds and one receives 409', async () => {
    // 1. Authenticate submitter and two reviewers
    const aliceRes = await request(app).post('/api/auth/login').send({
      username: 'alice',
      password: TEST_PASSWORD,
    });
    const rileyRes = await request(app).post('/api/auth/login').send({
      username: 'riley',
      password: TEST_PASSWORD,
    });
    const rohanRes = await request(app).post('/api/auth/login').send({
      username: 'rohan',
      password: TEST_PASSWORD,
    });

    const aliceToken = aliceRes.body.token;
    const rileyToken = rileyRes.body.token;
    const rohanToken = rohanRes.body.token;

    // 2. Submitter submits a single pending document
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'Concurrent Decision Target Document')
      .field('textContent', 'Content to be reviewed by racing reviewers.');

    expect(createRes.status).toBe(201);
    const docId = createRes.body.id;

    // 3. Fire simultaneous PATCH requests from both reviewers
    const [res1, res2] = await Promise.all([
      request(app)
        .patch(`/api/documents/${docId}/status`)
        .set('Authorization', `Bearer ${rileyToken}`)
        .send({ status: 'approved', comment: 'Riley approved this proposal' }),
      request(app)
        .patch(`/api/documents/${docId}/status`)
        .set('Authorization', `Bearer ${rohanToken}`)
        .send({ status: 'rejected', comment: 'Rohan rejected this proposal' }),
    ]);

    const statuses = [res1.status, res2.status].sort();

    // Exactly one must be 200 (the winner) and one must be 409 (the loser)
    expect(statuses).toEqual([200, 409]);

    const conflictRes = res1.status === 409 ? res1 : res2;
    expect(conflictRes.body.error.code).toBe('invalid_transition');
    expect(conflictRes.body.error.message).toContain('already been decided');

    // 4. Verify document in database reflects the winner's decision
    const finalDoc = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${rileyToken}`);

    expect(finalDoc.status).toBe(200);
    expect(['approved', 'rejected']).toContain(finalDoc.body.status);
    expect(finalDoc.body.reviewedBy).not.toBeNull();
  });
});
